import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvent } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Polyline } from 'react-leaflet';
import '../style/MapView.css';
import { useTelemetry } from './TelemetryContext';

// Corrección para íconos por defecto en Leaflet

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Eliminar baseIcon personalizado

// Componente para arreglar el resize
const MapFixer = ({ trigger, seguirBarco, lat, lon }) => {
  const map = useMap();
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 300);
    const t2 = setTimeout(() => map.invalidateSize(), 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map, trigger]);

    // Centrar mapa si está activado seguirBarco
  useEffect(() => {
    if (seguirBarco && lat && lon) {
      map.setView([lat, lon]);
    }
  }, [lat, lon, seguirBarco, map]);

  return null;
};

const AddWaypointOnClick = ({ onAdd }) => {
  useMapEvent('click', (e) => {
    onAdd(e.latlng);
  });
  return null;
};

const FeedbackClickSeguir = () => {
  useMapEvent('click', (e) => {
    const popup = L.popup()
      .setLatLng(e.latlng)
      .setContent('📍 Seguimiento Activado')
      .openOn(e.target);

    // Cerrar el popup después de 1 segundo
    setTimeout(() => {
      e.target.closePopup(popup);
    }, 750);
  });

  return null;
};


const baseIcon = L.divIcon({
  className: 'base-icon',
  iconSize: [50, 50],
  iconAnchor: [30, 30], // centro del ícono
  popupAnchor: [0, -20], // para que el popup salga arriba
});
// Icono de waypoint completado
const iconCompletado = L.divIcon({
  className: 'completed-icon',
  html: `<div style="color: green; font-size: 20px;">✅</div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const iconPendiente = L.divIcon({
  className: 'pending-icon',
  html: `<div style="color: gray; font-size: 20px;">📍</div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});


const MapView = ({ waypoints, fullscreen, onAddWaypoint, progressIdx }) => {
  
  const [seguirBarco, setSeguirBarco] = useState(true);

  
  const { telemetry } = useTelemetry();
  
  const latitud = telemetry?.lat ?? -34.5873;
  const longitud = telemetry?.lon ?? -58.33674;
  const rumbo = telemetry?.rumbo ?? 0;
  const pitch = telemetry?.pitch ?? 0;
  const roll = telemetry?.roll ?? 0;
  const usandoValoresPorDefecto =
    telemetry?.lat === undefined || telemetry?.lon === undefined;

    const latQuery = latitud.toFixed(6);
const lonQuery = longitud.toFixed(6);



  return (

    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      {/* ⚠️ Notificación si se usan coordenadas por defecto */}
      {usandoValoresPorDefecto && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(255, 193, 7, 0.9)',
            color: '#000',
            padding: '6px 12px',
            borderRadius: '4px',
            zIndex: 1000,
            fontWeight: 'bold',
          }}
        >
          ⚠️ Mostrando ubicación inicial predeterminada
        </div>
      )}


    <MapContainer
      key={progressIdx} // Forzar re-montaje cuando cambia progressIdx
      center={[latitud, longitud]}
      zoom={12}
      minZoom={10}
      maxZoom={14}
      style={{ height: '100%', width: '100%' }}
    >
     <MapFixer trigger={fullscreen} seguirBarco={seguirBarco} lat={latitud} lon={longitud} />
  {seguirBarco ? <FeedbackClickSeguir /> : <AddWaypointOnClick onAdd={onAddWaypoint} />}

<div
  className={`centrar-btn ${seguirBarco ? 'activo' : ''}`}
  onClick={() => setSeguirBarco(prev => !prev)}
  title="Centrar mapa"
/>



{/* Capa base: tiles de OpenStreetMap cacheados */}
<TileLayer
  url={`http://localhost:3001/tiles/{z}/{x}/{y}.png?lat=${latitud}&lon=${longitud}`}
  attribution="Mapas cacheados localmente"
/>

{/* Capa extra: capa seamark (marcas náuticas) */}
<TileLayer
  url={`http://localhost:3001/seamark/{z}/{x}/{y}.png?lat=${latitud}&lon=${longitud}`}
  attribution="OpenSeaMap Local"
/>



      {/* Trazos de navegación perfectamente sincronizados con el estado secuencial */}
      {(() => {
        const wps = waypoints.filter(wp => wp.id !== 'Base' && typeof wp.lat === 'number' && typeof wp.lon === 'number' && !isNaN(wp.lat) && !isNaN(wp.lon));
        if (wps.length === 0) return null;
        const polylines = [];
        // Tramo desde la posición actual al primer waypoint
        if (wps.length > 0) {
          let color = 'blue';
          if (progressIdx > 0) color = 'green';
          polylines.push(
            <Polyline
              key="from-current"
              positions={[[latitud, longitud], [wps[0].lat, wps[0].lon]]}
              color={color}
              weight={4}
            />
          );
        }
        // Tramos entre waypoints
        for (let i = 0; i < wps.length - 1; i++) {
          const from = wps[i];
          const to = wps[i + 1];
          let color = 'red';
          if (i < progressIdx - 1) color = 'green'; // Completados
          else if (i === progressIdx - 1) color = 'blue'; // En camino
          // El resto es rojo
          polylines.push(
            <Polyline
              key={`wp-${i}`}
              positions={[[from.lat, from.lon], [to.lat, to.lon]]}
              color={color}
              weight={4}
            />
          );
        }
        return polylines;
      })()}

      {/* Marcador de la base */}
{(() => {
  const wps = waypoints.filter(wp => wp.id !== 'Base' && typeof wp.lat === 'number' && typeof wp.lon === 'number');
  return wps.map((wp, idx) => {
    const isCompletado = idx < progressIdx;
    const isActual = idx === progressIdx;

    return (
      <Marker
        key={wp.id}
        position={[wp.lat, wp.lon]}
        icon={isCompletado ? iconCompletado : iconPendiente}
      >
        <Popup>
          <strong>{wp.id}</strong><br />
          Lat: {wp.lat.toFixed(4)}<br />
          Lon: {wp.lon.toFixed(4)}<br />
          Estado: {isCompletado ? '✅ Completado' : isActual ? '🧭 En camino' : '🔜 Pendiente'}
        </Popup>
      </Marker>
    );
  });
})()}





      {/* Posición Actual */}
      <Marker
        position={[latitud, longitud]}
        icon={L.divIcon({
          className: 'boat-marker',
          html: `<div class="boat-icon" style="transform: rotate(${rumbo}deg);"></div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20], // centro
        })}
      >
          <Popup>
          📍 Posición Actual<br />
          Rumbo: {rumbo?.toFixed(2)}°<br />
          Pitch: {pitch?.toFixed(2)}°<br />
          Roll: {roll?.toFixed(2)}°
        </Popup>
        </Marker>


  
    </MapContainer >
    </div>
  );
};

export default MapView;


