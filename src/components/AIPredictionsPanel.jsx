import React from 'react';

const AIPredictionsPanel = ({ predictions, isAILoading, aiError }) => {
  const getStateColor = (state) => {
    switch (state) {
      case 0: return 'text-green-600 bg-green-100';
      case 1: return 'text-yellow-600 bg-yellow-100';
      case 2: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStateIcon = (state) => {
    switch (state) {
      case 0: return '✅';
      case 1: return '⚠️';
      case 2: return '🚨';
      default: return '❓';
    }
  };

  const getAnomalyIcon = (hasAnomalies) => {
    return hasAnomalies ? '🚨' : '✅';
  };

  const formatETA = (eta) => {
    if (!eta) return 'Calculando...';
    const hours = Math.floor(eta / 60);
    const minutes = Math.round(eta % 60);
    return `${hours}h ${minutes}m`;
  };

  if (isAILoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-3">🤖 Predicciones IA</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Inicializando IA...</span>
        </div>
      </div>
    );
  }

  if (aiError) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-3">🤖 Predicciones IA</h3>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {aiError}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-3">🤖 Predicciones IA</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* ETA Prediction */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">⏱️</span>
            <span className="font-medium text-blue-800">ETA</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {formatETA(predictions.eta)}
          </div>
          <div className="text-xs text-blue-500 mt-1">
            Tiempo estimado de llegada
          </div>
        </div>

        {/* System State */}
        <div className={`rounded-lg p-3 ${getStateColor(predictions.systemState.state)}`}>
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">{getStateIcon(predictions.systemState.state)}</span>
            <span className="font-medium">Estado</span>
          </div>
          <div className="text-xl font-bold">
            {predictions.systemState.stateName}
          </div>
          <div className="text-xs mt-1 opacity-75">
            Estado del sistema
          </div>
        </div>

        {/* Anomaly Detection */}
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">{getAnomalyIcon(predictions.anomalies)}</span>
            <span className="font-medium text-orange-800">Anomalías</span>
          </div>
          <div className="text-lg font-bold text-orange-600">
            {predictions.anomalies ? 'Detectadas' : 'Normal'}
          </div>
          <div className="text-xs text-orange-500 mt-1">
            Monitoreo de telemetría
          </div>
        </div>

        {/* Weather Prediction */}
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">🌤️</span>
            <span className="font-medium text-purple-800">Clima</span>
          </div>
          <div className="text-lg font-bold text-purple-600">
            {predictions.weather ? 'Predicción activa' : 'Sin datos'}
          </div>
          <div className="text-xs text-purple-500 mt-1">
            Condiciones meteorológicas
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <div className="flex items-center mb-1">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
            IA inicializada y funcionando
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
            Actualizando predicciones en tiempo real
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPredictionsPanel; 