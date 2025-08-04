import React from 'react';
import MarineWeatherDetails from './MarineWeatherDetails';

const UnifiedAIPanel = ({ predictions, isAILoading, isTraining, trainingProgress, aiError }) => {
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

  const formatHours = (hours) => {
    if (!hours) return 'Calculando...';
    if (hours < 0) return 'Error en modelo';
    return `${hours.toFixed(2)}h`;
  };

  const getETAInterpretation = (hours) => {
    if (!hours || hours < 0) return 'Modelo en entrenamiento';
    if (hours < 0.5) return 'Muy rápido';
    if (hours < 2) return 'Rápido';
    if (hours < 5) return 'Normal';
    if (hours < 10) return 'Lento';
    return 'Muy lento';
  };

  if (isAILoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-3">🤖 IA Unificada</h3>
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
        <h3 className="text-lg font-semibold mb-3">🤖 IA Unificada</h3>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {aiError}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-3">🤖 IA Unificada</h3>
      
      {/* Estado de entrenamiento */}
      {isTraining && (
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-3"></div>
            <span className="font-medium">Entrenando modelos...</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${trainingProgress}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-600 mt-1">{trainingProgress}% completado</div>
        </div>
      )}

      {/* Predicción de ETA */}
      <div className="mb-4">
        <h4 className="font-medium mb-2 text-blue-800">⏱️ Tiempo Estimado de Llegada</h4>
        <div className="bg-blue-50 p-3 rounded">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">⏱️</span>
            <span className="font-medium text-blue-700">ETA</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {formatHours(predictions.eta.neural || predictions.eta.linear || predictions.eta.average)}
          </div>
          <div className="text-xs text-blue-500 mt-1">
            {getETAInterpretation(predictions.eta.neural || predictions.eta.linear || predictions.eta.average)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Basado en: posición, velocidad, viento, corrientes y condiciones marítimas
          </div>
        </div>
      </div>

      {/* Otras predicciones */}
      <div className="grid grid-cols-3 gap-4">
        {/* Anomalías */}
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">{getAnomalyIcon(predictions.anomalies)}</span>
            <span className="font-medium text-orange-800">Anomalías</span>
          </div>
          <div className="text-lg font-bold text-orange-600">
            {predictions.anomalies ? 'Detectadas' : 'Normal'}
          </div>
          <div className="text-xs text-orange-500 mt-1">
            {predictions.anomalies ? 'Revisar sensores' : 'Sistema operativo normal'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Monitoreo: temperatura, presión, voltaje, RPM
          </div>
        </div>

        {/* Consumo de Combustible */}
        <div className="bg-yellow-50 rounded-lg p-3">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">⛽</span>
            <span className="font-medium text-yellow-800">Consumo</span>
          </div>
          <div className="text-lg font-bold text-yellow-600">
            {predictions.fuelConsumption ? `${predictions.fuelConsumption.toFixed(2)} l/h` : 'Calculando...'}
          </div>
          <div className="text-xs text-yellow-500 mt-1">
            {predictions.fuelConsumption ? 
              (predictions.fuelConsumption < 20 ? 'Eficiente' : 
               predictions.fuelConsumption < 40 ? 'Normal' : 'Alto consumo') : 
              'Consumo de combustible'
            }
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Basado en: velocidad, peso, condiciones marítimas
          </div>
        </div>

        {/* Datos Marítimos Especializados */}
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">🌊</span>
            <span className="font-medium text-purple-800">Datos Marítimos</span>
          </div>
          <div className="text-lg font-bold text-purple-600">
            {predictions.marineWeatherData ? 'Especializados' : predictions.basicWeatherData ? 'Básicos' : 'Sin datos'}
          </div>
          <div className="text-xs text-purple-500 mt-1">
            {predictions.marineWeatherData ? 
              `${predictions.marineWeatherData.waves?.height?.toFixed(1)}m olas, ${predictions.marineWeatherData.currents?.surface?.speed?.toFixed(1)} nudos corriente` :
              predictions.basicWeatherData ? 
              `${predictions.basicWeatherData.temperature?.toFixed(1)}°C, ${predictions.basicWeatherData.windSpeed?.toFixed(1)} m/s viento` :
              'Condiciones marítimas'
            }
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {predictions.marineWeatherData ? 'OpenWeatherMap + Estimaciones' : predictions.basicWeatherData ? 'OpenWeatherMap API' : 'Datos simulados'}
          </div>
        </div>
      </div>


      {/* Detalles Marítimos Especializados */}
      {(predictions.marineWeatherData || predictions.basicWeatherData) && (
        <div className="mt-4">
          <MarineWeatherDetails 
            marineData={predictions.marineWeatherData}
            basicData={predictions.basicWeatherData}
          />
        </div>
      )}

    </div>
  );
};

export default UnifiedAIPanel; 