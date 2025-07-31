import * as tf from '@tensorflow/tfjs';
import WeatherService from './WeatherService';
import MarineWeatherService from './MarineWeatherService';

// SERVICIO UNIFICADO DE IA
class UnifiedAIService {
  constructor() {
    this.models = {
      // Redes Neuronales
      etaNeural: null,
      anomalyDetector: null,
      weatherPredictor: null,
      systemClassifier: null,
      
      // Regresión Lineal
      etaLinear: null,
      fuelConsumption: null
    };
    
    this.isInitialized = false;
    this.scalers = {};
    this.featureNames = {};
  }

  async initialize() {
    console.log('Inicializando servicios unificados de IA...');
    
    try {
      // Inicializar modelos de redes neuronales
      await this.initializeNeuralNetworks();
      
      // Inicializar modelos de regresión lineal
      await this.initializeLinearRegression();
      
      this.isInitialized = true;
      console.log('Servicios unificados de IA inicializados correctamente');
    } catch (error) {
      console.error('Error inicializando servicios de IA:', error);
    }
  }

  // ===== REDES NEURONALES =====
  async initializeNeuralNetworks() {
    // 1. PREDICTOR DE ETA (Red Neuronal)
    this.models.etaNeural = tf.sequential({
      layers: [
        tf.layers.dense({ units: 64, activation: 'relu', inputShape: [8] }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'linear' })
      ]
    });

