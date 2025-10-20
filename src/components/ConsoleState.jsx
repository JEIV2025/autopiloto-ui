import React, { useEffect, useMemo, useRef, useState } from 'react';
import io from 'socket.io-client';
import '../style/ConsoleState.css'

const ConsoleState = () => {
  const [backendStatus, setBackendStatus] = useState('connecting');
  const [lastTelemetryAt, setLastTelemetryAt] = useState(null);
  const [wifiOnline, setWifiOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const socketRef = useRef(null);

  useEffect(() => {
    // Backend connection via socket.io
    const socket = io('http://localhost:3001', { transports: ['websocket'], reconnection: true });
    socketRef.current = socket;

    const handleConnect = () => setBackendStatus('connected');
    const handleDisconnect = () => setBackendStatus('disconnected');
    const handleTelemetry = (data) => {
 
      try {
        const payload = typeof data === 'string' ? JSON.parse(data) : data;
        if (payload) setLastTelemetryAt(Date.now());
      } catch (_e) {
        setLastTelemetryAt(Date.now());
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect_attempt', () => setBackendStatus('connecting'));
    socket.on('reconnecting', () => setBackendStatus('connecting'));
    socket.on('connect_error', () => setBackendStatus('connecting'));
    socket.on('connect_timeout', () => setBackendStatus('connecting'));
    socket.on('telemetria', handleTelemetry);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect_attempt');
      socket.off('reconnecting');
      socket.off('connect_error');
      socket.off('connect_timeout');
      socket.off('telemetria', handleTelemetry);
      socket.close();
    };
  }, []);

  useEffect(() => {
    const onOnline = () => setWifiOnline(true);
    const onOffline = () => setWifiOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Antenna status with a middle "buscando" state
  const antennaStatus = useMemo(() => {
    const now = Date.now();
    if (!lastTelemetryAt) {
      return backendStatus === 'connected' ? 'buscando' : 'desconectada';
    }
    const delta = now - lastTelemetryAt;
    if (delta < 5000) return 'ok';
    if (delta < 15000) return 'buscando';
    return 'desconectada';
  }, [lastTelemetryAt, backendStatus]);

  const renderPill = (status, label, icon) => {
    let classes = '';
    let suffix = '';
    if (status === 'ok' || status === 'connected' || status === true) {
      classes = 'bg-green-300 text-green-800';
      suffix = '●';
    } else if (status === 'buscando' || status === 'connecting') {
      classes = 'bg-yellow-300 text-yellow-900';
    } else {
      classes = 'bg-red-300 text-red-900';
      suffix = '○';
    }
    const title =
      status === 'ok' || status === 'connected' || status === true
        ? `${label}: OK`
        : status === 'buscando' || status === 'connecting'
        ? `${label}: Buscando conexión...`
        : `${label}: Sin conexión`;

    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold shadow-sm ${classes}`} title={title}>
        <span className="text-base">{icon}</span>
        <span>{label}</span>
        <span className="ml-1">{suffix}</span>
      </div>
    );
  };

  return (
    <div className="stateBox w-full flex items-center gap-2 px-2 py-1 bg-black/80 backdrop-blur-sm border border-gray-200 rounded-md">
      {renderPill(backendStatus, 'Servidor', '🖥️')}
      {renderPill(wifiOnline ? 'ok' : 'desconectada', 'Wi‑Fi', '📶')}
      {renderPill(antennaStatus, 'Antena', '📡')}
      
      <div className="ml-auto text-xs text-white">
        {antennaStatus === 'ok' && lastTelemetryAt ? `RX ${Math.max(0, Math.floor((Date.now() - lastTelemetryAt) / 1000))}s` : antennaStatus === 'buscando' ? 'Buscando telemetría...' : 'Sin telemetría'}
      </div>
    </div>
  );
};

export default ConsoleState;