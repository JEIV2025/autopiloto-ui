import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvent } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Polyline } from 'react-leaflet';
import '../style/MapView.css';
import { useTelemetry } from './TelemetryContext';
import boteImg from '../images/bote.png';
import dronImg from '../images/drone.jpeg';
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
      .setContent(' Seguimiento Activado')
      .openOn(e.target);

    // Cerrar el popup después de 1 segundo
    setTimeout(() => {
      e.target.closePopup(popup);
    }, 750);
  });

  return null;
};


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


const MapView = ({ waypoints, 
                  fullscreen, 
                  onAddWaypoint, 
                  progressIdx, 
                  currentPos, 
                  simBoatHeading, 
                  simulatedPath,
                  mode,
                  rutaCargada
                 }) => {
  
  const [seguirBarco, setSeguirBarco] = useState(true);


 const vehicleImg = mode === "aereo" ? dronImg : boteImg;
const vehicleLabel = mode === "aereo" ? "UAV" : "USV";


  const { telemetry } = useTelemetry();
  
  // Usa la posición simulada si está disponible
  const latitud = currentPos?.lat ?? -34.5884060;
  const longitud = currentPos?.lon ?? -58.3665789;
  
  // Determinar el rumbo según el estado:
  // - Si hay simBoatHeading (simulando), usar ese rumbo
  // - Si no hay simulación, usar el rumbo de telemetría del bote físico
const haySimulacion =
  simBoatHeading !== null &&
  simBoatHeading !== undefined;

const rumbo =
  haySimulacion
    ? simBoatHeading
    : telemetry?.rumbo !== undefined
    ? 360 - Number(telemetry.rumbo)
    : currentPos?.rumbo ?? 0;

const rumboVisual = haySimulacion
  ? rumbo
  : 360 - rumbo;

const rotationStyle =
  mode === "aereo"
    ? ""
    : `transform:rotate(${rumboVisual}deg);`;

  const pitch = telemetry?.pitch ?? 0;
  const roll = telemetry?.roll ?? 0;
  const usandoValoresPorDefecto =
    telemetry?.lat === undefined || telemetry?.lon === undefined;

    const latQuery = latitud.toFixed(6);
const lonQuery = longitud.toFixed(6);


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

  const iconRutaInicio = L.divIcon({
  className: 'ruta-inicio-icon',
  html: `<div style="font-size:24px;">🟢</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const iconRutaFin = L.divIcon({
  className: 'ruta-fin-icon',
  html: `<div style="font-size:24px;">🏁</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const tieneRutaCargada = Array.isArray(rutaCargada) && rutaCargada.length > 0;
const tieneLineaRuta = Array.isArray(rutaCargada) && rutaCargada.length > 1;
const rutaValida = (rutaCargada || []).filter(
  p =>
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lon) &&
    Math.abs(p.lat) > 0.000001 &&
    Math.abs(p.lon) > 0.000001
);
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
            zIndex: 10,
            fontWeight: 'bold',
          }}
        >
          ⚠️ Mostrando ubicación inicial predeterminada
        </div>
      )}


    <MapContainer
      center={[latitud, longitud]}
      zoom={14}
      minZoom={10}
      maxZoom={17}
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

{rutaValida.length > 1 && (
  <Polyline
    positions={rutaValida.map(p => [p.lat, p.lon])}
    color="#000000"
    dashArray="8 8"
    weight={4}
    opacity={0.85}
  />
)}

{rutaValida.length > 0 && (
  <>
    <Marker
      position={[rutaValida[0].lat, rutaValida[0].lon]}
      icon={iconRutaInicio}
    >
      <Popup>
        <strong>🟢 Inicio del recorrido cargado</strong><br />
        Lat: {rutaValida[0].lat.toFixed(6)}<br />
        Lon: {rutaValida[0].lon.toFixed(6)}
      </Popup>
    </Marker>

    <Marker
      position={[
        rutaValida[rutaValida.length - 1].lat,
        rutaValida[rutaValida.length - 1].lon
      ]}
      icon={iconRutaFin}
    >
      <Popup>
        <strong>🏁 Fin del recorrido cargado</strong><br />
        Lat: {rutaValida[rutaValida.length - 1].lat.toFixed(6)}<br />
        Lon: {rutaValida[rutaValida.length - 1].lon.toFixed(6)}
      </Popup>
    </Marker>
  </>
)}


      {/* Trazos de navegación perfectamente sincronizados con el estado secuencial */}
{(() => {
  const inicio = waypoints.find(
    wp =>
      (wp.id === 'Inicio' || wp.id === 'Base') &&
      typeof wp.lat === 'number' &&
      typeof wp.lon === 'number'
  );

  const wps = waypoints.filter(
    wp =>
      wp.id !== 'Inicio' &&
      wp.id !== 'Base' &&
      typeof wp.lat === 'number' &&
      typeof wp.lon === 'number' &&
      !isNaN(wp.lat) &&
      !isNaN(wp.lon)
  );

  if (!inicio || wps.length === 0) return null;

  const points = [inicio, ...wps];
  const polylines = [];

  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i];
    const to = points[i + 1];

    let color = 'red';

    if (i < progressIdx) {
      color = 'green';
    } else if (i === progressIdx) {
      color = 'blue';
    }

    polylines.push(
      <Polyline
        key={`segment-${i}-${progressIdx}`}
        positions={[
          [from.lat, from.lon],
          [to.lat, to.lon]
        ]}
        color={color}
        weight={4}
      />
    );
  }

  return polylines;
})()}


      {/* Marcador de la base */}
{(() => {
  const inicioWp = waypoints.find(
    wp =>
      (wp.id === 'Inicio' || wp.id === 'Base') &&
      typeof wp.lat === 'number' &&
      typeof wp.lon === 'number'
  );

  if (!inicioWp) return null;

  return (
    <Marker
      key="Inicio"
      position={[inicioWp.lat, inicioWp.lon]}
     
    >
      <Popup>
        <strong>📍 Inicio de Misión</strong><br />
        Lat: {inicioWp.lat.toFixed(4)}<br />
        Lon: {inicioWp.lon.toFixed(4)}<br />
        Estado: Punto inicial
      </Popup>
    </Marker>
  );
})()}

      {/* Marcadores de waypoints */}
{(() => {
const wps = waypoints.filter(
  wp =>
    wp.id !== 'Inicio' &&
    wp.id !== 'Base' &&
    typeof wp.lat === 'number' &&
    typeof wp.lon === 'number'
);
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
          className: 'vehicle-marker',
          html: `<img src="${vehicleImg}" 
                      style="width:50px;${rotationStyle}" 
                      alt="${vehicleLabel}" />`,
          iconSize: [50, 50],
          iconAnchor: [25, 25],
        })}
      >
        <Popup>
          Posición Actual<br />
          Modo: {vehicleLabel}<br />
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