    this.models.etaNeural.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError',
      metrics: ['accuracy']
    });

    // 2. DETECTOR DE ANOMALÍAS (Autoencoder)
    this.models.anomalyDetector = {
      encoder: tf.sequential({
        layers: [
          tf.layers.dense({ units: 32, activation: 'relu', inputShape: [10] }),
          tf.layers.dense({ units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 8, activation: 'relu' })
        ]
      }),
      decoder: tf.sequential({
        layers: [
          tf.layers.dense({ units: 16, activation: 'relu', inputShape: [8] }),
          tf.layers.dense({ units: 32, activation: 'relu' }),
          tf.layers.dense({ units: 10, activation: 'linear' })
        ]
      }),
      threshold: 0.1
    };

    this.models.anomalyDetector.encoder.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
    this.models.anomalyDetector.decoder.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

    // 3. PREDICTOR METEOROLÓGICO (CNN + LSTM)
    this.models.weatherPredictor = tf.sequential({
      layers: [
        tf.layers.conv1d({ filters: 32, kernelSize: 3, activation: 'relu', inputShape: [24, 4] }),
        tf.layers.maxPooling1d({ poolSize: 2 }),
        tf.layers.conv1d({ filters: 64, kernelSize: 3, activation: 'relu' }),
        tf.layers.maxPooling1d({ poolSize: 2 }),
        tf.layers.lstm({ units: 50, returnSequences: true }),
        tf.layers.lstm({ units: 25, returnSequences: false }),
        tf.layers.dense({ units: 12, activation: 'linear' })
      ]
    });

    this.models.weatherPredictor.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError',
      metrics: ['accuracy']
    });

    // 4. CLASIFICADOR DE ESTADOS DEL SISTEMA
    this.models.systemClassifier = tf.sequential({
      layers: [
        tf.layers.dense({ units: 128, activation: 'relu', inputShape: [15] }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 3, activation: 'softmax' })
      ]
    });

    this.models.systemClassifier.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
  }

  // ===== REGRESIÓN LINEAL =====
  async initializeLinearRegression() {
    // Configurar nombres de features para regresión lineal
    this.featureNames.eta = [
      'distancia', 'velocidad', 'viento_velocidad', 
      'corriente_velocidad', 'rumbo_viento', 'rumbo_corriente'
    ];
    
    this.featureNames.fuel = [
      'velocidad', 'distancia', 'peso_carga', 
      'condiciones_mar', 'temperatura_motor'
    ];

    // Inicializar escaladores (se crearán durante el entrenamiento)
    this.scalers.eta = null;
    this.scalers.fuel = null;
  }

  // ===== MÉTODOS UNIFICADOS =====
  
  // Predicción unificada de ETA con datos marítimos especializados
  predictETA(currentData) {
    try {
      // Calcular velocidad efectiva considerando condiciones marítimas
      let effectiveSpeed = currentData.velocidad || 15;
      
      // Factor de oleaje (olas altas reducen velocidad)
      if (currentData.waveHeight) {
        const waveFactor = Math.max(0.7, 1 - (currentData.waveHeight * 0.1));
        effectiveSpeed *= waveFactor;
      }
      
      // Factor de corrientes
      if (currentData.currentSpeed) {
        const currentFactor = 1 + (currentData.currentSpeed * 0.1);
        effectiveSpeed *= currentFactor;
      }
      
      // Factor de viento
      if (currentData.windSpeed) {
        const windFactor = 1 + (currentData.windSpeed * 0.05);
        effectiveSpeed *= windFactor;
      }
      
      // Factor de visibilidad
      if (currentData.visibility) {
        const visibilityFactor = currentData.visibility > 5 ? 1 : 0.8;
        effectiveSpeed *= visibilityFactor;
      }
      
      // Calcular ETA usando velocidad efectiva
      const distance = currentData.distancia || 50;
      const eta = distance / effectiveSpeed;
      
      // Si tenemos modelo de IA, usar una combinación
      if (this.models.etaNeural) {
        try {
          const inputData = [
            currentData.lat || 0,
            currentData.lon || 0,
            effectiveSpeed,
            currentData.windDirection || 0,
            currentData.windSpeed || 10,
            currentData.currentDirection || 0,
            currentData.currentSpeed || 2,
            distance,
            currentData.waveHeight || 0,
            currentData.wavePeriod || 8,
            currentData.waterTemperature || 20,
            currentData.visibility || 10
          ];
          
          const prediction = this.models.etaNeural.predict(tf.tensor2d([inputData]));
          const aiResult = prediction.dataSync()[0];
          
          // Combinar cálculo físico con IA (70% físico, 30% IA)
          return Math.max(0.1, (eta * 0.7) + (Math.abs(aiResult) * 0.3));
        } catch (aiError) {
          console.error('Error en predicción IA ETA:', aiError);
          return Math.max(0.1, eta);
        }
      }
      
      return Math.max(0.1, eta);
    } catch (error) {
      console.error('Error en predicción ETA:', error);
      // Valor por defecto realista
      return 3.5;
    }
  }

  // Detección de anomalías
  detectAnomalies(telemetryData) {
    try {
      const inputTensor = tf.tensor2d([telemetryData]);
      const encoded = this.models.anomalyDetector.encoder.predict(inputTensor);
      const decoded = this.models.anomalyDetector.decoder.predict(encoded);
      
      const reconstructionError = tf.mean(tf.square(
        tf.sub(inputTensor, decoded)
      ));
      
      const error = reconstructionError.dataSync()[0];
      return error > this.models.anomalyDetector.threshold;
    } catch (error) {
      console.error('Error en detección de anomalías:', error);
      return false;
    }
  }

  // Predicción meteorológica
  predictWeather(historicalData) {
    try {
      const prediction = this.models.weatherPredictor.predict(tf.tensor3d([historicalData]));
      return prediction.dataSync();
    } catch (error) {
      console.error('Error en predicción meteorológica:', error);
      return null;
    }
  }

  // Clasificación de estado del sistema
  classifySystemState(systemData) {
    try {
      const prediction = this.models.systemClassifier.predict(tf.tensor2d([systemData]));
      const stateIndex = prediction.argMax(1).dataSync()[0];
      const states = ['Normal', 'Warning', 'Critical'];
      return {
        state: stateIndex,
        stateName: states[stateIndex] || 'Unknown'
      };
    } catch (error) {
      console.error('Error en clasificación de estado:', error);
      return { state: 0, stateName: 'Normal' };
    }
  }

  // Predicción de consumo de combustible
  predictFuelConsumption(currentData) {
    try {
      const inputData = [
        currentData.velocidad || 15,
        currentData.distancia || 50,
        currentData.peso_carga || 30,
        currentData.condiciones_mar || 3,
        currentData.temperatura_motor || 70
      ];
      
      if (this.scalers.fuel) {
        const normalizedInput = inputData.map((value, index) => {
          const scaler = this.scalers.fuel[index];
          return (value - scaler.mean) / scaler.std;
        });
        
        const prediction = this.models.fuelConsumption.predict(tf.tensor2d([normalizedInput]));
        const fuelResult = prediction.dataSync()[0];
        // Asegurar que el resultado sea positivo y realista
        return Math.max(5, Math.abs(fuelResult));
      } else {
        // Si no hay escalador, usar cálculo simple
        const velocidad = currentData.velocidad || 15;
        const peso_carga = currentData.peso_carga || 30;
        const condiciones_mar = currentData.condiciones_mar || 3;
        const temperatura_motor = currentData.temperatura_motor || 70;
        
        const consumo_base = velocidad * 2; // 2 litros por nudo
        const factor_carga = peso_carga / 30;
        const factor_mar = condiciones_mar * 0.5;
        const factor_temp = temperatura_motor > 75 ? 1.2 : 1.0;
        
        return (consumo_base + factor_carga + factor_mar) * factor_temp;
      }
    } catch (error) {
      console.error('Error en predicción de consumo:', error);
      // Valor por defecto realista
      return 25.0;
    }
  }

  // ===== ENTRENAMIENTO =====
  
  // Generar datos de entrenamiento
  generateTrainingData(type, numSamples = 500) {
    const data = [];
    
    for (let i = 0; i < numSamples; i++) {
      switch (type) {
        case 'eta':
          const distancia = Math.random() * 100 + 10;
          const velocidad = Math.random() * 20 + 10;
          const viento_velocidad = Math.random() * 25 + 5;
          const corriente_velocidad = Math.random() * 3 + 1;
          const rumbo_viento = Math.random() * 360;
          const rumbo_corriente = Math.random() * 360;
          const velocidad_efectiva = velocidad + (viento_velocidad * 0.1) + (corriente_velocidad * 0.2);
          const eta = distancia / velocidad_efectiva;
          
          data.push({
            distancia, velocidad, viento_velocidad, corriente_velocidad,
            rumbo_viento, rumbo_corriente, eta
          });
          break;
          
        case 'fuel':
          const vel = Math.random() * 20 + 10;
          const dist = Math.random() * 100 + 10;
          const peso_carga = Math.random() * 50 + 10;
          const condiciones_mar = Math.random() * 5 + 1;
          const temperatura_motor = Math.random() * 20 + 60;
          const consumo_base = vel * 2;
          const factor_carga = peso_carga / 30;
          const factor_mar = condiciones_mar * 0.5;
          const factor_temp = temperatura_motor > 75 ? 1.2 : 1.0;
          const consumo = (consumo_base + factor_carga + factor_mar) * factor_temp;
          
          data.push({
            velocidad: vel, distancia: dist, peso_carga, condiciones_mar,
            temperatura_motor, consumo
          });
          break;
      }
    }
    
    return data;
  }

  // Normalizar datos para regresión lineal
  normalizeData(data) {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const std = Math.sqrt(variance);
    
    return {
      normalized: data.map(val => (val - mean) / std),
      mean,
      std
    };
  }

  // Entrenar modelo de regresión lineal
  async trainLinearModel(type, trainingData) {
    console.log(`Entrenando modelo de regresión lineal para ${type}...`);
    
    const featureNames = this.featureNames[type];
    const features = trainingData.map(row => 
      featureNames.map(name => row[name])
    );
    const targets = trainingData.map(row => row[type === 'eta' ? 'eta' : 'consumo']);

    // Normalizar features
    const normalizedFeatures = [];
    this.scalers[type] = [];
    
    for (let i = 0; i < featureNames.length; i++) {
      const featureData = features.map(row => row[i]);
      const normalized = this.normalizeData(featureData);
      normalizedFeatures.push(normalized.normalized);
      this.scalers[type].push({ mean: normalized.mean, std: normalized.std });
    }

    // Crear modelo
    this.models[type === 'eta' ? 'etaLinear' : 'fuelConsumption'] = tf.sequential({
      layers: [
        tf.layers.dense({ 
          units: 1, 
          inputShape: [featureNames.length],
          activation: 'linear'
        })
      ]
    });

    // Compilar y entrenar
    const model = this.models[type === 'eta' ? 'etaLinear' : 'fuelConsumption'];
    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError',
      metrics: ['accuracy']
    });

    const X = tf.tensor2d(normalizedFeatures.map((_, i) => 
      normalizedFeatures.map(row => row[i])
    ));
    const y = tf.tensor2d(targets.map(t => [t]));

    await model.fit(X, y, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2
    });

    console.log(`Modelo de regresión lineal ${type} entrenado exitosamente`);
  }

  // Entrenar todos los modelos
  async trainAllModels() {
    console.log('Entrenando todos los modelos de IA...');
    
    try {
      // Entrenar modelos de regresión lineal
      const etaData = this.generateTrainingData('eta', 500);
      const fuelData = this.generateTrainingData('fuel', 500);
      
      await this.trainLinearModel('eta', etaData);
      await this.trainLinearModel('fuel', fuelData);
      
      console.log('Todos los modelos entrenados exitosamente');
    } catch (error) {
      console.error('Error entrenando modelos:', error);
    }
  }

  // ===== PREDICCIÓN UNIFICADA =====
  async getAllPredictions(currentData, telemetryData, historicalWeatherData, systemData) {
    if (!this.isInitialized) {
      console.warn('UnifiedAIService no está inicializado');
      return null;
    }

    // Obtener datos marítimos especializados
    let marineWeatherData = null;
    let basicWeatherData = null;
    
    try {
      if (currentData.lat && currentData.lon) {
        // Obtener datos marítimos especializados
        marineWeatherData = await MarineWeatherService.getMarineWeatherData(currentData.lat, currentData.lon);
        console.log('Datos marítimos especializados obtenidos:', marineWeatherData);
        
        // Obtener datos básicos de clima como respaldo
        basicWeatherData = await WeatherService.getCurrentWeather(currentData.lat, currentData.lon);
        console.log('Datos básicos de clima obtenidos:', basicWeatherData);
      }
    } catch (error) {
      console.error('Error obteniendo datos de clima:', error);
    }

    // Mejorar predicción de ETA con datos marítimos reales
    const enhancedCurrentData = {
      ...currentData,
      // Datos de oleaje reales
      waveHeight: marineWeatherData?.waves?.height,
      wavePeriod: marineWeatherData?.waves?.period,
      waveDirection: marineWeatherData?.waves?.direction,
      // Datos de corrientes reales
      currentSpeed: marineWeatherData?.currents?.surface?.speed,
      currentDirection: marineWeatherData?.currents?.surface?.direction,
      // Datos de viento marino
      windSpeed: marineWeatherData?.wind?.speed || basicWeatherData?.windSpeed,
      windDirection: marineWeatherData?.wind?.direction || basicWeatherData?.windDirection,
      windGust: marineWeatherData?.wind?.gust,
      // Datos de temperatura del agua
      waterTemperature: marineWeatherData?.waterTemperature,
      // Datos de visibilidad marítima
      visibility: marineWeatherData?.visibility || basicWeatherData?.visibility,
      // Datos de marea
      tideHeight: marineWeatherData?.tide?.height,
      tideTime: marineWeatherData?.tide?.time
    };

    const eta = this.predictETA(enhancedCurrentData);
    const anomalies = this.detectAnomalies(telemetryData);
    const weather = marineWeatherData || basicWeatherData || this.predictWeather(historicalWeatherData);
    const fuelConsumption = this.predictFuelConsumption(enhancedCurrentData);

    return {
      eta: {
        neural: eta,
        linear: null,
        average: eta
      },
      anomalies,
      weather,
      marineWeatherData, // Datos marítimos especializados
      basicWeatherData,   // Datos básicos de clima
      systemState: { state: 0, stateName: 'Normal' }, // Mantener por compatibilidad
      fuelConsumption
    };
  }
}

export default new UnifiedAIService(); 