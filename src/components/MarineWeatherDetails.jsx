import React from 'react';

const MarineWeatherDetails = ({ marineData, basicData }) => {
  if (!marineData && !basicData) {
    return (
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-sm text-gray-600">
          No hay datos marítimos disponibles
        </div>
      </div>
    );
  }

  const getWindDirection = (degrees) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  const getWaveDescription = (height) => {
    if (height < 0.5) return 'Calma';
    if (height < 1.0) return 'Oleaje ligero';
    if (height < 2.0) return 'Oleaje moderado';
    if (height < 3.0) return 'Oleaje fuerte';
    return 'Oleaje muy fuerte';
  };

  const getCurrentDescription = (speed) => {
    if (speed < 1) return 'Débil';
    if (speed < 2) return 'Moderada';
    if (speed < 3) return 'Fuerte';
    return 'Muy fuerte';
  };

  const data = marineData || basicData;

  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h4 className="font-medium mb-3 text-blue-800">
        {marineData ? '🌊 Datos Marítimos Especializados' : '🌤️ Datos Meteorológicos Básicos'}
      </h4>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        {/* Temperatura */}
        <div className="bg-white p-3 rounded-lg">
          <div className="flex items-center mb-1">
            <span className="text-lg mr-2">🌡️</span>
            <span className="font-medium">Temperatura</span>
          </div>
          <div className="text-lg font-bold text-blue-600">
            {data.temperature?.toFixed(1)}°C
          </div>
          {marineData?.waterTemperature && (
            <div className="text-xs text-blue-500">
              Agua: {marineData.waterTemperature.toFixed(1)}°C
            </div>
          )}
        </div>

        {/* Viento */}
        <div className="bg-white p-3 rounded-lg">
          <div className="flex items-center mb-1">
            <span className="text-lg mr-2">💨</span>
            <span className="font-medium">Viento</span>
          </div>
          <div className="text-lg font-bold text-blue-600">
            {data.wind?.speed?.toFixed(1) || data.windSpeed?.toFixed(1)} m/s
          </div>
          <div className="text-xs text-gray-500">
            {getWindDirection(data.wind?.direction || data.windDirection)} 
            ({data.wind?.direction?.toFixed(0) || data.windDirection?.toFixed(0)}°)
          </div>
          {data.wind?.gust && (
            <div className="text-xs text-orange-500">
              Racha: {data.wind.gust.toFixed(1)} m/s
            </div>
          )}
        </div>

        {/* Oleaje (solo datos marítimos) */}
        {marineData?.waves && (
          <div className="bg-white p-3 rounded-lg">
            <div className="flex items-center mb-1">
              <span className="text-lg mr-2">🌊</span>
              <span className="font-medium">Oleaje</span>
            </div>
            <div className="text-lg font-bold text-blue-600">
              {marineData.waves.height.toFixed(1)}m
            </div>
            <div className="text-xs text-gray-500">
              {getWaveDescription(marineData.waves.height)}
            </div>
            <div className="text-xs text-blue-500">
              Período: {marineData.waves.period}s
            </div>
          </div>
        )}

        {/* Corrientes (solo datos marítimos) */}
        {marineData?.currents && (
          <div className="bg-white p-3 rounded-lg">
            <div className="flex items-center mb-1">
              <span className="text-lg mr-2">🌊</span>
              <span className="font-medium">Corriente</span>
            </div>
            <div className="text-lg font-bold text-blue-600">
              {marineData.currents.surface.speed.toFixed(1)} nudos
            </div>
            <div className="text-xs text-gray-500">
              {getCurrentDescription(marineData.currents.surface.speed)}
            </div>
            <div className="text-xs text-blue-500">
              {getWindDirection(marineData.currents.surface.direction)} 
              ({marineData.currents.surface.direction.toFixed(0)}°)
            </div>
          </div>
        )}

        {/* Presión */}
        <div className="bg-white p-3 rounded-lg">
          <div className="flex items-center mb-1">
            <span className="text-lg mr-2">📊</span>
            <span className="font-medium">Presión</span>
          </div>
          <div className="text-lg font-bold text-blue-600">
            {data.pressure} hPa
          </div>
          <div className="text-xs text-gray-500">
            {data.pressure > 1013 ? 'Alta' : 'Baja'}
          </div>
        </div>

        {/* Visibilidad */}
        <div className="bg-white p-3 rounded-lg">
          <div className="flex items-center mb-1">
            <span className="text-lg mr-2">👁️</span>
            <span className="font-medium">Visibilidad</span>
          </div>
          <div className="text-lg font-bold text-blue-600">
            {data.visibility?.toFixed(1)} km
          </div>
          <div className="text-xs text-gray-500">
            {data.visibility > 10 ? 'Excelente' : data.visibility > 5 ? 'Buena' : 'Reducida'}
          </div>
        </div>
      </div>

      {/* Datos adicionales marítimos */}
      {marineData && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <h5 className="font-medium mb-2 text-green-700">🌊 Datos Marítimos Adicionales</h5>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {marineData.waves.energy && (
              <div>
                <div className="font-medium text-green-600">Energía de olas</div>
                <div className="text-lg font-bold">{marineData.waves.energy.toFixed(2)}</div>
              </div>
            )}
            {marineData.currents.subsurface && (
              <div>
                <div className="font-medium text-green-600">Corriente subsuperficie</div>
                <div className="text-lg font-bold">{marineData.currents.subsurface.speed.toFixed(1)} nudos</div>
              </div>
            )}
            {marineData.tide && (
              <div>
                <div className="font-medium text-green-600">Marea</div>
                <div className="text-lg font-bold">{marineData.tide.height.toFixed(1)}m</div>
                <div className="text-xs text-gray-500">
                  {new Date(marineData.tide.time).toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Información de fuentes */}
      <div className="mt-3 text-xs text-gray-500">
        <div className="flex items-center">
          <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
          {marineData ? 'Datos de OpenWeatherMap + Estimaciones marítimas' : 'Datos de OpenWeatherMap API'}
        </div>
        <div className="flex items-center">
          <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
          Actualizado cada 10 minutos
        </div>
        {marineData?.sources && (
          <div className="flex items-center">
            <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
            Fuentes: {Object.entries(marineData.sources)
              .filter(([_, available]) => available)
              .map(([source, _]) => source.toUpperCase())
              .join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarineWeatherDetails; 