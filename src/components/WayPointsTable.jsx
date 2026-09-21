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
  simulacionActiva,
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
const [continuacionEnviada, setContinuacionEnviada] = useState(false);

const [mensajeTestOrientacion, setMensajeTestOrientacion] = useState("");

const testOrientacionTimerRef = useRef(null);

const simPosRef = useRef(null);
const inicioSimulacionRef = useRef(null);

const rumbo = Number.isFinite(Number(telemetry?.rumbo))
  ? Number(telemetry.rumbo)
  : 0;

 
  const INTERVALO_SIMULACION_MS = 100;
const FACTOR_SIMULACION = 100;


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


const posicionActualValida =
  Number.isFinite(currentPos?.lat) &&
  Number.isFinite(currentPos?.lon) &&
  currentPos.lat >= -90 &&
  currentPos.lat <= 90 &&
  currentPos.lon >= -180 &&
  currentPos.lon <= 180 &&
  !(currentPos.lat === 0 && currentPos.lon === 0);

const lat = posicionActualValida
  ? currentPos.lat
  : null;

const lon = posicionActualValida
  ? currentPos.lon
  : null;

const prepararWaypointsConInicioActual = () => {
  if (!posicionActualValida || !gpsPosValid) {
    setMostrarAlertaGPS(true);
    return null;
  }

  const inicioAnterior = waypoints.find(
    wp => wp.id === 'Inicio' || wp.id === 'Base'
  );

  const inicioActual = {
    ...inicioAnterior,
    id: 'Inicio',
    lat,
    lon,
    altura: 0,
    velocidad: 0,
    radioLlegada: 0,
  };

  const destinos = waypoints.filter(
    wp =>
      wp.id !== 'Inicio' &&
      wp.id !== 'Base'
  );

  return [
    inicioActual,
    ...destinos
  ];
};


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
              if (!posicionActualValida) {
                setMostrarAlertaGPS(true);
                setAccionRecorrido(null);
                return;
              }

              /*
              * Fija visualmente WP0 en la posición real
              * desde la cual comienza la navegación.
              */
              setWaypoints((prev) => [
                {
                  id: "Inicio",
                  lat: currentPos.lat,
                  lon: currentPos.lon,
                  altura: 0,
                  velocidad: 0,
                  radioLlegada: 0,
                },
                ...prev.filter(
                  (wp) => wp.id !== "Inicio" && wp.id !== "Base"
                ),
              ]);

              setProgressIdx(0);
              setContinuacionEnviada(false);

              socket.emit("control-cmd", {
                cmd: "iniciar-navegacion",
                modoRecorrido: modo,
                accionFinal: accionFinal,
              });

              console.log(
                `📡 Navegación iniciada | modo=${modo} | accionFinal=${accionFinal}`
              );
            }

        // ==========================================================
        // SIMULACIÓN
        // ==========================================================

        if (accionRecorrido === "simulacion") {

          /*
          * La simulación siempre comienza desde la posición
          * preestablecida, independientemente del GPS real.
          */
          const inicio = {
            id: "Inicio",
            lat: -34.5884060,
            lon: -58.3665789,
            altura: 0,
            velocidad: 0,
            radioLlegada: 0,
          };

          setWaypoints((prev) => [
            inicio,
            ...prev.filter(
              (wp) => wp.id !== "Inicio" && wp.id !== "Base"
            ),
          ]);

          /*
          * Esta copia no debe modificarse mientras se mueve el barco.
          */
          inicioSimulacionRef.current = {
            id: 'Inicio',
            lat: inicio.lat,
            lon: inicio.lon,
            altura: 0,
            velocidad: 0,
            radioLlegada: 0
          };

          simPosRef.current = {
            lat: inicio.lat,
            lon: inicio.lon
          };

          setCurrentPos(simPosRef.current);

          setSimulatedPath?.([
            simPosRef.current
          ]);

          setProgressIdx(0);
          setRutaRetorno([]);
          setRetornoIdx(0);
          setRetornoInverso(false);
          setRetornoDirecto(false);
          setRetornoFinalizado(false);
          setContinuacionEnviada(false);
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
if (
  !retornoInverso &&
  !retornoDirecto &&
  progressIdx >= destinos.length
) {
  console.warn(
    "Simulación finalizada: progressIdx fuera de rango"
  );

  setSimulando(false);
  setSimBoatHeading?.(null);

  /*
   * No colocar setSimulacionActiva(false),
   * porque haría desaparecer la posición simulada.
   */
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
// Último waypoint
console.log("🏁 Último waypoint alcanzado");

clearInterval(interval);

/*
 * Marca todos los tramos de ida como completados.
 */
setProgressIdx(destinos.length);

/*
 * Mantiene visible la posición simulada.
 * No debe ejecutarse setSimulacionActiva(false)
 * al llegar al último waypoint.
 */
setSimulacionActiva?.(true);

/* =====================================================
 * PERMANECER EN EL ÚLTIMO WAYPOINT
 * ===================================================== */
if (accionFinalSeleccionada === "esperar") {
  setSimulando(false);
  setSimBoatHeading?.(null);

  console.log(
    "⏳ Simulación finalizada: permanece en el último waypoint"
  );

  return;
}

/* =====================================================
 * RETORNO POR WAYPOINTS INVERSOS
 * ===================================================== */
if (accionFinalSeleccionada === "retorno-inverso") {
  const inicio = inicioSimulacionRef.current;

  if (!inicio) {
    console.error(
      "No existe una posición inicial para realizar el retorno"
    );

    setSimulando(false);
    setSimBoatHeading?.(null);

    return;
  }

  /*
   * Si la ida fue:
   * WP0 → WP1 → WP2 → WP3
   *
   * El regreso será:
   * WP3 → WP2 → WP1 → WP0
   *
   * WP3 no se agrega porque el barco ya está allí.
   */
  const rutaInversa = [
    ...destinos.slice(0, -1).reverse(),
    inicio
  ];

  setRutaRetorno(rutaInversa);
  setRetornoIdx(0);

  setRetornoDirecto(false);
  setRetornoInverso(true);
  setRetornoFinalizado(false);

  /*
   * Se mantiene simulando.
   * El cambio de rutaRetorno reiniciará el useEffect.
   */
  setSimulando(true);

  console.log(
    "↩️ Iniciando retorno por waypoints inversos:",
    rutaInversa
  );

  return;
}

/* =====================================================
 * RETORNO DIRECTO A WP0
 * ===================================================== */
if (accionFinalSeleccionada === "retorno-directo") {
  const inicio = inicioSimulacionRef.current;

  if (!inicio) {
    console.error(
      "No existe una posición inicial para realizar el retorno"
    );

    setSimulando(false);
    setSimBoatHeading?.(null);

    return;
  }

  setRutaRetorno([inicio]);
  setRetornoIdx(0);

  setRetornoInverso(false);
  setRetornoDirecto(true);
  setRetornoFinalizado(false);

  setSimulando(true);

  console.log(
    "🏠 Iniciando retorno directo al punto inicial:",
    inicio
  );

  return;
}

/*
 * Seguridad ante un valor desconocido.
 */
setSimulando(false);
setSimBoatHeading?.(null);

console.warn(
  "Acción final desconocida:",
  accionFinalSeleccionada
);

return;

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

/*
 * velocidadDestino se interpreta aquí como km/h.
 * Calcula cuántos kilómetros debe avanzar en cada ciclo.
 */
const avanceKm =
  velocidadDestino *
  FACTOR_SIMULACION *
  (INTERVALO_SIMULACION_MS / 3600000);

const rawFrac = avanceKm / distKm;

const frac = Math.max(
  0,
  Math.min(rawFrac, 0.20)
);
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

    }, INTERVALO_SIMULACION_MS); // actualiza cada 0.1 seg


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
  accionFinalSeleccionada,
  retornoDirecto,
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

