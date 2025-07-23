import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvent } from 'react-leaflet';
import L from 'leaflet';

// Corrección para íconos por defecto en Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente para arreglar el resize
const MapFixer = ({ trigger }) => {
  const map = useMap();
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 300);
    const t2 = setTimeout(() => map.invalidateSize(), 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map, trigger]);
  return null;
};

const AddWaypointOnClick = ({ onAdd }) => {
  useMapEvent('click', (e) => {
    onAdd(e.latlng);
  });
  return null;
};

const MapView = ({ currentPos, waypoints, fullscreen, onAddWaypoint }) => {
  if (!currentPos || typeof currentPos.lat !== 'number' || typeof currentPos.lon !== 'number') {
    return <div>Cargando mapa...</div>;
  }

  return (
    <MapContainer
      center={[currentPos.lat, currentPos.lon]}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
    >
      <MapFixer trigger={fullscreen} />
      <AddWaypointOnClick onAdd={onAddWaypoint} />

      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />

      {/* Posición Actual */}
      <Marker position={[currentPos.lat, currentPos.lon]}>
        <Popup>📍 Posición Actual</Popup>
      </Marker>

      {/* Puntos de la grilla */}
      {waypoints.map((wp) => (
        <Marker key={wp.id} position={[wp.lat, wp.lon]}>
          <Popup>
            {wp.id}<br />
            Lat: {wp.lat.toFixed(4)}<br />
            Lon: {wp.lon.toFixed(4)}
          </Popup>
        </Marker>
      ))}
    </MapContainer >
  );
};

export default MapView;


