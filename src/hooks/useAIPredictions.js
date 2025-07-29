import { useState, useEffect, useCallback } from 'react';
import AIService from '../services/AIService';

export const useAIPredictions = () => {
  const [predictions, setPredictions] = useState({
    eta: null,
    anomalies: false,
    weather: null,
    systemState: { state: 0, stateName: 'Normal' }
  });
  
  const [isAILoading, setIsAILoading] = useState(true);
  const [aiError, setAiError] = useState(null);

  // Inicializar servicios de IA
  useEffect(() => {
    const initializeAI = async () => {
      try {
        setIsAILoading(true);
        await AIService.initialize();
        setIsAILoading(false);
      } catch (error) {
        console.error('Error inicializando IA:', error);
        setAiError(error.message);
        setIsAILoading(false);
      }
    };

    initializeAI();
  }, []);

  // Función para generar datos simulados de telemetría
  const generateMockTelemetryData = useCallback(() => {
    return [
      Math.random() * 30 + 10, // velocidad (10-40 nudos)
      Math.random() * 360, // rumbo (0-360 grados)
      Math.random() * 0.1 + 0.9, // latitud (simulada)
      Math.random() * 0.1 + 0.9, // longitud (simulada)
      Math.random() * 20 + 60, // temperatura motor (60-80°C)
      Math.random() * 20 + 80, // nivel combustible (80-100%)
      Math.random() * 5 + 45, // presión aceite (45-50 PSI)
      Math.random() * 1000 + 2000, // RPM (2000-3000)
      Math.random() * 2 + 12, // voltaje (12-14V)
      Math.random() * 5 + 10 // corriente (10-15A)
    ];
  }, []);

  // Función para generar datos simulados del sistema
  const generateMockSystemData = useCallback(() => {
    return [
      Math.random() * 20 + 60, // temp_motor
      Math.random() * 10 + 15, // temp_agua
      Math.random() * 5 + 45, // presión_aceite
      Math.random() * 20 + 80, // nivel_combustible
      Math.random() * 1000 + 2000, // rpm
      Math.random() * 2 + 12, // voltaje
      Math.random() * 5 + 10, // corriente
      Math.random() * 30 + 10, // velocidad
      Math.random() * 360, // rumbo
      Math.random() * 100 + 50, // presión_aire
      Math.random() * 20 + 60, // humedad
      Math.random() * 10 + 20, // temperatura_ambiente
      Math.random() * 5 + 95, // nivel_aceite
      Math.random() * 10 + 90, // nivel_refrigerante
      Math.random() * 5 + 95 // nivel_transmisión
    ];
  }, []);

  // Función para generar datos meteorológicos históricos simulados
  const generateMockWeatherData = useCallback(() => {
    const historicalData = [];
    for (let i = 0; i < 24; i++) {
      historicalData.push([
        Math.random() * 20 + 10, // temperatura
        Math.random() * 20 + 1000, // presión
        Math.random() * 40 + 40, // humedad
        Math.random() * 30 + 5 // velocidad_viento
      ]);
    }
    return historicalData;
  }, []);

  // Función para actualizar predicciones
  const updatePredictions = useCallback(async (currentPos, waypoints, progressIdx) => {
    if (!AIService.isInitialized) {
      console.warn('AIService no está inicializado');
      return;
    }

    try {
      // Datos para predicción ETA
      const currentData = [
        currentPos.lat,
        currentPos.lon,
        Math.random() * 30 + 10, // velocidad simulada
        Math.random() * 360, // dirección viento
        Math.random() * 20 + 5, // velocidad viento
        Math.random() * 360, // dirección corriente
        Math.random() * 5 + 1, // velocidad corriente
        waypoints.length > progressIdx + 1 ? 
          Math.sqrt(
            Math.pow(waypoints[progressIdx + 1].lat - currentPos.lat, 2) +
            Math.pow(waypoints[progressIdx + 1].lon - currentPos.lon, 2)
          ) * 111000 : 0 // distancia en metros
      ];

      // Datos simulados para las otras predicciones
      const telemetryData = generateMockTelemetryData();
      const systemData = generateMockSystemData();
      const weatherData = generateMockWeatherData();

      const newPredictions = await AIService.getAllPredictions(
        currentData,
        telemetryData,
        weatherData,
        systemData
      );

      if (newPredictions) {
        setPredictions(newPredictions);
      }
    } catch (error) {
      console.error('Error actualizando predicciones:', error);
    }
  }, [generateMockTelemetryData, generateMockSystemData, generateMockWeatherData]);

  return {
    predictions,
    isAILoading,
    aiError,
    updatePredictions,
    generateMockTelemetryData,
    generateMockSystemData,
    generateMockWeatherData
  };
}; 