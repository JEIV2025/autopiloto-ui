import { useState, useEffect, useCallback } from 'react';
import UnifiedAIService from '../services/UnifiedAIService';

export const useUnifiedAI = () => {
  const [predictions, setPredictions] = useState({
    eta: {
      neural: null,
      linear: null,
      average: null
    },
    anomalies: false,
    weather: null,
    fuelConsumption: null
  });
  
  const [isAILoading, setIsAILoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [aiError, setAiError] = useState(null);
  const [modelMetrics, setModelMetrics] = useState(null);

  // Inicializar servicios de IA
  useEffect(() => {
    const initializeAI = async () => {
      try {
        setIsAILoading(true);
        await UnifiedAIService.initialize();
        
        // Entrenar modelos automáticamente
        await trainAllModels();
        
        setIsAILoading(false);
      } catch (error) {
        console.error('Error inicializando IA:', error);
        setAiError(error.message);
        setIsAILoading(false);
      }
    };

    initializeAI();
  }, []);

  // Entrenar todos los modelos
  const trainAllModels = async () => {
    setIsTraining(true);
    setTrainingProgress(0);

    try {
      await UnifiedAIService.trainAllModels();
      setTrainingProgress(100);
      setIsTraining(false);
    } catch (error) {
      console.error('Error entrenando modelos:', error);
      setIsTraining(false);
    }
  };

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
    if (!UnifiedAIService.isInitialized) {
      console.warn('UnifiedAIService no está inicializado');
      return;
    }

    try {
      // Datos para predicción ETA
      const currentData = {
        lat: currentPos.lat,
        lon: currentPos.lon,
        velocidad: Math.random() * 30 + 10, // velocidad simulada
        viento_direccion: Math.random() * 360, // dirección viento
        viento_velocidad: Math.random() * 20 + 5, // velocidad viento
        corriente_direccion: Math.random() * 360, // dirección corriente
        corriente_velocidad: Math.random() * 5 + 1, // velocidad corriente
        distancia: waypoints.length > progressIdx + 1 ? 
          Math.sqrt(
            Math.pow(waypoints[progressIdx + 1].lat - currentPos.lat, 2) +
            Math.pow(waypoints[progressIdx + 1].lon - currentPos.lon, 2)
          ) * 111000 : 0, // distancia en metros
        peso_carga: Math.random() * 50 + 10,
        condiciones_mar: Math.random() * 5 + 1,
        temperatura_motor: Math.random() * 20 + 60
      };

      // Datos simulados para las otras predicciones
      const telemetryData = generateMockTelemetryData();
      const systemData = generateMockSystemData();
      const weatherData = generateMockWeatherData();

      const newPredictions = await UnifiedAIService.getAllPredictions(
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

  // Función para hacer predicción específica de ETA
  const predictETA = useCallback(async (currentData, method = 'both') => {
    if (!UnifiedAIService.isInitialized) {
      console.warn('UnifiedAIService no está inicializado');
      return null;
    }

    try {
      const etaPredictions = UnifiedAIService.predictETA(currentData, method);
      return etaPredictions;
    } catch (error) {
      console.error('Error en predicción ETA:', error);
      return null;
    }
  }, []);

  // Función para hacer predicción de consumo de combustible
  const predictFuelConsumption = useCallback(async (currentData) => {
    if (!UnifiedAIService.isInitialized) {
      console.warn('UnifiedAIService no está inicializado');
      return null;
    }

    try {
      const fuelPrediction = UnifiedAIService.predictFuelConsumption(currentData);
      return fuelPrediction;
    } catch (error) {
      console.error('Error en predicción de consumo:', error);
      return null;
    }
  }, []);

  // Función para detectar anomalías
  const detectAnomalies = useCallback(async (telemetryData) => {
    if (!UnifiedAIService.isInitialized) {
      console.warn('UnifiedAIService no está inicializado');
      return false;
    }

    try {
      const hasAnomalies = UnifiedAIService.detectAnomalies(telemetryData);
      return hasAnomalies;
    } catch (error) {
      console.error('Error en detección de anomalías:', error);
      return false;
    }
  }, []);

  return {
    predictions,
    isAILoading,
    isTraining,
    trainingProgress,
    aiError,
    modelMetrics,
    updatePredictions,
    predictETA,
    predictFuelConsumption,
    detectAnomalies,
    trainAllModels,
    generateMockTelemetryData,
    generateMockSystemData,
    generateMockWeatherData
  };
}; 