const distanciaAlDestinoKm =
  posicionActualValida && destinoActual
    ? haversineDistance(
        lat,
        lon,
        destinoActual.lat,
        destinoActual.lon
      )
    : Infinity;

const radioLlegadaKm = destinoActual?.radioLlegada
  ? Number(destinoActual.radioLlegada) / 1000
  : 0.05;

const llegoAlWaypoint =
  posicionActualValida &&
  Number.isFinite(distanciaAlDestinoKm) &&
  distanciaAlDestinoKm <= radioLlegadaKm;

 /*
 * En simulación se utiliza la distancia calculada por React.
 *
 * En navegación real se prioriza wpEnZona,
 * recibido desde el STM32.
 */
const llegadaConfirmada = simulacionActiva
  ? llegoAlWaypoint
  : wpEnZona || llegoAlWaypoint;

const puedeContinuar =
  modoRecorrido === "pausado" &&
  llegadaConfirmada &&
  !continuacionEnviada &&
  !retornoInverso &&
  !retornoFinalizado;

/*
 * Cuando el STM32 abandona la zona del waypoint,
 * se permite una nueva confirmación futura.
 */
useEffect(() => {
  if (!wpEnZona) {
    setContinuacionEnviada(false);
  }
}, [wpEnZona, progressIdx]); 


