// Servicio para integración con API de clima real
class WeatherService {
  constructor() {
    // Puedes obtener una API key gratuita en: https://openweathermap.org/api
    this.apiKey = process.env.REACT_APP_OPENWEATHER_API_KEY || 'tu_api_key_aqui';
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // Obtener clima actual por coordenadas
  async getCurrentWeather(lat, lon) {
    const cacheKey = `current_${lat}_${lon}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=es`
      );
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      const weatherData = this.parseWeatherData(data);
      
      this.setCachedData(cacheKey, weatherData);
      return weatherData;
    } catch (error) {
      console.error('Error obteniendo clima actual:', error);
      return this.getMockWeatherData();
    }
  }

  // Obtener pronóstico de 5 días
  async getWeatherForecast(lat, lon) {
    const cacheKey = `forecast_${lat}_${lon}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=es`
      );
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      const forecastData = this.parseForecastData(data);
      
      this.setCachedData(cacheKey, forecastData);
      return forecastData;
    } catch (error) {
      console.error('Error obteniendo pronóstico:', error);
      return this.getMockForecastData();
    }
  }

  // Obtener datos marítimos específicos
  async getMarineWeather(lat, lon) {
    const cacheKey = `marine_${lat}_${lon}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // OpenWeatherMap no tiene API marina gratuita, pero podemos usar datos básicos
      const currentWeather = await this.getCurrentWeather(lat, lon);
      
      // Simular datos marítimos basados en el clima
      const marineData = {
        ...currentWeather,
        waveHeight: this.estimateWaveHeight(currentWeather.windSpeed),
        currentSpeed: this.estimateCurrentSpeed(currentWeather.windSpeed),
        currentDirection: this.estimateCurrentDirection(currentWeather.windDirection),
        visibility: currentWeather.visibility,
        seaTemperature: this.estimateSeaTemperature(currentWeather.temperature)
      };
      
      this.setCachedData(cacheKey, marineData);
      return marineData;
    } catch (error) {
      console.error('Error obteniendo datos marítimos:', error);
      return this.getMockMarineData();
    }
  }

  // Parsear datos de clima actual
  parseWeatherData(data) {
    return {
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind.speed,
      windDirection: data.wind.deg,
      visibility: data.visibility / 1000, // Convertir a km
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      timestamp: new Date().toISOString()
    };
  }

  // Parsear datos de pronóstico
  parseForecastData(data) {
    const forecasts = data.list.map(item => ({
      timestamp: new Date(item.dt * 1000).toISOString(),
      temperature: item.main.temp,
      humidity: item.main.humidity,
      pressure: item.main.pressure,
      windSpeed: item.wind.speed,
      windDirection: item.wind.deg,
      description: item.weather[0].description,
      icon: item.weather[0].icon
    }));

    return {
      forecasts,
      city: data.city.name,
      country: data.city.country
    };
  }

  // Estimar altura de olas basada en velocidad del viento
  estimateWaveHeight(windSpeed) {
    // Fórmula simplificada: altura de ola ≈ velocidad del viento * 0.1
    return Math.max(0.1, windSpeed * 0.1);
  }

  // Estimar velocidad de corriente
  estimateCurrentSpeed(windSpeed) {
    // Corrientes suelen ser 1-3 nudos
    return Math.max(0.5, Math.min(3, windSpeed * 0.2));
  }

  // Estimar dirección de corriente
  estimateCurrentDirection(windDirection) {
    // Las corrientes suelen seguir la dirección del viento con variación
    return (windDirection + Math.random() * 30 - 15) % 360;
  }

  // Estimar temperatura del mar
  estimateSeaTemperature(airTemperature) {
    // La temperatura del mar suele ser más estable que la del aire
    return airTemperature + (Math.random() * 4 - 2);
  }

  // Datos simulados como fallback
  getMockWeatherData() {
    return {
      temperature: 20 + Math.random() * 10,
      feelsLike: 20 + Math.random() * 10,
      humidity: 60 + Math.random() * 30,
      pressure: 1013 + Math.random() * 20,
      windSpeed: 5 + Math.random() * 15,
      windDirection: Math.random() * 360,
      visibility: 5 + Math.random() * 10,
      description: 'Parcialmente nublado',
      icon: '02d',
      timestamp: new Date().toISOString()
    };
  }

  getMockForecastData() {
    const forecasts = [];
    for (let i = 0; i < 24; i++) {
      forecasts.push({
        timestamp: new Date(Date.now() + i * 3600000).toISOString(),
        temperature: 20 + Math.random() * 10,
        humidity: 60 + Math.random() * 30,
        pressure: 1013 + Math.random() * 20,
        windSpeed: 5 + Math.random() * 15,
        windDirection: Math.random() * 360,
        description: 'Parcialmente nublado',
        icon: '02d'
      });
    }
    return { forecasts, city: 'Ubicación', country: 'AR' };
  }

  getMockMarineData() {
    return {
      ...this.getMockWeatherData(),
      waveHeight: 0.5 + Math.random() * 2,
      currentSpeed: 1 + Math.random() * 2,
      currentDirection: Math.random() * 360,
      seaTemperature: 18 + Math.random() * 8
    };
  }

  // Sistema de caché simple
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Limpiar caché
  clearCache() {
    this.cache.clear();
  }
}

export default new WeatherService(); 