import React, { useState, useEffect } from 'react';
import DataNormalizer from '../services/DataNormalizer';

const NormalizationStats = () => {
  const [stats, setStats] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      setStats(DataNormalizer.getNormalizationStats());
    };

    // Actualizar cada 5 segundos
    const interval = setInterval(updateStats, 5000);
    updateStats(); // Actualización inicial

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-blue-700 z-50"
      >
        🧮 Estado IA
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-sm z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800">🧮 Normalización IA</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {stats && (
        <div className="space-y-3 text-sm">
          {/* Estado del Sistema */}
          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="font-medium text-green-700 mb-2">✅ Sistema Activo</h4>
            <div className="text-xs text-green-600">
              <div>• Normalización automática funcionando</div>
              <div>• Datos marítimos optimizados</div>
              <div>• IA mejorada con normalización</div>
            </div>
          </div>

          {/* Métodos en Uso */}
          <div>
            <h4 className="font-medium text-blue-600 mb-2">🔧 Métodos Activos</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                <span className="text-gray-700">Min-Max:</span>
                <span className="ml-auto text-gray-500">Velocidad, Distancia</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                <span className="text-gray-700">Robust:</span>
                <span className="ml-auto text-gray-500">Oleaje, Viento</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                <span className="text-gray-700">Log:</span>
                <span className="ml-auto text-gray-500">ETA, Período</span>
              </div>
            </div>
          </div>

          {/* Datos Procesados */}
          <div>
            <h4 className="font-medium text-purple-600 mb-2">📊 Datos Procesados</h4>
            <div className="text-xs text-gray-600">
              {Object.keys(stats.adaptiveStats).length > 0 ? (
                <div>
                  <div className="mb-1">• {Object.keys(stats.adaptiveStats).length} variables activas</div>
                  <div className="mb-1">• {Object.values(stats.dataHistorySizes).reduce((a, b) => a + b, 0)} muestras totales</div>
                  <div>• Actualización automática cada 5s</div>
                </div>
              ) : (
                <div className="text-gray-500">• Esperando datos...</div>
              )}
            </div>
          </div>

          {/* Acciones Simplificadas */}
          <div className="flex gap-2 pt-2 border-t">
            <button
              onClick={() => DataNormalizer.clearHistory()}
              className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
            >
              🔄 Reiniciar
            </button>
            <button
              onClick={() => setStats(DataNormalizer.getNormalizationStats())}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              📈 Actualizar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NormalizationStats; 