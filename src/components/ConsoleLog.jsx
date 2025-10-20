import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

const ConsoleLog = () => {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('info'); // Filtro actual
  const logEndRef = useRef(null);

  useEffect(() => {
    const handleMessage = (data) => {
      setLogs((prev) => [...prev.slice(-99), data]);
    };

    socket.on('connect', () => {
      handleMessage({
        timestamp: new Date().toLocaleString('es-AR'),
        type: 'info',
        message: '✅ Conectado al backend WebSocket',
      });
    });

    socket.on('disconnect', () => {
      handleMessage({
        timestamp: new Date().toLocaleString('es-AR'),
        type: 'warn',
        message: '⚠️ Desconectado del backend WebSocket',
      });
    });

    socket.on('serial-data', handleMessage);
/*
    socket.on('serial-data', (data) => {
      handleMessage({
        timestamp: new Date().toLocaleString('es-AR'),
        type: 'data',
        message: data,
      });
    });
*/
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('serial-data', handleMessage);
    };
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const colorByType = {
    info: 'text-blue-300',
    warn: 'text-yellow-300',
    error: 'text-red-400',
    data: 'text-green-400',
  };

  // Filtro de logs según tipo
  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    if (filter === 'info') return ['info', 'warn', 'error'].includes(log.type);
    if (filter === 'data') return log.type === 'data';
    return false;
  });

  return (
<div className="flex flex-col h-full min-h-[200px] max-h-[45vh] overflow-hidden">
  {/* Consola scrollable */}
  <div className="flex-1 overflow-y-auto bg-black font-mono text-sm p-2 rounded">
    {filteredLogs.map((log, i) => (
      <div key={i} className={colorByType[log.type] || 'text-white'}>
        [{log.timestamp}] {typeof log.message === 'string' ? log.message : JSON.stringify(log.message)}
      </div>
    ))}
    <div ref={logEndRef} />
  </div>

  {/* Botones de filtro */}
  <div className="mt-2 flex justify-center">
    <div className="botonesConsole flex space-x-2">
      <button
        onClick={() => setLogs([])}
        className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 border border-red-800"
      >
        Reset
      </button>
      {['all', 'info', 'data'].map((type) => (
        <button
          key={type}
          onClick={() => setFilter(type)}
          className={`py-1 px-4 border border-gray-400 font-bold text-black bg-gray-200 
            ${filter === type ? 'ring ring-gray-500 bg-gray-300' : 'hover:bg-gray-300'}
          `}
        >
          {type === 'all' ? 'Todo' : type === 'info' ? 'Info' : 'Datos'}
        </button>
      ))}
    </div>
  </div>
</div>

  );
};

export default ConsoleLog;
