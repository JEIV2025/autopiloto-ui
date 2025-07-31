import React from 'react';

const WeatherDetails = ({ weatherData }) => {
  if (!weatherData) {
    return (
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-sm text-gray-600">
          No hay datos de clima disponibles
        </div>
      </div>
    );
  }

  const getWindDirection = (degrees) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  const getWeatherIcon = (iconCode) => {
    const iconMap = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '🌨️', '13n': '🌨️',
      '50d': '🌫️', '50n': '🌫️'
    };
    return iconMap[iconCode] || '🌤️';
  };

  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h4 className="font-medium mb-3 text-blue-800">🌤️ Información Meteorológica Detallada</h4>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        {/* Temperatura */}
        <div className="bg-white p-3 rounded-lg">
          <div className="flex items-center mb-1">
            <span className="text-lg mr-2">🌡️</span>
            <span className="font-medium">Temperatura</span>
          </div>
          <div className="text-lg font-bold text-blue-600">
            {weatherData.temperature?.toFixed(1)}°C
          </div>
          <div className="text-xs text-gray-500">
            Sensación: {weatherData.feelsLike?.toFixed(1)}°C
          </div>
        </div>

        {/* Viento */}
        <div className="bg-white p-3 rounded-lg">
          <div className="flex items-center mb-1">
            <span className="text-lg mr-2">💨</span>
            <span className="font-medium">Viento</span>
          </div>
          <div className="text-lg font-bold text-blue-600">
            {weatherData.windSpeed?.toFixed(1)} m/s
          </div>
          <div className="text-xs text-gray-500">
            {getWindDirection(weatherData.windDirection)} ({weatherData.windDirection?.toFixed(0)}°)
          </div>
        </div>

        {/* Presión */}
        <div className="bg-white p-3 rounded-lg">
          <div className="flex items-center mb-1">
            <span className="text-lg mr-2">📊</span>
            <span className="font-medium">Presión</span>
          </div>
          <div className="text-lg font-bold text-blue-600">
            {weatherData.pressure} hPa
          </div>
          <div className="text-xs text-gray-500">
            {weatherData.pressure > 1013 ? 'Alta' : 'Baja'}
          </div>
        </div>

        {/* Humedad */}
        <div className="bg-white p-3 rounded-lg">
          <div className="flex items-center mb-1">
            <span className="text-lg mr-2">💧</span>
            <span className="font-medium">Humedad</span>
          </div>
          <div className="text-lg font-bold text-blue-600">
            {weatherData.humidity}%
          </div>
          <div className="text-xs text-gray-500">
            {weatherData.humidity > 70 ? 'Alta' : weatherData.humidity > 40 ? 'Normal' : 'Baja'}
          </div>
        </div>

        {/* Visibilidad */}
        <div className="bg-white p-3 rounded-lg">
          <div className="flex items-center mb-1">
            <span className="text-lg mr-2">👁️</span>
            <span className="font-medium">Visibilidad</span>
          </div>
          <div className="text-lg font-bold text-blue-600">
            {weatherData.visibility?.toFixed(1)} km
          </div>
          <div className="text-xs text-gray-500">
            {weatherData.visibility > 10 ? 'Excelente' : weatherData.visibility > 5 ? 'Buena' : 'Reducida'}
          </div>
        </div>

        {/* Estado del tiempo */}
        <div className="bg-white p-3 rounded-lg">
          <div className="flex items-center mb-1">
            <span className="text-lg mr-2">{getWeatherIcon(weatherData.icon)}</span>
            <span className="font-medium">Estado</span>
          </div>
          <div className="text-lg font-bold text-blue-600 capitalize">
            {weatherData.description}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(weatherData.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Datos marítimos si están disponibles */}
      {weatherData.waveHeight && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <h5 className="font-medium mb-2 text-green-700">🌊 Datos Marítimos</h5>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="font-medium text-green-600">Altura de olas</div>
              <div className="text-lg font-bold">{weatherData.waveHeight?.toFixed(1)}m</div>
            </div>
            <div>
              <div className="font-medium text-green-600">Corriente</div>
              <div className="text-lg font-bold">{weatherData.currentSpeed?.toFixed(1)} nudos</div>
            </div>
            <div>
              <div className="font-medium text-green-600">Temp. mar</div>
              <div className="text-lg font-bold">{weatherData.seaTemperature?.toFixed(1)}°C</div>
            </div>
          </div>
        </div>
      )}

      {/* Información de la API */}
      <div className="mt-3 text-xs text-gray-500">
        <div className="flex items-center">
          <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
          Datos de OpenWeatherMap API
        </div>
        <div className="flex items-center">
          <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
          Actualizado cada 5 minutos
        </div>
      </div>
    </div>
  );
};

export default WeatherDetails; 