const gpsOkClass = (ok) => ok ? "gpsValueOk" : "gpsValueBad";

useEffect(() => {
  return () => {
    if (testOrientacionTimerRef.current) {
      clearTimeout(testOrientacionTimerRef.current);
    }
  };
}, []);

  return (
    <div className="waypoints-table-container" style={{ background: '#64778aff', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
   {mensajeTestOrientacion && (
  <div
    role="status"
    className="
      fixed
      top-6
      right-6
      z-[99999]
      bg-purple-700
      text-white
      px-5
      py-3
      rounded-lg
      shadow-2xl
      font-semibold
      border
      border-purple-300
    "
  >
    {mensajeTestOrientacion}
  </div>
)}
   
      <div style={{ flexShrink: 0 }}>
        <div className="bg-black text-white p-4 rounded-lg shadow-lg w-full overflow-x-auto">
          <h2 className="text-center text-lg font-bold mb-4">Listado WayPoints</h2>
          <div className="flex justify-between items-center mb-2">
            <div className="bg-gray-800 text-white p-2 rounded text-sm">
              <div className="flex items-center gap-2">
                <span className="text font-bold">Posición Actual:</span>
<div className="flex gap-1">
  {posicionActualValida ? (
    <>
      <div className="flex items-center gap-1">
        <span className="text-xs text-white">
          {lat >= 0 ? 'N' : 'S'}
        </span>

        <span className="bg-black border text-white w-24 text-sm px-1 py-1">
          {Math.abs(lat).toFixed(6)}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-xs text-white">
          {lon >= 0 ? 'E' : 'O'}
        </span>

        <span className="bg-black border text-white w-24 text-sm px-1 py-1">
          {Math.abs(lon).toFixed(6)}
        </span>
      </div>
    </>
  ) : (
    <span className="bg-yellow-600 text-black px-3 py-1 rounded font-semibold">
      Esperando posición GPS
    </span>
  )}
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
  disabled={!puedeContinuar}
  className={`wp-btn-completed px-3 py-2 rounded shadow transition text-sm ${
    puedeContinuar
      ? "bg-green-600 hover:bg-green-700 text-white"
      : "bg-gray-500 text-gray-300 cursor-not-allowed"
  }`}
  onClick={() => {
    if (!puedeContinuar) {
      return;
    }

    /*
     * Si se alcanzó el último waypoint,
     * se muestran las opciones finales.
     */
    if (!retornoInverso && esUltimoWaypoint) {
      setShowReturnModal(true);
      return;
    }

    /*
     * Navegación real: se envía la orden al STM32.
     */
    if (!simulacionActiva) {
      socket.emit("control-cmd", {
        cmd: "nextWP",
      });

      console.log("📡 Comando enviado: nextWP");

      setContinuacionEnviada(true);
    }

    /*
     * Actualiza la representación de la ruta.
     * En simulación también inicia el movimiento
     * hacia el siguiente objetivo.
     */
    setProgressIdx((prev) =>
      Math.min(prev + 1, destinosActuales.length - 1)
    );
  }}
>
  <span className="wp-btn-text">
    {retornoFinalizado
      ? "Retorno completado"
      : retornoInverso
      ? "Retornando..."
      : puedeContinuar
      ? "Continuar al siguiente WP"
      : modoRecorrido === "continuo"
      ? "Modo continuo"
      : "Esperando llegada"}
  </span>

  <span className="wp-btn-icon">▶</span>
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
                disabled={!misionCargadaEnVehiculo}
                className={`px-3 py-2 rounded shadow text-sm transition font-semibold ${
                  misionCargadaEnVehiculo
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-gray-500 text-gray-300 cursor-not-allowed"
                }`}
                title={
                  misionCargadaEnVehiculo
                    ? "Ejecutar test con la misión almacenada en el STM32"
                    : "Primero debe enviar o cargar una misión en el STM32"
                }
                onClick={() => {
                  if (!misionCargadaEnVehiculo) {
                    return;
                  }

                  socket.emit("control-cmd", {
                    cmd: "test-orientacion",
                  });

                  setMensajeTestOrientacion(
                    "🧭 Orden enviada: test de orientación iniciado"
                  );

                  if (testOrientacionTimerRef.current) {
                    clearTimeout(testOrientacionTimerRef.current);
                  }

                  testOrientacionTimerRef.current = setTimeout(() => {
                    setMensajeTestOrientacion("");
                    testOrientacionTimerRef.current = null;
                  }, 4000);

                  console.log(
                    "🧭 Test de orientación iniciado con la misión almacenada en el STM32"
                  );
                }}
              >
                {misionCargadaEnVehiculo
                  ? "🧭 Test Orientación"
                  : "🔒 Test Orientación"}
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

                      if (!simulacionActiva) {
                        socket.emit("control-cmd", {
                          cmd: "returnReverseWP",
                        });
                        return;
                      } else {
                      const inicio = inicioSimulacionRef.current;

                      if (!inicio) {
                        console.error(
                          "No existe una posición inicial para el retorno"
                        );
                        return;
                      }
                      const wps = waypoints.filter(
                        w =>
                          w.id !== 'Inicio' &&
                          w.id !== 'Base' &&
                          Number.isFinite(w.lat) &&
                          Number.isFinite(w.lon)
                      );

                      /*
                      * Si la posición actual es el último waypoint:
                      *
                      * WP3 → WP2 → WP1 → WP0
                      *
                      * Se excluye el último waypoint porque el barco
                      * ya se encuentra allí.
                      */
                      const ruta = [
                        ...wps.slice(0, -1).reverse(),
                        inicio
                      ];

                      setRutaRetorno(ruta);
                      setRetornoIdx(0);
                      setRetornoInverso(true);
                      setRetornoDirecto(false);
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

                      if (!simulacionActiva) {
                      socket.emit("control-cmd", {
                        cmd: "returnDirectInicio",
                      });

                      return;
                      }

                    const inicio = inicioSimulacionRef.current;

                    if (!inicio) {
                      console.error(
                        "No existe una posición inicial para el retorno"
                      );
                      return;
                    }

                    setRutaRetorno([inicio]);
                    setRetornoIdx(0);

                    setRetornoInverso(false);
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
} else if (realIdx === progressIdx) {
  if (!posicionActualValida) {
    estado = 'Esperando posición';
    color = 'text-yellow-400';
    rowBg = 'bg-yellow-900/30';
  } else {
    const distToWp = haversineDistance(
      lat,
      lon,
      wp.lat,
      wp.lon
    );

    const estaEnZona =
      Number.isFinite(distToWp) &&
      distToWp < 0.05;

    estado = estaEnZona
      ? 'Zona de llegada'
      : 'En camino';

    color = estaEnZona
      ? 'text-yellow-400'
      : 'text-blue-500';

    rowBg = estaEnZona
      ? 'bg-yellow-900/30'
      : 'bg-blue-900/30';
  }
}
let distNudos = '--';
let time = '--';

if (posicionActualValida) {
  if (wp.id === 'Inicio') {
    const dist = haversineDistance(
      lat,
      lon,
      wp.lat,
      wp.lon
    );

    if (Number.isFinite(dist)) {
      distNudos = kmToNudos(dist).toFixed(2);
      time = estimatedTime(dist).toFixed(2);
    }
  } else if (realIdx >= progressIdx) {
    const dist = haversineDistance(
      lat,
      lon,
      wp.lat,
      wp.lon
    );

    if (Number.isFinite(dist)) {
      distNudos = kmToNudos(dist).toFixed(2);
      time = estimatedTime(dist).toFixed(2);
    }
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