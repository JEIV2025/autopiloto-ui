import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import '../style/ControlPanel.css'

const socket = io('http://localhost:3001');

const ControlPanel = ({ waypoints, setWaypoints, currentPos, progressIdx, setProgressIdx }) => {
  const [calibrando, setCalibrando] = useState(false);
  const [calibrado, setCalibrado] = useState(false);
  const [showConfirmMag, setShowConfirmMag] = useState(false);
  const [showModalMagDatos, setShowModalMagDatos] = useState(false);
  const [magBias, setMagBias] = useState({ x: '', y: '', z: '' });
  const [magSoftHardIron, setMagSoftHardIron] = useState([
    ['', '', ''],
    ['', '', ''],
    ['', '', '']
  ]);
  const [selectedWaypoint, setSelectedWaypoint] = useState(null);
  const [showWaypointForm, setShowWaypointForm] = useState(false);
  const [newWaypoint, setNewWaypoint] = useState({ lat: '', lon: '' });
  const [showConfirm, setShowConfirm] = useState(false);

  const [estadoEnvio, setEstadoEnvio] = useState(null);
  const [estadoCarga, setEstadoCarga] = useState(null);
  const [showConfirmEnviar, setShowConfirmEnviar] = useState(false);
  const [showConfirmCargar, setShowConfirmCargar] = useState(false);
  const respuestaRecibidaRef = useRef(false);
  const [tipoNorte, setTipoNorte] = useState(() => {
    // Cargar el valor guardado del localStorage o usar 'desactivado' por defecto
    return localStorage.getItem('tipoNorte') || 'desactivado';
  });
  const [mensajeReferencia, setMensajeReferencia] = useState(null);
  const [rumbo, setRumbo] = useState('');
  const [rolido, setRolido] = useState('');
  const [cabeceo, setCabeceo] = useState('');
  const [altura, setAltura] = useState(0);
  const [mensajeOrientacion, setMensajeOrientacion] = useState(null);
  const [tipoImu, setTipoImu] = useState(() => {
    return localStorage.getItem('tipoImu') || '0';
  });
  const [tipoMar, setTipoMar] = useState(() => {
    return localStorage.getItem('tipoMar') || '0';
  });
  const [mensajeImu, setMensajeImu] = useState(null);
  const [mensajeMar, setMensajeMar] = useState(null);
  const [panelImuAbierto, setPanelImuAbierto] = useState(false);
  const [panelMarAbierto, setPanelMarAbierto] = useState(false);

  // Opciones para Tipo IMU 
  const opcionesImu = [
    { value: 0, label: 'MEM Basica' },
    { value: 1, label: 'MEM Calibrada' },
    { value: 2, label: 'FOG' },
    { value: 3, label: 'RLG' },
    { value: 4, label: 'HRG' }
  ];

  // Opciones para Tipo Mar 
  const opcionesMar = [
    { value: 0, label: 'Mar 0' },
    { value: 1, label: 'Mar 1' },
    { value: 2, label: 'Mar 2' },
    { value: 3, label: 'Mar 3' },
    { value: 4, label: 'Mar 4' },
    { value: 5, label: 'Mar 5' }
  ];
 
  //.......................................
  const toggleCalibrar = () => {
    socket.emit('control-cmd', { cmd: 'calibrar' });
  };

  const toggleCalibrarMagnetometro = () => {
    socket.emit('control-cmd', { cmd: 'calibrar-magnetometro' });
  };

  // Actualizar una celda de la matriz soft/hard iron
  const setMagSoftHardIronCell = (row, col, value) => {
    setMagSoftHardIron(prev => {
      const next = prev.map(r => [...r]);
      next[row][col] = value;
      return next;
    });
  };

  // Enviar datos de calibración magnetómetro (bias + corrección soft/hard iron)
  const handleCargarDatosMagnetometro = () => {
    const bx = parseFloat(magBias.x);
    const by = parseFloat(magBias.y);
    const bz = parseFloat(magBias.z);
    if (isNaN(bx) || isNaN(by) || isNaN(bz)) {
      alert('Ingrese valores numéricos válidos para bias X, Y, Z');
      return;
    }
    const matrix = magSoftHardIron.map(row =>
      row.map(cell => parseFloat(cell))
    );
    const allValid = matrix.every(row => row.every(n => !isNaN(n)));
    if (!allValid) {
      alert('Ingrese valores numéricos válidos en toda la matriz de corrección soft/hard iron');
      return;
    }
    socket.emit('control-cmd', {
      cmd: 'cargar-magnetometro',
      data: {
        bias: { x: bx, y: by, z: bz },
        softHardIron: matrix
      }
    });
    setShowModalMagDatos(false);
    setMagBias({ x: '', y: '', z: '' });
    setMagSoftHardIron([['', '', ''], ['', '', ''], ['', '', '']]);
  };

  // Función para enviar comando de referenciar
  const handleReferenciar = () => {
    socket.emit('control-cmd', {
      cmd: 'referenciar',
      data: tipoNorte
    });
    
    // Guardar la selección en localStorage
    localStorage.setItem('tipoNorte', tipoNorte);
    
    // Mostrar mensaje de confirmación
    setMensajeReferencia('enviado');
    setTimeout(() => setMensajeReferencia(null), 3000);
  };

  // Función para enviar datos de orientación (rumbo, rolido, cabeceo)
  const handleEnviarOrientacion = () => {
    const rumboFloat = parseFloat(rumbo);
    const rolidoFloat = parseFloat(rolido);
    const cabeceoFloat = parseFloat(cabeceo);

    // Validar que todos los valores sean números válidos
    if (isNaN(rumboFloat) || isNaN(rolidoFloat) || isNaN(cabeceoFloat)) {
      alert('Por favor, ingrese valores numéricos válidos para todos los campos');
      return;
    }

    socket.emit('control-cmd', {
      cmd: 'orientacion',
      data: {
        rumbo: rumboFloat,
        rolido: rolidoFloat,
        cabeceo: cabeceoFloat
      }
    });
    
    // Mostrar mensaje de confirmación
    setMensajeOrientacion('enviado');
    setTimeout(() => setMensajeOrientacion(null), 3000);
  };

  const handleEnviarAltura = () => {

    if (altura  < 0 ) {
      alert('Por favor, ingrese valores numéricos válidos para todos los campos');
      return;
    }else{
    socket.emit('control-cmd', {
      cmd: 'altura',
      data: parseInt(altura)
    });

        // Guardar la selección en localStorage
    localStorage.setItem('altura', altura);

      // Mostrar mensaje de confirmación
    setMensajeImu('enviado');
    setTimeout(() => setMensajeImu(null), 3000);  

    }

  }

  // Función para enviar comando de tipo IMU
  const handleEnviarImu = () => {
    socket.emit('control-cmd', {
      cmd: 'tipo-imu',
      data: parseInt(tipoImu)
    });
    
    // Guardar la selección en localStorage
    localStorage.setItem('tipoImu', tipoImu);
    
    // Mostrar mensaje de confirmación
    setMensajeImu('enviado');
    setTimeout(() => setMensajeImu(null), 3000);
  };

  // Función para enviar comando de tipo mar
  const handleEnviarMar = () => {
    socket.emit('control-cmd', {
      cmd: 'tipo-mar',
      data: parseInt(tipoMar)
    });
    
    // Guardar la selección en localStorage
    localStorage.setItem('tipoMar', tipoMar);
    
    // Mostrar mensaje de confirmación
    setMensajeMar('enviado');
    setTimeout(() => setMensajeMar(null), 3000);
  };

  // Función para enviar la misión
  const handleConfirmEnviar = () => {
    setShowConfirmEnviar(false);
    setEstadoEnvio("enviando");

    socket.emit('control-cmd', {
      cmd: 'enviar-mision',
      data: waypoints
    });

    setTimeout(() => setEstadoEnvio("enviada"), 1000); // simulación
    setTimeout(() => setEstadoEnvio(null), 5000);
  };

  // Función para cargar la misión desde el micro
  const handleConfirmCargar = () => {
    setShowConfirmCargar(false);
    setEstadoCarga("cargando");
    respuestaRecibidaRef.current = false;

    socket.emit('control-cmd', { cmd: 'solicitar-mision' });

    socket.once('mision-descargada', (wpList) => {
      respuestaRecibidaRef.current = true;

      if (Array.isArray(wpList)) {
        setWaypoints(wpList);
        setEstadoCarga("cargada");
      } else {
        setEstadoCarga("error");
      }

      setTimeout(() => setEstadoCarga(null), 5000);
    });

    setTimeout(() => {
      if (!respuestaRecibidaRef.current) {
        setEstadoCarga("error");
        setTimeout(() => setEstadoCarga(null), 5000);
      }
    }, 5000);
  };

  // Función para agregar waypoint
  const handleAddWaypoint = () => {
    setShowWaypointForm(true);
    setNewWaypoint({ lat: '', lon: '' });
  };

  // Función para eliminar waypoint
  const handleDeleteWaypoint = () => {
    if (selectedWaypoint && selectedWaypoint.id !== 'Base') {
      setWaypoints(prev => {
        const filteredWaypoints = prev.filter(wp => wp.id !== selectedWaypoint.id);

        const baseWaypoint = filteredWaypoints.find(wp => wp.id === 'Base');
        const otherWaypoints = filteredWaypoints.filter(wp => wp.id !== 'Base');

        const reorganizedWaypoints = otherWaypoints.map((wp, index) => ({
          ...wp,
          id: `WP${index + 1}`
        }));

        return baseWaypoint ? [baseWaypoint, ...reorganizedWaypoints] : reorganizedWaypoints;
      });
      setSelectedWaypoint(null);
    }
  };

  // Función para modificar waypoint
  const handleModifyWaypoint = () => {
    if (selectedWaypoint && selectedWaypoint.id !== 'Base') {
      setShowWaypointForm(true);
      setNewWaypoint({
        id: selectedWaypoint.id,
        lat: selectedWaypoint.lat.toString(),
        lon: selectedWaypoint.lon.toString()
      });
    }
  };

  // Función para guardar waypoint
  const handleSaveWaypoint = () => {
    if (newWaypoint.lat && newWaypoint.lon) {
      const lat = parseFloat(newWaypoint.lat);
      const lon = parseFloat(newWaypoint.lon);
      if (!isNaN(lat) && !isNaN(lon)) {
        if (selectedWaypoint && selectedWaypoint.id && selectedWaypoint.id !== 'Base') {
          setWaypoints(prev => prev.map(wp =>
            wp.id === selectedWaypoint.id
              ? { ...wp, lat, lon }
              : wp
          ));
        } else {
          const wpCount = waypoints.filter(wp => wp.id.startsWith('WP')).length;
          const newId = `WP${wpCount + 1}`;
          setWaypoints(prev => [...prev, { id: newId, lat, lon }]);
        }
        setShowWaypointForm(false);
        setSelectedWaypoint(null);
        setNewWaypoint({ lat: '', lon: '' });
      }
    }
  };

  // Cancelar formulario
  const handleCancelForm = () => {
    setShowWaypointForm(false);
    setSelectedWaypoint(null);
    setNewWaypoint({ lat: '', lon: '' });
  };

  useEffect(() => {
    socket.on('telemetria', (data) => {
      try {
        const json = JSON.parse(data);

        if (typeof json.calibrando === 'boolean') {
          setCalibrando(json.calibrando);
        }
        if (typeof json.calibrado === 'boolean') {
          setCalibrado(json.calibrado);
        }
      } catch (e) {
        console.error('❌ Error parsing JSON:', e);
      }
    });

    return () => {
      socket.off('telemetria');
    };
  }, []);

  // Guardar en localStorage cuando cambie la selección
  useEffect(() => {
    localStorage.setItem('tipoNorte', tipoNorte);
  }, [tipoNorte]);

  useEffect(() => {
    localStorage.setItem('tipoImu', tipoImu);
  }, [tipoImu]);

  useEffect(() => {
    localStorage.setItem('tipoMar', tipoMar);
  }, [tipoMar]);

  return (
    <div className="w-full flex flex-row" style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Fondo Armada */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%', height: '100%',
          background: `url('/images/Armada.png') center center / contain no-repeat`,
          opacity: 0.18,
          zIndex: 0
        }}
      />

      {/* Contenido */}
      <div style={{ position: 'relative', width: '100%', zIndex: 1 }}>
        <div className="w-full flex flex-row">
          {/* Columna izquierda */}
          <div className="leftColumn w-1/4 flex flex-col justify-center">
            <h2 className="font-semibold text-lg mb-2">Control de Misión</h2>

            {/* Selector de waypoint */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Editar Waypoints:</label>
              <select
                value={selectedWaypoint?.id || ''}
                onChange={(e) => {
                  const wp = waypoints.find(w => w.id === e.target.value);
                  setSelectedWaypoint(wp || null);
                }}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              >
                <option value="">Seleccionar...</option>
                {waypoints.map(wp => (
                  <option key={wp.id} value={wp.id}>{wp.id}</option>
                ))}
              </select>
            </div>

            {/* Botones waypoint */}
            <div className="flex flex-col gap-2">
              <button onClick={handleAddWaypoint} className="bg-violet-500 text-white px-3 py-2 font-semibold rounded shadow-md hover:bg-violet-600">
                Agregar Waypoint
              </button>
              <button
                onClick={handleDeleteWaypoint}
                disabled={!selectedWaypoint || selectedWaypoint.id === 'Base'}
                className="bg-red-500 text-white px-3 py-2 font-semibold rounded shadow-md hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Eliminar Waypoint
              </button>
              <button
                onClick={handleModifyWaypoint}
                disabled={!selectedWaypoint || selectedWaypoint.id === 'Base'}
                className="bg-yellow-500 text-white px-3 py-2 font-semibold rounded shadow-md hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Modificar Waypoint
              </button>
            </div>

            {/* Formulario waypoint */}
            {showWaypointForm && (
              <div className="mt-4 p-3 bg-gray-100 rounded border">
                <h3 className="font-semibold text-sm mb-2">
                  {selectedWaypoint && selectedWaypoint.id ? 'Modificar' : 'Agregar'} Waypoint
                </h3>
                <div className="space-y-2">
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Latitud"
                    value={newWaypoint.lat}
                    onChange={(e) => setNewWaypoint({ ...newWaypoint, lat: e.target.value })}
                    className="w-full p-1 text-sm border rounded"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Longitud"
                    value={newWaypoint.lon}
                    onChange={(e) => setNewWaypoint({ ...newWaypoint, lon: e.target.value })}
                    className="w-full p-1 text-sm border rounded"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveWaypoint} className="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600">
                      Guardar
                    </button>
                    <button onClick={handleCancelForm} className="bg-gray-500 text-white px-3 py-1 text-sm rounded hover:bg-gray-600">
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Columna central - Calibrar */}
          <div className="centralColumn w-1/2 flex flex-col items-center justify-center space-y-4">
            <button
              onClick={() => setShowConfirm(true)}
              className={`px-4 py-2 font-semibold rounded shadow-md transition-all duration-300 ${
                calibrando ? 'bg-yellow-500' : calibrado ? 'bg-green-600' : 'bg-blue-500'
              } text-white`}
            >
              {calibrando ? 'Calibrando...' : calibrado ? 'Calibrado ✅' : 'Calibrar IMU'}
            </button>

            <button
              onClick={() => setShowConfirmMag(true)}
              className="px-4 py-2 font-semibold rounded shadow-md transition-all duration-300 bg-orange-400 hover:bg-orange-600 text-white"
            >
              Calibrar Magnetómetro
            </button>

            <div className='tipoNorte'>
              <h2> Calibrar Barometro </h2>
              <hr style={{ border: '1px solid #ccc', margin: '5px 0', width: '100%' }} />
              <div className="flex flex-col gap-3 mt-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Altura Relativa (cmts)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="0 cmts"
                    value={altura}
                    onChange={(e) => setAltura(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm text-black"
                    onWheel={(e) => e.target.blur()}
                  />
                </div>

                <button
                  onClick={handleEnviarAltura}
                  className="bg-blue-500 text-white px-4 py-2 font-semibold rounded shadow-md hover:bg-blue-600 mt-3"
                >
                  Enviar
                </button>
              </div>
              
             </div>


            <div className='tipoNorte'>
              <h2>🧭  Norte Referencia</h2>
              <hr style={{ border: '1px solid #ccc', margin: '5px 0',width:'100%' }} />
              <div className="flex flex-col gap-3 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoNorte"
                    value="desactivado"
                    checked={tipoNorte === 'desactivado'}
                    onChange={(e) => setTipoNorte(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>Desactivado</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoNorte"
                    value="magnetico"
                    checked={tipoNorte === 'magnetico'}
                    onChange={(e) => setTipoNorte(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>Magnético</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoNorte"
                    value="declinacion"
                    checked={tipoNorte === 'declinacion'}
                    onChange={(e) => setTipoNorte(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>Declinación</span>
                </label>
                <button
                  onClick={handleReferenciar}
                  className="bg-blue-500 text-white px-4 py-2 font-semibold rounded shadow-md hover:bg-blue-600 mt-3"
                >
                  Enviar
                </button>
              </div>
              
              {/* Mensaje de confirmación - Toast flotante */}
              {mensajeReferencia && (
                <div className="fixed top-4  z-50 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg shadow-lg ">
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2 text-xl">✅</span>
                    <div>
                      <span className="font-semibold block">Referencia enviada correctamente!</span>
                      <p className="text-sm opacity-80">
                        Tipo: <strong>{tipoNorte.charAt(0).toUpperCase() + tipoNorte.slice(1)}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className='tipoNorte'>
              <h2> Offsets</h2>
              <hr style={{ border: '1px solid #ccc', margin: '5px 0', width: '100%' }} />
              <div className="flex flex-col gap-3 mt-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Rumbo°</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={rumbo}
                    onChange={(e) => setRumbo(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm text-black"
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Rolido°</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={rolido}
                    onChange={(e) => setRolido(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm text-black"
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Cabeceo°</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={cabeceo}
                    onChange={(e) => setCabeceo(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm text-black"
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
                <button
                  onClick={handleEnviarOrientacion}
                  className="bg-blue-500 text-white px-4 py-2 font-semibold rounded shadow-md hover:bg-blue-600 mt-3"
                >
                  Enviar
                </button>
              </div>
              
              {/* Mensaje de confirmación - Toast flotante */}
              {mensajeOrientacion && (
                <div className="fixed top-4 z-50 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg shadow-lg">
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2 text-xl">✅</span>
                    <div>
                      <span className="font-semibold block">Orientación enviada correctamente!</span>
                      <p className="text-sm opacity-80">
                        Rumbo: <strong>{rumbo}°</strong> | Rolido: <strong>{rolido}°</strong> | Cabeceo: <strong>{cabeceo}°</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha - Enviar/Cargar misión */}
          <div className="rightColumn w-1/4 flex flex-col items-center justify-center gap-2">
            <button
              onClick={() => setShowConfirmEnviar(true)}
              className={`px-4 py-2 font-semibold rounded shadow-md transition-all duration-300 ${
                estadoEnvio === "enviada"
                  ? "bg-green-600 hover:bg-green-700"
                  : estadoEnvio === "enviando"
                  ? "bg-yellow-500 hover:bg-yellow-600"
                  : "bg-indigo-600 hover:bg-indigo-700"
              } text-white`}
            >
              {estadoEnvio === "enviando"
                ? "⏳ Enviando..."
                : estadoEnvio === "enviada"
                ? "✅ Misión Enviada"
                : "Enviar Misión Actual"}
            </button>

            <button
              onClick={() => setShowConfirmCargar(true)}
              className={`px-4 py-2 font-semibold rounded shadow-md transition-all duration-300 ${
                estadoCarga === "cargada"
                  ? "bg-green-600 hover:bg-green-700"
                  : estadoCarga === "cargando"
                  ? "bg-yellow-500 hover:bg-yellow-600"
                  : estadoCarga === "error"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-teal-600 hover:bg-teal-700"
              } text-white`}
            >
              {estadoCarga === "cargando"
                ? "⏳ Solicitando..."
                : estadoCarga === "cargada"
                ? "✅ Misión Cargada"
                : estadoCarga === "error"
                ? "❌ Sin respuesta"
                : "Cargar Misión Actual"}
            </button>

            {/* Panel Tipo IMU */}
            <div className="mt-7 relative">
              <button
                onClick={() => setPanelImuAbierto(!panelImuAbierto)}
                className="tipoBtn px-10 py-2 bg-purple-500 text-white font-semibold rounded shadow-md hover:bg-purple-600 transition-all duration-300 flex items-center justify-between"
              >
                <span> Tipo IMU</span>
                <span>{panelImuAbierto ? '▼' : '▶'}</span>
              </button>
              {panelImuAbierto && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-white rounded border shadow-xl z-50 min-w-[200px]">
                  <h3 className="font-semibold text-sm mb-2">Seleccionar Tipo IMU:</h3>
                  <div className="flex flex-col gap-2">
                    {opcionesImu.map((opcion) => (
                      <label key={opcion.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tipoImu"
                          value={opcion.value.toString()}
                          checked={tipoImu === opcion.value.toString()}
                          onChange={(e) => setTipoImu(e.target.value)}
                          className="w-4 h-4"
                        />
                        <span>{opcion.label}</span>
                      </label>
                    ))}
                    <button
                      onClick={handleEnviarImu}
                      className="bg-purple-500 text-white px-4 py-2 font-semibold rounded shadow-md hover:bg-purple-600 mt-2"
                    >
                      Enviar
                    </button>
                  </div>
                  {/* Mensaje de confirmación */}
                  {mensajeImu && (
                    <div className="fixed top-4 right-4 z-50 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg shadow-lg">
                      <div className="flex items-center">
                        <span className="text-green-500 mr-2 text-xl">✅</span>
                        <div>
                          <span className="font-semibold block">Tipo IMU enviado correctamente!</span>
                          <p className="text-sm opacity-80">
                            {opcionesImu.find(op => op.value.toString() === tipoImu)?.label || `Opción ${tipoImu}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Panel Tipo Mar */}
            <div className="mt-2 relative">
              <button
                onClick={() => setPanelMarAbierto(!panelMarAbierto)}
                className="tipoBtn px-10 py-2 bg-cyan-500 text-white font-semibold rounded shadow-md hover:bg-cyan-600 transition-all duration-300 flex items-center justify-around"
              >
                <span>Tipo Mar </span>
                <span>{panelMarAbierto ? '▼' : '▶'}</span>
              </button>
              {panelMarAbierto && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-white rounded border shadow-xl z-50 min-w-[200px]">
                  <h3 className="font-semibold text-sm mb-2">Seleccionar Tipo Mar:</h3>
                  <div className="flex flex-col gap-2">
                    {opcionesMar.map((opcion) => (
                      <label key={opcion.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tipoMar"
                          value={opcion.value.toString()}
                          checked={tipoMar === opcion.value.toString()}
                          onChange={(e) => setTipoMar(e.target.value)}
                          className="w-4 h-4"
                        />
                        <span>{opcion.label}</span>
                      </label>
                    ))}
                    <button
                      onClick={handleEnviarMar}
                      className="bg-cyan-500 text-white px-4 py-2 font-semibold rounded shadow-md hover:bg-cyan-600 mt-2"
                    >
                      Enviar
                    </button>
                  </div>
                  {/* Mensaje de confirmación */}
                  {mensajeMar && (
                    <div className="fixed top-4 right-4 z-50 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg shadow-lg">
                      <div className="flex items-center">
                        <span className="text-green-500 mr-2 text-xl">✅</span>
                        <div>
                          <span className="font-semibold block">Tipo Mar enviado correctamente!</span>
                          <p className="text-sm opacity-80">
                            {opcionesMar.find(op => op.value.toString() === tipoMar)?.label || `Opción ${tipoMar}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm calibrar */}
      {showConfirm && (
        <div className="confirmModal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ Advertencia</h2>
            <p className="mb-4 text-gray-800">
              Esta acción iniciará el proceso de calibrado completo de la IMU.<br />
              El proceso durará aproximadamente <strong>1 minuto</strong> y no debe interrumpirse.
            </p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setShowConfirm(false)} className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded">
                Cancelar
              </button>
              <button onClick={() => { setShowConfirm(false); toggleCalibrar(); }} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm calibrar magnetómetro */}
      {showConfirmMag && (
        <div className="confirmModal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ Advertencia</h2>
            <p className="mb-4 text-gray-800">
              Esta acción iniciará el proceso de calibrado del magnetómetro.  Este buscara referencia en todos los ejes y posiciones posibles, por lo que el proceso puede demorar unos minutos.<br />

              No interrumpas el procedimiento una vez iniciado.
            </p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setShowConfirmMag(false)} className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded">
                Cancelar
              </button>
              <button onClick={() => { setShowConfirmMag(false); setShowModalMagDatos(true); }} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal datos magnetómetro (bias + soft/hard iron) */}
      {showModalMagDatos && (
        <div className="confirmModal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="modalMagDatos bg-white p-6 rounded-lg shadow-xl max-w-lg w-full text-left">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Datos de calibración magnetómetro</h2>

            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Bias combinadas</p>
              <div className="flex items-center gap-2 flex-wrap modalMagDatos-bias-row">
                <span className="text-gray-600 w-4">X</span>
                <input type="number" step="any" value={magBias.x} onChange={e => setMagBias(prev => ({ ...prev, x: e.target.value }))} className="border rounded px-2 py-1 w-24 text-gray-800" placeholder="0" />
                <span className="text-gray-600 w-4">Y</span>
                <input type="number" step="any" value={magBias.y} onChange={e => setMagBias(prev => ({ ...prev, y: e.target.value }))} className="border rounded px-2 py-1 w-24 text-gray-800" placeholder="0" />
                <span className="text-gray-600 w-4">Z</span>
                <input type="number" step="any" value={magBias.z} onChange={e => setMagBias(prev => ({ ...prev, z: e.target.value }))} className="border rounded px-2 py-1 w-24 text-gray-800" placeholder="0" />
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Corrección soft iron y hard iron</p>
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <span className="flex-1 min-w-0 text-center font-semibold text-gray-600 text-sm">X</span>
                  <span className="flex-1 min-w-0 text-center font-semibold text-gray-600 text-sm">Y</span>
                  <span className="flex-1 min-w-0 text-center font-semibold text-gray-600 text-sm">Z</span>
                </div>
                {magSoftHardIron.map((row, ri) => (
                  <div key={ri} className="flex gap-2 items-center">
                    {row.map((cell, ci) => (
                      <input key={ci} type="number" step="any" value={cell} onChange={e => setMagSoftHardIronCell(ri, ci, e.target.value)} className="border rounded px-2 py-1 flex-1 min-w-0 text-gray-800" placeholder="0" />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModalMagDatos(false)} className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded">
                Cancelar
              </button>
              <button onClick={handleCargarDatosMagnetometro} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                Cargar datos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm enviar misión */}
      {showConfirmEnviar && (
        <div className="confirmModal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ Advertencia</h2>
            <p className="mb-4 text-gray-800">
              Se cargará el USV con la misión actual, reemplazando la misión que tiene cargada actualmente.
            </p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setShowConfirmEnviar(false)} className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded">
                Cancelar
              </button>
              <button onClick={handleConfirmEnviar} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                Confirmar Envío
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm cargar misión */}
      {showConfirmCargar && (
        <div className= "confirmModal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md text-center">
            <h2 className="text-xl font-bold text-blue-600 mb-4">ℹ️ Atención</h2>
            <p className="mb-4 text-gray-800">
              Se solicitará al USV la misión cargada actualmente. Esta reemplazará la misión visible en pantalla.
            </p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setShowConfirmCargar(false)} className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded">
                Cancelar
              </button>
              <button onClick={handleConfirmCargar} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                Confirmar Carga
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
