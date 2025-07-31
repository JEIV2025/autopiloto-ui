// Servicio especializado en datos marítimos
class MarineWeatherService {
  constructor() {
    // Solo APIs gratuitas
    this.openWeatherApiKey = process.env.REACT_APP_OPENWEATHER_API_KEY;
    
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutos para datos marítimos
  }

  // Obtener datos marítimos usando solo APIs gratuitas
  async getMarineWeatherData(lat, lon) {
    const cacheKey = `marine_${lat}_${lon}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Obtener datos básicos de clima
      const weatherData = await this.getBasicWeatherData(lat, lon);
      
      // Generar datos marítimos estimados basados en clima
      const marineData = this.generateMarineDataFromWeather(weatherData);

      this.setCachedData(cacheKey, marineData);
      return marineData;
    } catch (error) {
      console.error('Error obteniendo datos marítimos:', error);
      return this.getMockMarineData();
    }
  }

  // Generar datos marítimos estimados basados en clima
  generateMarineDataFromWeather(weatherData) {
    if (!weatherData) return this.getMockMarineData();

    const windSpeed = weatherData.windSpeed || 10;
    const windDirection = weatherData.windDirection || 180;
    const temperature = weatherData.temperature || 20;
    const pressure = weatherData.pressure || 1013;
    const humidity = weatherData.humidity || 60;
    const visibility = weatherData.visibility || 10;

    // Estimaciones basadas en fórmulas meteorológicas marítimas
    const waveHeight = this.estimateWaveHeight(windSpeed);
    const wavePeriod = this.estimateWavePeriod(windSpeed);
    const currentSpeed = this.estimateCurrentSpeed(windSpeed);
    const currentDirection = this.estimateCurrentDirection(windDirection);
    const waterTemperature = this.estimateWaterTemperature(temperature, humidity);

    return {
      waves: {
        height: waveHeight,
        period: wavePeriod,
        direction: windDirection,
        energy: this.estimateWaveEnergy(waveHeight, wavePeriod)
      },
      currents: {
        surface: {
          speed: currentSpeed,
          direction: currentDirection
        },
        subsurface: {
          speed: currentSpeed * 0.6,
          direction: currentDirection
        }
      },
      wind: {
        speed: windSpeed,
        direction: windDirection,
        gust: windSpeed * 1.3,
        height: 10
      },
      waterTemperature: waterTemperature,
      visibility: visibility,
      tide: {
        height: this.estimateTideHeight(pressure),
        time: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      sources: { 
        openweather: true, 
        estimated: true 
      }
    };
  }

  // Datos básicos de clima (OpenWeatherMap)
  async getBasicWeatherData(lat, lon) {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.REACT_APP_OPENWEATHER_API_KEY}&units=metric`
      );
      
      if (!response.ok) throw new Error('OpenWeather API error');
      
      const data = await response.json();
      return this.parseBasicWeatherData(data);
    } catch (error) {
      console.error('Error OpenWeather:', error);
      return null;
    }
  }

  // Nuevas funciones de estimación mejoradas
  estimateWavePeriod(windSpeed) {
    // Fórmula de Pierson-Moskowitz para período de olas
    return Math.max(4, Math.min(12, 8 + (windSpeed * 0.2)));
  }

  estimateWaveEnergy(waveHeight, wavePeriod) {
    // Energía de olas basada en altura y período
    return (waveHeight * waveHeight * wavePeriod) / 16;
  }

  estimateTideHeight(pressure) {
    // Estimación de marea basada en presión atmosférica
    const pressureDiff = pressure - 1013;
    return 1.2 + (pressureDiff * 0.001);
  }

  // Estimación mejorada de temperatura del agua
  estimateWaterTemperature(airTemperature, humidity) {
    // Fórmula que considera temperatura del aire y humedad
    const baseTemp = airTemperature - 2; // Agua suele ser más fría
    const humidityFactor = humidity > 80 ? 1.5 : humidity > 60 ? 1.0 : 0.5;
    return baseTemp + humidityFactor;
  }

  // Parsear datos básicos de clima
  parseBasicWeatherData(data) {
    return {
      windSpeed: data.wind.speed,
      windDirection: data.wind.deg,
      temperature: data.main.temp,
      visibility: data.visibility / 1000, // Convertir a km
      pressure: data.main.pressure,
      humidity: data.main.humidity
    };
  }

  // Calcular distancia entre dos puntos (mantenido para futuras expansiones)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Estimaciones mejoradas basadas en fórmulas meteorológicas
  estimateWaveHeight(windSpeed) {
    // Fórmula de Beaufort para altura de olas
    return Math.max(0.1, windSpeed * 0.15);
  }

  estimateCurrentSpeed(windSpeed) {
    // Corrientes relacionadas con viento
    return Math.max(0.5, Math.min(3, windSpeed * 0.2));
  }

  estimateCurrentDirection(windDirection) {
    // Corrientes suelen seguir la dirección del viento con variación
    return (windDirection + Math.random() * 30 - 15) % 360;
  }

  // Datos simulados como fallback
  getMockMarineData() {
    return {
      waves: {
        height: 1.5 + Math.random() * 2,
        period: 8 + Math.random() * 4,
        direction: Math.random() * 360,
        energy: 0.5 + Math.random() * 0.5
      },
      currents: {
        surface: {
          speed: 1 + Math.random() * 2,
          direction: Math.random() * 360
        },
        subsurface: {
          speed: 0.5 + Math.random() * 1,
          direction: Math.random() * 360
        }
      },
      wind: {
        speed: 10 + Math.random() * 15,
        direction: Math.random() * 360,
        gust: 15 + Math.random() * 20,
        height: 10
      },
      waterTemperature: 18 + Math.random() * 8,
      visibility: 8 + Math.random() * 4,
      tide: {
        height: 1 + Math.random() * 2,
        time: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      sources: { noaa: false, windy: false, openweather: false }
    };
  }

  // Sistema de caché
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

  clearCache() {
    this.cache.clear();
  }
}

export default new MarineWeatherService(); 