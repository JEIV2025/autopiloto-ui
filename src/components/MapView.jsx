import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvent } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Polyline } from 'react-leaflet';

// Corrección para íconos por defecto en Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Eliminar baseIcon personalizado

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

const MapView = ({ currentPos, waypoints, fullscreen, onAddWaypoint, progressIdx }) => {
  if (!currentPos || typeof currentPos.lat !== 'number' || typeof currentPos.lon !== 'number') {
    return <div>Cargando mapa...</div>;
  }

  return (
    <MapContainer
      key={progressIdx} // Forzar re-montaje cuando cambia progressIdx
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
              positions={[[currentPos.lat, currentPos.lon], [wps[0].lat, wps[0].lon]]}
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
      {waypoints.filter(wp => wp.id === 'Base').map(wp => (
        <Marker key={wp.id} position={[wp.lat, wp.lon]}>
          <Popup>🏠 Base</Popup>
        </Marker>
      ))}

      {/* Posición Actual */}
      <Marker position={[currentPos.lat, currentPos.lon]}>
        <Popup>📍 Posición Actual</Popup>
      </Marker>

      {/* Puntos de la grilla */}
      {waypoints.filter(wp => wp.id !== 'Base').map((wp) => (
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


