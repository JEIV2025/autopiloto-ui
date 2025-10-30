import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvent } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Polyline } from 'react-leaflet';
import '../style/MapView.css';
import { useTelemetry } from './TelemetryContext';
import boteImg from '../images/bote.png';
import baseImg from '../images/base_telemetria.png';

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
    const hasValidCoords = Number.isFinite(lat) && Number.isFinite(lon);
    if (seguirBarco && hasValidCoords) {
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
  html: `<img src="${baseImg}" style="width:40px;height:40px;" alt="base" />`,
  iconSize: [20, 20],
  iconAnchor: [25, 25], // centro del ícono
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


const MapView = ({ waypoints, fullscreen, onAddWaypoint, progressIdx, currentPos, simBoatHeading, simulatedPath }) => {
  
  const [seguirBarco, setSeguirBarco] = useState(true);

  // Posición inicial fija para trazar el primer tramo (no sigue al bote)
  const initialPosRef = useRef(null);

  
  const { telemetry } = useTelemetry();
  
  // Usa la posición simulada si está disponible
  const latitud = currentPos?.lat ?? -34.5873;
  const longitud = currentPos?.lon ?? -58.33674;
  
  // Determinar el rumbo según el estado:
  // - Si hay simBoatHeading (simulando), usar ese rumbo
  // - Si no hay simulación, usar el rumbo de telemetría del bote físico
  const rumbo = simBoatHeading ?? (telemetry?.rumbo ? 360 - telemetry.rumbo : 0) ?? currentPos?.rumbo ?? 0;

  const pitch = telemetry?.pitch ?? 0;
  const roll = telemetry?.roll ?? 0;
  const usandoValoresPorDefecto =
    telemetry?.lat === undefined || telemetry?.lon === undefined;

    const latQuery = latitud.toFixed(6);
const lonQuery = longitud.toFixed(6);

// Indexar mapas una única vez al montar
useEffect(() => {
  const lat = currentPos?.lat ?? -34.5873;
  const lon = currentPos?.lon ?? -58.33674;

  fetch(`http://localhost:3001/index?lat=${lat}&lon=${lon}`)
    .then(res => res.json())
    .then(data => console.log('Indexado seamark:', data))
    .catch(err => console.error('Error al indexar mapas:', err));
}, []);



  // Fijar posición inicial si aún no existe y restablecerla cuando progressIdx vuelve a 0
  useEffect(() => {
    const hasValid = Number.isFinite(latitud) && Number.isFinite(longitud);
    if (!initialPosRef.current && hasValid) {
      initialPosRef.current = { lat: latitud, lon: longitud };
    }
    if (progressIdx === 0 && hasValid) {
      initialPosRef.current = { lat: latitud, lon: longitud };
    }
  }, [latitud, longitud, progressIdx]);

  // Distancia Haversine (km)
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = deg => deg * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }


  return (

    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      {/* ⚠️ Notificación si se usan coordenadas por defecto */}
      {usandoValoresPorDefecto && (
        <div
        className="text-center"
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
  url={`http://localhost:3001/tiles/{z}/{x}/{y}.png`}
  attribution="Mapas cacheados localmente"
/>

{/* Capa extra: capa seamark (marcas náuticas) */}
<TileLayer
  url={`http://localhost:3001/seamark/{z}/{x}/{y}.png`}
  attribution="OpenSeaMap Local"
/>



      {/* Trazos de navegación perfectamente sincronizados con el estado secuencial */}
      {(() => {
        // Tramos entre: posición inicial fija -> WP0, y WPi -> WPi+1
        const wps = waypoints.filter(
          wp => wp.id !== 'Base' && typeof wp.lat === 'number' && typeof wp.lon === 'number' && !isNaN(wp.lat) && !isNaN(wp.lon)
        );
        if (wps.length === 0) return null;

        const points = initialPosRef.current ? [initialPosRef.current, ...wps] : [...wps];
        if (points.length < 2) return null;

        const polylines = [];

        // Detectar si estamos en zona de llegada del waypoint actual
        const idxActual = progressIdx;
        let estaEnZona = false;
        if (idxActual >= 0 && idxActual < points.length - 1) {
          const toA = points[idxActual + 1];
          const distKmActual = haversineDistance(latitud, longitud, toA.lat, toA.lon);
          estaEnZona = Number.isFinite(distKmActual) && distKmActual < 0.05; // 50m
        }

        const incluyeInicial = Boolean(initialPosRef.current);
        for (let i = 0; i < points.length - 1; i++) {
          const from = points[i];
          const to = points[i + 1];
          // Índice del waypoint de destino de este tramo dentro de wps
          const destIdx = incluyeInicial ? i : i + 1;

          let color = 'red';
          if (destIdx < progressIdx) {
            color = 'green';
          } else if (destIdx === progressIdx) {
            color = estaEnZona ? 'yellow' : 'blue';
          }
          polylines.push(
            <Polyline
              key={`wp-${i}-${progressIdx}-${estaEnZona ? 1 : 0}`}
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
  const baseWp = waypoints.find(wp => wp.id === 'Base');
  if (baseWp && typeof baseWp.lat === 'number' && typeof baseWp.lon === 'number') {
    return (
      <Marker
        key="Base"
        position={[baseWp.lat, baseWp.lon]}
        icon={baseIcon}
      >
        <Popup>
          <strong>🏠 Base</strong><br />
          Lat: {baseWp.lat.toFixed(4)}<br />
          Lon: {baseWp.lon.toFixed(4)}<br />
          Estado: 🏠 Punto de partida
        </Popup>
      </Marker>
    );
  }
  return null;
})()}

      {/* Marcadores de waypoints */}
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
        className='boteImg'
        position={[latitud, longitud]}
        icon={L.divIcon({
          className: 'boat-marker',
          html: `<img src="${boteImg}" style="width:50px;transform:rotate(${rumbo}deg);" alt="bote" />`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        })}
      >
        <Popup>
          📍 Posición Actual<br />
          Rumbo: {rumbo?.toFixed(2)}°<br />
        </Popup>
    </Marker>

    {/* Línea punteada entre waypoints eliminada */}

    {/* Recorrido simulado (estela punteada) */}
{simulatedPath && simulatedPath.length > 1 && (
  <Polyline
    positions={simulatedPath.map(p => [p.lat, p.lon])}
    color="#0f0f0fff"
    dashArray="4"
    weight={3}
    opacity={0.7}
  />
)}


    </MapContainer >
    </div>
  );
};

export default MapView;


