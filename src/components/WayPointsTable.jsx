import React, { useState, useEffect , useRef} from 'react';
import io from 'socket.io-client';
import useTelemetry from '../hooks/useTelemetry';
import '../style/NavigationTablero.css';
import '../style/WayPointsTable.css';

const socket = io('http://localhost:3001');


const WayPointsTable = ({
  currentPos,
  setCurrentPos,
  waypoints,
  setWaypoints,
  progressIdx,
  setProgressIdx,
  setSimBoatHeading,
  simulatedPath,
  setSimulatedPath,
  misionCargadaEnVehiculo,
  setSimulacionActiva
}) => {
  const [velocidad, setVelocidad] = useState(2000); // velocidad fija para simulación (km/h)
  const { telemetry } = useTelemetry();
  const [simulando, setSimulando] = useState(false);
  const [errorSimulacion, setErrorSimulacion] = useState("");
  const [mostrarAlertaGPS, setMostrarAlertaGPS] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [retornoInverso, setRetornoInverso] = useState(false);
  const [retornoFinalizado, setRetornoFinalizado] = useState(false);
  const [rutaRetorno, setRutaRetorno] = useState([]);
const [retornoIdx, setRetornoIdx] = useState(0);
const [retornoDirecto, setRetornoDirecto] = useState(false);

const [mostrarModalRecorrido, setMostrarModalRecorrido] = useState(false);
const [accionPendiente, setAccionPendiente] = useState(null);

const [accionRecorrido, setAccionRecorrido] = useState(null);
// accionRecorrido: "navegacion" | "simulacion"

const [modoRecorrido, setModoRecorrido] = useState("pausado");
const [accionFinalSeleccionada, setAccionFinalSeleccionada] = useState("esperar");


 const simPosRef = useRef(null);
  const rumbo = telemetry?.rumbo ?? 0;
  const lat = currentPos?.lat ?? telemetry?.lat ?? 0;
  const lon = currentPos?.lon ?? telemetry?.lon ?? 0;
const misionActiva = Boolean(telemetry?.misionActiva);
const wpEnZona = Boolean(telemetry?.wpEnZona);
const gpsReal = Boolean(telemetry?.gpsReal);
const gpsCommOk = Boolean(telemetry?.gpsCommOk);
const gpsTimeValid = Boolean(telemetry?.gpsTimeValid);
const gpsFixValid = Boolean(telemetry?.gpsFixValid);
const gpsPosValid = Boolean(telemetry?.gpsPosValid);
const gpsSats = Number(telemetry?.gpsSats ?? 0);
const gpsHdop = Number(telemetry?.gpsHdop ?? 0);
const gpsEhpe = Number(telemetry?.gpsEhpe ?? 0);
const gpsNavReady = Boolean(telemetry?.gpsNavReady);
const gpsQualityCount = Number(telemetry?.gpsQualityCount ?? 0);
const gpsRequiredSamples = Number(telemetry?.gpsRequiredSamples ?? 3);

const GPS_MIN_SATS = 6;
const GPS_MAX_HDOP = 3.0;
const GPS_MAX_EHPE = 10.0;


const handleIniciarNavegacion = () => {
  if (!gpsReal) {
    setMostrarAlertaGPS(true);
    return;
  }
  setAccionPendiente("navegacion");
  setMostrarModalRecorrido(true);
};
const handleSimularNavegacion = () => {
  setAccionPendiente("simulacion");
  setMostrarModalRecorrido(true);
};

const seleccionarModoRecorrido = (modo , accionFinal) => {

            console.log("🧭 Modo:", modo);
            console.log("🏁 Acción final:", accionFinal);

            setMostrarModalRecorrido(false);

            if (accionRecorrido === "navegacion") {

              socket.emit("control-cmd", {
                cmd: "iniciar-navegacion",
                modoRecorrido: modo,
                accionFinal: accionFinal
              });

              console.log(
                `📡 Navegación iniciada | modo=${modo} | accionFinal=${accionFinal}`
              );
            }

        // ==========================================================
        // SIMULACIÓN
        // ==========================================================

        if (accionRecorrido === "simulacion") {

          const inicio = waypoints.find(
            wp => wp.id === 'Inicio' || wp.id === 'Base'
          );

          if (inicio) {

            simPosRef.current = {
              lat: inicio.lat,
              lon: inicio.lon
            };

            setCurrentPos(simPosRef.current);

            setSimulatedPath?.([
              simPosRef.current
            ]);
          }

          setSimulando(true);
          setSimulacionActiva?.(true);

          console.log(
            `🧭 Simulación iniciada - modo ${modo}`
          );
        }

  setAccionRecorrido(null);
};
  // Haversine en km
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // radio de la tierra
    const toRad = deg => deg * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function kmToNudos(distanciaKm) {
    return distanciaKm / 1.852;
  }

  function estimatedTime(distanceKm, speedKmh = 50) {
    return distanceKm / speedKmh;
  }

  function calculateHeading(lat1, lon1, lat2, lon2) {
    const toRad = deg => deg * Math.PI / 180;
    const toDeg = rad => rad * 180 / Math.PI;
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x =
      Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    let brng = Math.atan2(y, x);
    brng = toDeg(brng);
    return (brng + 360) % 360;
  }

  // Simulación de movimiento del barco entre waypoints
useEffect(() => {
  let interval;
  if (simulando) {
    // Lista de destinos (excluye Base). El índice de progreso referencia esta lista.
      const destinos = waypoints.filter(
        w =>
          w.id !== 'Inicio' &&
          w.id !== 'Base' &&
          typeof w.lat === 'number' &&
          typeof w.lon === 'number' &&
          !isNaN(w.lat) &&
          !isNaN(w.lon)
      );

          console.log("simulando:", simulando);
          console.log("destinos:", destinos);
          console.log("progressIdx:", progressIdx);
          console.log("currentPos:", currentPos);

        
          // Si no hay destinos, detener simulación
          if (destinos.length === 0) {
            console.warn("No hay destinos válidos para simular");
            setSimulando(false);
            setSimulacionActiva?.(false);
            if (setSimBoatHeading) setSimBoatHeading(null);
            return () => {};
          }

      const inicio = waypoints.find(
        wp => wp.id === 'Inicio' || wp.id === 'Base'
      );

      const startLat = inicio?.lat ?? currentPos?.lat ?? -34.5884060;
      const startLon = inicio?.lon ?? currentPos?.lon ?? -58.3665789;

      let pos = simPosRef.current ?? {
        lat: startLat,
        lon: startLon
      };

    interval = setInterval(() => {
      // Si ya completamos todos los WP → detener
      if (progressIdx >= destinos.length) {
        console.warn("Simulación finalizada: progressIdx fuera de rango");
        setSimulando(false);
        setSimulacionActiva?.(false);
        clearInterval(interval);
        return;
      }

        const destino =  (retornoInverso || retornoDirecto)
            ? rutaRetorno[retornoIdx]
            : destinos[progressIdx];

        if (!destino) return;
          

      // Distancia en km al destino actual
      const distKm = haversineDistance(pos.lat, pos.lon, destino.lat, destino.lon);

      // Calcular heading hacia el destino
      const heading = calculateHeading(pos.lat, pos.lon, destino.lat, destino.lon);
      if (setSimBoatHeading) setSimBoatHeading(heading);

      const radioLlegadaKm = destino.radioLlegada
        ? Number(destino.radioLlegada) / 1000
        : 0.05;

        console.log("🧭 modoRecorrido actual:", modoRecorrido);

      // Si llegamos cerca, quedarnos en el WP hasta confirmar manualmente
      if (!Number.isFinite(distKm) || distKm <= radioLlegadaKm) {
        pos = { lat: destino.lat, lon: destino.lon };
        simPosRef.current = pos;
        setCurrentPos(pos);

        if (setSimulatedPath) {
          setSimulatedPath(prev => [...prev.slice(-1000), pos]);
        }

        if (retornoInverso || retornoDirecto) {
          clearInterval(interval);

          if (retornoIdx < rutaRetorno.length - 1) {
            setRetornoIdx(prev => prev + 1);
            return;
          }

          setRetornoFinalizado(true);
          setRetornoInverso(false);
          setSimulando(false);
          setSimulacionActiva?.(false);
          setSimBoatHeading?.(null);

          console.log("🏁 Retorno al Inicio completado");
          return;
        }
//...........................................


          // ======================================================
          // NAVEGACIÓN CONTINUA
          // ======================================================
          if (modoRecorrido === "continuo") {

            console.log(`✅ ${destino.id} alcanzado`);

            // Si todavía quedan waypoints
            if (progressIdx < destinos.length - 1) {

              console.log("▶ Avanzando automáticamente al siguiente waypoint");

              clearInterval(interval);

              setProgressIdx(prev => prev + 1);

              return;
            }

            // Último waypoint
            console.log("🏁 Último waypoint alcanzado");

            clearInterval(interval);

            setSimulando(false);
            setSimulacionActiva?.(false);
            setSimBoatHeading?.(null);

            return;
          }


          // ======================================================
          // NAVEGACIÓN PAUSADA
          // ======================================================

          console.log(
            `⏸ ${destino.id} alcanzado - esperando WayPoint Cumplido`
          );

//.........................................
        return;
      }else {
              const velocidadDestino = (retornoInverso || retornoDirecto)
                  ? Math.max(...destinos.map(w => Number(w.velocidad) || 0))
                  : Number(destino.velocidad);

              if (!Number.isFinite(velocidadDestino) || velocidadDestino <= 0) {
                setErrorSimulacion(`⚠️ Falta cargar velocidad en ${destino.id}`);
                setSimulando(false);
                setSimulacionActiva?.(false);
                clearInterval(interval);
                return;
              }

              setErrorSimulacion("");

              const FACTOR_SIMULACION = 200;

              const velKms = ((velocidadDestino * FACTOR_SIMULACION) / 3600) / 10;
                
              const rawFrac = velKms / distKm;
              const frac = Math.max(0, Math.min(rawFrac, 1)); // clamp [0,1]

              pos = {
                lat: pos.lat + (destino.lat - pos.lat) * frac,
                lon: pos.lon + (destino.lon - pos.lon) * frac,
              };
              simPosRef.current = pos;
              setCurrentPos(pos);

            if (setSimulatedPath) {
                setSimulatedPath(prev => [...prev.slice(-1000), pos]);
              }
              console.log(
                `➡️ Navegando hacia ${destino.id} | Velocidad real: ${velocidadDestino} km/h | Simulada: ${velocidadDestino * FACTOR_SIMULACION} km/h`
              );
              console.log(
              `📏 Distancia: ${(distKm * 1000).toFixed(1)} m | Radio: ${destino.radioLlegada} m`
              );

            }

    }, 100); // actualiza cada 0.1 seg


  } else {
    if (setSimBoatHeading) setSimBoatHeading(null);
  }



  return () => clearInterval(interval);
}, [
    simulando,
  velocidad,
  waypoints,
  progressIdx,
  retornoInverso,
  retornoIdx,
  rutaRetorno,
  modoRecorrido
]);


  function formatCoordinate(value, type) {
    if (typeof value !== 'number') return '--';
    const abs = Math.abs(value).toFixed(5);
    const dir = type === 'lat'
      ? value >= 0 ? 'N' : 'S'
      : value >= 0 ? 'E' : 'W';
    return `${abs}°${dir}`;
  }

  const handleAlturaChange = (id, value) => {
  const altura = Number(value);

  setWaypoints(prev =>
    prev.map(wp =>
      wp.id === id
        ? { ...wp, altura: Number.isNaN(altura) ? 0 : altura }
        : wp
    )
  );
};

const handleWaypointFieldChange = (id, field, value) => {
  const numericValue = Number(value);

  setWaypoints(prev =>
    prev.map(wp =>
      wp.id === id
        ? {
            ...wp,
            [field]: Number.isNaN(numericValue) ? 0 : numericValue
          }
        : wp
    )
  );
};

//para el boton de WAYPOINT CUMPLIDO...
const destinosActuales = waypoints.filter(
  w =>
    w.id !== 'Inicio' &&
    typeof w.lat === 'number' &&
    typeof w.lon === 'number' &&
    !isNaN(w.lat) &&
    !isNaN(w.lon)
);

const destinoActual = destinosActuales[progressIdx];

const esUltimoWaypoint = progressIdx >= destinosActuales.length - 1;
const esPrimerWaypoint =  progressIdx <= 0;

const distanciaAlDestinoKm = destinoActual
  ? haversineDistance(lat, lon, destinoActual.lat, destinoActual.lon)
  : Infinity;

const radioLlegadaKm = destinoActual?.radioLlegada
  ? Number(destinoActual.radioLlegada) / 1000
  : 0.05;

const llegoAlWaypoint = distanciaAlDestinoKm <= radioLlegadaKm;


const gpsOkClass = (ok) => ok ? "gpsValueOk" : "gpsValueBad";

  return (
    <div className="waypoints-table-container" style={{ background: '#64778aff', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div style={{ flexShrink: 0 }}>
        <div className="bg-black text-white p-4 rounded-lg shadow-lg w-full overflow-x-auto">
          <h2 className="text-center text-lg font-bold mb-4">Listado WayPoints</h2>
          <div className="flex justify-between items-center mb-2">
            <div className="bg-gray-800 text-white p-2 rounded text-sm">
              <div className="flex items-center gap-2">
                <span className="text font-bold">Posición Actual:</span>
                <div className="flex gap-1">
                  <div className="flex items-center gap-1">
                    <span className=" text-xs text-white">{currentPos.lat >= 0 ? 'N' : 'S'}</span>
                    <span className=" bg-black border text-white w-24 text-sm px-1 py-1">{currentPos.lat.toFixed(6)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-white">{currentPos.lon >= 0 ? 'E' : 'O'}</span>
                    <span className="bg-black border text-white w-24 text-sm px-1 py-1">{currentPos.lon.toFixed(6)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="navBtns flex gap-2">
            <button
              disabled={!misionCargadaEnVehiculo}
              className={`px-3 py-2 rounded shadow text-sm transition ${
                misionCargadaEnVehiculo
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
              onClick={() => {
                // 1. Primero verificar condiciones GPS
           
                if (!gpsNavReady) {
                  setMostrarAlertaGPS(true);
                  return;
                }

                // 2. GPS correcto → preguntar modo de recorrido
                setAccionRecorrido("navegacion");
                setMostrarModalRecorrido(true);
/*
                socket.emit('control-cmd', {
                  cmd: 'iniciar-navegacion'
                });
*/
                console.log('📡 Orden enviada: iniciar navegación real');
              }}
            >
              🚀 Iniciar Navegación
            </button>

            <button
              disabled={!llegoAlWaypoint || retornoInverso || retornoFinalizado}
              className={`wp-btn-completed px-3 py-2 rounded shadow transition text-sm ${
                llegoAlWaypoint
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
              onClick={() => {
                if (!llegoAlWaypoint) return;

                if (!retornoInverso && esUltimoWaypoint) {
                  setShowReturnModal(true);
                  return;
                }

                if (misionActiva) {
                  socket.emit('control-cmd', {
                    cmd: 'nextWP'
                  });

                  console.log('📡 Comando enviado: nextWP');
                  return;
                }

                setProgressIdx(prev => prev + 1);
              }}
                          >
              <span className="wp-btn-text">
                {retornoFinalizado
                  ? 'Retorno Completado'
                  : retornoInverso
                  ? 'Retornando...'
                  : llegoAlWaypoint
                  ? 'WayPoint Cumplido'
                  : 'Esperando llegada'}
              </span>

              <span className="wp-btn-icon">✓</span>
            </button>
            
            <button
                     className={`wp-btn-simulate px-3 py-2 rounded shadow text-sm ${
                     simulando ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                    } text-white transition`}
                  onClick={() => {

                  // Si ya está simulando → detener directamente
                  if (simulando) {

                    simPosRef.current = null;
                    setSimBoatHeading?.(null);

                    setSimulando(false);
                    setSimulacionActiva?.(false);

                    console.log('🛑 Simulación detenida');

                    return;
                  }

                  // Si NO está simulando → preguntar modo de recorrido
                  setAccionRecorrido("simulacion");
                  setMostrarModalRecorrido(true);
                  }}
                >
                <span className="wp-btn-text">
                  {simulando ? 'Detener Simulación' : 'Simular Navegación'}
                </span>
                <span className="wp-btn-text-mobile">
                  {simulando ? 'Detener' : 'Simular'}
                </span>
              </button>

              <button
              className="px-3 py-2 rounded shadow text-sm bg-purple-600 hover:bg-purple-700 text-white transition font-semibold"
              onClick={() => {
                socket.emit('control-cmd', {
                  cmd: 'test-orientacion'
                });

                console.log('🧭 Comando enviado: test-orientacion');
              }}
            >
              🧭 Test Orientación
            </button>

          {retornoInverso && (
            <div className="bg-blue-600 text-white px-3 py-1 rounded">
              🔄 Retorno por waypoints inversos
            </div>
          )}
          {retornoDirecto && (
            <div className="bg-green-600 text-white px-3 py-1 rounded">
              ⚡ Retorno directo al Inicio
            </div>
          )}    

          {showReturnModal && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[99999]">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-md text-center">
                <h2 className="text-xl font-bold text-orange-600 mb-3">
                  Misión finalizada
                </h2>

                <p className="text-gray-800 mb-4">
                  Se llegó al último waypoint. Para regresar al Inicio, seleccione el modo de retorno.
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
                    onClick={() => {
                      setShowReturnModal(false);

                      if (misionActiva) {
                        socket.emit('control-cmd', { cmd: 'returnReverseWP' });
                      } else {
                      const inicio = waypoints.find(w => w.id === 'Inicio' || w.id === 'Base');

                      const wps = waypoints.filter(
                        w =>
                          w.id !== 'Inicio' &&
                          w.id !== 'Base' &&
                          typeof w.lat === 'number' &&
                          typeof w.lon === 'number'
                      );

                      const ruta = [
                        ...wps.slice(0, -1).reverse(),
                        inicio
                      ].filter(Boolean);

                      setRutaRetorno(ruta);
                      setRetornoIdx(0);
                      setRetornoInverso(true);
                      setRetornoFinalizado(false);
                      setSimulando(true);
                      setSimulacionActiva?.(true);
                      }
                    }}
                  >
                    ↩️ Volver por waypoints inversos
                  </button>

                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
                    onClick={() => {
                      setShowReturnModal(false);

                      if (misionActiva) {
                        socket.emit('control-cmd', {
                          cmd: 'returnDirectInicio'
                        });
                        return;
                      }

                      const inicio = waypoints.find(
                        wp => wp.id === 'Inicio' || wp.id === 'Base'
                      );

                      if (!inicio) return;

                      setRutaRetorno([inicio]);
                      setRetornoIdx(0);

                      setRetornoDirecto(true);
                      setRetornoFinalizado(false);

                      setSimulando(true);
                      setSimulacionActiva?.(true);

                      console.log("⚡ Retorno directo al Inicio");
                    }}
                  >
                    ⚡ Volver directo al Inicio
                    <br />
                    <span className="text-sm font-normal">
                      Opción de mayor ahorro de energía
                    </span>
                  </button>

                  <button
                    className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                    onClick={() => setShowReturnModal(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}    
          {errorSimulacion && (
              <div className="mt-2 bg-yellow-500 text-black px-3 py-2 rounded font-semibold text-sm shadow">
                {errorSimulacion}
              </div>
            )}
            </div>
          </div>
          {/* Contenedor scrollable para que no se tapen los WPs */}
          <div className="wp-scroll" style={{ maxHeight: '45vh', overflowY: 'auto', borderRadius: '0.5rem' }}>
            <table className="w-full text-sm border border-white" style={{ tableLayout: 'fixed' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                <tr className="bg-gray-800">
                  <th className="border px-2 py-1 wp-th">WP</th>
                  <th className="border px-2 py-1 wp-th">LAT-LON</th>
                  <th className="border px-2 py-1 wp-th">ALTURA (mts)</th>
                  <th className="border px-2 py-1 wp-th">VEL.(nudos-m/s)</th>
                  <th className="border px-2 py-1 wp-th">RADIO (mts)</th>               
                  <th className="border px-2 py-1 wp-th">DISTANCIA (kmts)</th>
                  <th className="border px-2 py-1 wp-th">TIEM. APROX. (h)</th>
                  <th className="border px-2 py-1 wp-th">ESTADO</th>
                </tr>
              </thead>
              <tbody className="wp-tbody">
              {(() => {
                const wps = waypoints.filter(
                  wp =>
                    wp.id !== 'Inicio' &&
                    typeof wp.lat === 'number' &&
                    typeof wp.lon === 'number' &&
                    !isNaN(wp.lat) &&
                    !isNaN(wp.lon)
                );
                const idToIdx = new Map(wps.map((w, i) => [w.id, i]));
                return waypoints.map((wp) => {
                  const realIdx = idToIdx.has(wp.id) ? idToIdx.get(wp.id) : -1;
                  let estado = '';
                  let color = '';
                  let rowBg = '';
                  if (wp.id === 'Inicio') {
                    estado = 'Inicio';
                    color = 'text-gray-400';
                    rowBg = 'bg-gray-800';
                  } else {
                    if (realIdx < progressIdx) {
                      estado = 'Completado';
                      color = 'text-green-500';
                      rowBg = 'bg-green-900/30';
                    } else if (realIdx === progressIdx) {
                      // Si el barco está en el WP, mostrar "Zona de llegada"
                      const distToWp = haversineDistance(lat, lon, wp.lat, wp.lon);
                      estado = distToWp < 0.05 ? 'Zona de llegada' : 'En camino';
                      color = distToWp < 0.05 ? 'text-yellow-400' : 'text-blue-500';
                      rowBg = distToWp < 0.05 ? 'bg-yellow-900/30' : 'bg-blue-900/30';
                    } else {
                      estado = 'Próximo destino';
                      color = 'text-red-500';
                      rowBg = 'bg-red-900/20';
                    }
                  }
                  let dist, distNudos, time;
                  if (wp.id === 'Inicio') {
                    dist = haversineDistance(lat, lon, wp.lat, wp.lon);
                    distNudos = kmToNudos(dist).toFixed(2);
                    time = estimatedTime(dist).toFixed(2);
                  } else {
                    if (realIdx < progressIdx) {
                      distNudos = '--';
                      time = '--';
                    } else {
                      dist = haversineDistance(lat, lon, wp.lat, wp.lon);
                      distNudos = kmToNudos(dist).toFixed(2);
                      time = estimatedTime(dist).toFixed(2);
                    }
                  }
                  return (
                    <tr key={wp.id} className={`text-center ${rowBg} wp-tr`}>

                    <td className="border px-2 py-1 wp-td">{wp.id}</td>

                    <td className="border px-2 py-1 wp-td">
                      {formatCoordinate(wp.lat, 'lat')}, {formatCoordinate(wp.lon, 'lon')}
                    </td>

                    <td className="border px-2 py-1 wp-td">
                      {wp.id === 'Inicio' ? (
                        '--'
                      ) : (
                        <input
                          type="number"
                          value={wp.altura ?? 0}
                          onChange={(e) => handleAlturaChange(wp.id, e.target.value)}
                          className="w-20 text-center bg-black text-white border border-gray-400 rounded px-1 py-1"
                        />
                      )}
                    </td>
                    <td className="border px-2 py-1 wp-td">
                      {wp.id === 'Inicio' ? (
                        '--'
                      ) : (
                        <input
                          type="number"
                          value={wp.velocidad ?? 0}
                          onChange={(e) =>
                            handleWaypointFieldChange(wp.id, 'velocidad', e.target.value)
                          }
                          className="w-20 text-center bg-black text-white border border-gray-400 rounded px-1 py-1"
                        />
                      )}
                    </td>

                    <td className="border px-2 py-1 wp-td">
                      {wp.id === 'Inicio' ? (
                        '--'
                      ) : (
                        <input
                          type="number"
                          value={wp.radioLlegada ?? 5}
                          onChange={(e) =>
                            handleWaypointFieldChange(wp.id, 'radioLlegada', e.target.value)
                          }
                          className="w-20 text-center bg-black text-white border border-gray-400 rounded px-1 py-1"
                        />
                      )}
                    </td>

                    <td className="border px-2 py-1 wp-td">{distNudos}</td>

                    <td className="border px-2 py-1 wp-td">{time}</td>

                    <td className={`border px-2 py-1 font-bold wp-td ${color}`}>
                      {estado}
                    </td>
                    </tr>
                  );
                });
              })()}
              </tbody>
            </table>
          </div>

{mostrarAlertaGPS && (
  <div className="gpsWarningOverlay">
    <div className="gpsWarningModal">

      <div className="gpsWarningTitle">
        ⚠️ GPS no disponible
      </div>

      <div className="gpsWarningText">
        No es posible iniciar una navegación autónoma sin una posición GPS válida.
      </div>

      <div className="gpsStatusBox">
        <div className="gpsStatusRow">
          <span>Comunicación:</span>
          <strong className={gpsOkClass(gpsCommOk)}>
            {gpsCommOk ? "OK" : "NO"}
          </strong>
        </div>

        <div className="gpsStatusRow">
          <span>Tiempo GPS:</span>
          <strong className={gpsOkClass(gpsTimeValid)}>
            {gpsTimeValid ? "OK" : "NO"}
          </strong>
        </div>

        <div className="gpsStatusRow">
          <span>Fix:</span>
          <strong className={gpsOkClass(gpsFixValid)}>
            {gpsFixValid ? "OK" : "NO"}
          </strong>
        </div>

        <div className="gpsStatusRow">
          <span>Posición:</span>
          <strong className={gpsOkClass(gpsPosValid)}>
            {gpsPosValid ? "OK" : "NO"}
          </strong>
        </div>

        <div className="gpsStatusRow">
          <span>Satélites:</span>
          <strong className={gpsOkClass(gpsSats >= GPS_MIN_SATS)}>
            {gpsSats}
          </strong>
          <em>mínimo {GPS_MIN_SATS}</em>
        </div>

        <div className="gpsStatusRow">
          <span>HDOP:</span>
          <strong className={gpsOkClass(gpsHdop > 0 && gpsHdop <= GPS_MAX_HDOP)}>
            {gpsHdop.toFixed(2)}
          </strong>
          <em>máximo {GPS_MAX_HDOP.toFixed(2)}</em>
        </div>

        <div className="gpsStatusRow">
          <span>EHPE:</span>
          <strong className={gpsOkClass(gpsEhpe > 0 && gpsEhpe <= GPS_MAX_EHPE)}>
            {gpsEhpe.toFixed(2)} m
          </strong>
          <em>máximo {GPS_MAX_EHPE.toFixed(2)} m</em>
        </div>

        <div className="gpsStatusRow">
          <span>Muestras buenas:</span>
          <strong className={gpsOkClass(gpsQualityCount >= gpsRequiredSamples)}>
            {gpsQualityCount}
          </strong>
          <em>{gpsRequiredSamples} requeridas</em>
        </div>

        <div className="gpsStatusRow gpsFinalRow">
          <span>Estado navegación:</span>
          <strong className={gpsOkClass(gpsNavReady)}>
            {gpsNavReady ? "LISTO" : "NO LISTO"}
          </strong>
        </div>
      </div>

      <button
        className="gpsWarningBtn"
        onClick={() => setMostrarAlertaGPS(false)}
      >
        Entendido
      </button>

    </div>
  </div>
)}

{mostrarModalRecorrido && (
  <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60">

    <div className="bg-gray-800 text-white rounded-xl shadow-2xl p-6 w-[520px] max-w-[92vw] text-center">

      <h2 className="text-xl font-bold mb-3">
        🧭 Configuración del Recorrido
      </h2>

      <p className="text-gray-300 mb-5">
        Seleccione cómo desea recorrer los waypoints y qué debe hacer el vehículo al finalizar la misión.
      </p>


      {/* ===================================================== */}
      {/* MODO DE RECORRIDO */}
      {/* ===================================================== */}

      <div className="mb-6">

        <h3 className="font-semibold mb-3">
          Modo de recorrido
        </h3>

        <div className="flex justify-center gap-4">

          <button
            onClick={() => setModoRecorrido("pausado")}
            className={`
              px-5 py-3
              rounded-lg
              font-semibold
              transition
              ${
                modoRecorrido === "pausado"
                  ? "bg-yellow-600 ring-2 ring-yellow-300"
                  : "bg-gray-600 hover:bg-gray-500"
              }
            `}
          >
            ⏸ Pausado
          </button>


          <button
            onClick={() => setModoRecorrido("continuo")}
            className={`
              px-5 py-3
              rounded-lg
              font-semibold
              transition
              ${
                modoRecorrido === "continuo"
                  ? "bg-green-600 ring-2 ring-green-300"
                  : "bg-gray-600 hover:bg-gray-500"
              }
            `}
          >
            ▶ Continuo
          </button>

        </div>

        <div className="mt-3 text-sm text-gray-400">

          {modoRecorrido === "pausado" ? (
            <span>
              Espera confirmación del operador en cada waypoint.
            </span>
          ) : (
            <span>
              Avanza automáticamente de un waypoint al siguiente.
            </span>
          )}

        </div>

      </div>


      {/* ===================================================== */}
      {/* ACCION FINAL */}
      {/* ===================================================== */}

      <div className="border-t border-gray-600 pt-5">

        <h3 className="font-semibold mb-3">
          Al llegar al último waypoint
        </h3>

        <div className="flex flex-col gap-3">

          <button          
            onClick={() => setAccionFinalSeleccionada("esperar")}
            className={`
              px-4 py-3
              rounded-lg
              transition
              ${
                accionFinalSeleccionada === "esperar"
                  ? "bg-blue-600 ring-2 ring-blue-300"
                  : "bg-gray-600 hover:bg-gray-500"
              }
            `}
          >
            ⏳ Permanecer en el último waypoint
          </button>


          <button
            onClick={() => setAccionFinalSeleccionada("retorno-inverso")}
            className={`
              px-4 py-3
              rounded-lg
              transition
              ${
                accionFinalSeleccionada === "retorno-inverso"
                  ? "bg-purple-600 ring-2 ring-purple-300"
                  : "bg-gray-600 hover:bg-gray-500"
              }
            `}
          >
            ↩ Volver siguiendo los waypoints anteriores
          </button>


          <button
          disabled={modoRecorrido === "pausado"}
            onClick={() => setAccionFinalSeleccionada("retorno-directo")}
            className={`
              px-4 py-3
              rounded-lg
              transition
              ${
                accionFinalSeleccionada === "retorno-directo"
                  ? "bg-red-600 ring-2 ring-red-300"
                  : "bg-gray-600 hover:bg-gray-500"
              }
            `}
          >
            🏠 Volver directamente a Inicio
          </button>

        </div>

      </div>


      {/* ===================================================== */}
      {/* CONFIRMAR / CANCELAR */}
      {/* ===================================================== */}

      <div className="flex justify-center gap-4 mt-6">

        <button
          onClick={() => {
            seleccionarModoRecorrido(
              modoRecorrido,
              accionFinalSeleccionada
            );
          }}
          className="
            px-5 py-3
            rounded-lg
            bg-green-600
            hover:bg-green-700
            text-white
            font-semibold
            transition
          "
        >
          ✅ Confirmar
        </button>


        <button
          onClick={() => {
            setMostrarModalRecorrido(false);
            setAccionRecorrido(null);
          }}
          className="
            px-5 py-3
            rounded-lg
            bg-gray-600
            hover:bg-gray-700
            text-white
            transition
          "
        >
          Cancelar
        </button>

      </div>

    </div>

  </div>
)}

        </div>
      </div>
    </div>
  );
};

export default WayPointsTable;