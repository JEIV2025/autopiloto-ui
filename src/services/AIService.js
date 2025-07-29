import * as tf from '@tensorflow/tfjs';

// PREDICTOR DE ETA (Tiempo de Llegada)
class ETAPredictor {
  constructor() {
    this.model = null;
    this.isInitialized = false;
  }

  async initialize() {
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ units: 64, activation: 'relu', inputShape: [8] }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'linear' })
      ]
    });

    this.model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError',
      metrics: ['accuracy']
    });

    this.isInitialized = true;
  }

  predict(inputData) {
    if (!this.isInitialized) {
      console.warn('ETAPredictor no está inicializado');
      return null;
    }

    try {
      const prediction = this.model.predict(tf.tensor2d([inputData]));
      return prediction.dataSync()[0];
    } catch (error) {
      console.error('Error en predicción ETA:', error);
      return null;
    }
  }
}

//DETECTOR DE ANOMALÍAS (Autoencoder)
class AnomalyDetector {
  constructor() {
    this.encoder = null;
    this.decoder = null;
    this.threshold = 0.1; // Umbral para detectar anomalías
    this.isInitialized = false;
  }

  async initialize() {
    // Encoder
    this.encoder = tf.sequential({
      layers: [
        tf.layers.dense({ units: 32, activation: 'relu', inputShape: [10] }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 8, activation: 'relu' })
      ]
    });

    // Decoder
    this.decoder = tf.sequential({
      layers: [
        tf.layers.dense({ units: 16, activation: 'relu', inputShape: [8] }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 10, activation: 'linear' })
      ]
    });

    this.encoder.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
    this.decoder.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

    this.isInitialized = true;
  }

  detectAnomaly(telemetryData) {
    if (!this.isInitialized) {
      console.warn('AnomalyDetector no está inicializado');
      return false;
    }

    try {
      const inputTensor = tf.tensor2d([telemetryData]);
      const encoded = this.encoder.predict(inputTensor);
      const decoded = this.decoder.predict(encoded);
      
      const reconstructionError = tf.mean(tf.square(
        tf.sub(inputTensor, decoded)
      ));
      
      const error = reconstructionError.dataSync()[0];
      return error > this.threshold;
    } catch (error) {
      console.error('Error en detección de anomalías:', error);
      return false;
    }
  }
}

// PREDICTOR METEOROLÓGICO (CNN + LSTM)
class WeatherPredictor {
  constructor() {
    this.model = null;
    this.isInitialized = false;
  }

  async initialize() {
    this.model = tf.sequential({
      layers: [
        // CNN para patrones espaciales
        tf.layers.conv1d({ 
          filters: 32, 
          kernelSize: 3, 
          activation: 'relu', 
          inputShape: [24, 4] 
        }),
        tf.layers.maxPooling1d({ poolSize: 2 }),
        tf.layers.conv1d({ filters: 64, kernelSize: 3, activation: 'relu' }),
        tf.layers.maxPooling1d({ poolSize: 2 }),
        
        // LSTM para patrones temporales
        tf.layers.lstm({ units: 50, returnSequences: true }),
        tf.layers.lstm({ units: 25, returnSequences: false }),
        
        // Salida
        tf.layers.dense({ units: 12, activation: 'linear' })
      ]
    });

    this.model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError',
      metrics: ['accuracy']
    });

    this.isInitialized = true;
  }

  predictWeather(historicalData) {
    if (!this.isInitialized) {
      console.warn('WeatherPredictor no está inicializado');
      return null;
    }

    try {
      const prediction = this.model.predict(tf.tensor3d([historicalData]));
      return prediction.dataSync();
    } catch (error) {
      console.error('Error en predicción meteorológica:', error);
      return null;
    }
  }
}

// CLASIFICADOR DE ESTADOS DEL SISTEMA
class SystemStateClassifier {
  constructor() {
    this.model = null;
    this.isInitialized = false;
  }

  async initialize() {
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ units: 128, activation: 'relu', inputShape: [15] }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 3, activation: 'softmax' })
      ]
    });

    this.model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    this.isInitialized = true;
  }

  classifyState(systemData) {
    if (!this.isInitialized) {
      console.warn('SystemStateClassifier no está inicializado');
      return 0; // Normal por defecto
    }

    try {
      const prediction = this.model.predict(tf.tensor2d([systemData]));
      const stateIndex = prediction.argMax(1).dataSync()[0];
      return stateIndex; // 0: Normal, 1: Warning, 2: Critical
    } catch (error) {
      console.error('Error en clasificación de estado:', error);
      return 0;
    }
  }

  getStateName(stateIndex) {
    const states = ['Normal', 'Warning', 'Critical'];
    return states[stateIndex] || 'Unknown';
  }
}

// SERVICIO PRINCIPAL DE IA
class AIService {
  constructor() {
    this.etaPredictor = new ETAPredictor();
    this.anomalyDetector = new AnomalyDetector();
    this.weatherPredictor = new WeatherPredictor();
    this.stateClassifier = new SystemStateClassifier();
    this.isInitialized = false;
  }

  async initialize() {
    console.log('Inicializando servicios de IA...');
    
    try {
      await Promise.all([
        this.etaPredictor.initialize(),
        this.anomalyDetector.initialize(),
        this.weatherPredictor.initialize(),
        this.stateClassifier.initialize()
      ]);

      this.isInitialized = true;
      console.log('Servicios de IA inicializados correctamente');
    } catch (error) {
      console.error('Error inicializando servicios de IA:', error);
    }
  }

  // Métodos para usar las predicciones
  predictETA(currentData) {
    return this.etaPredictor.predict(currentData);
  }

  detectAnomalies(telemetryData) {
    return this.anomalyDetector.detectAnomaly(telemetryData);
  }

  predictWeather(historicalData) {
    return this.weatherPredictor.predictWeather(historicalData);
  }

  classifySystemState(systemData) {
    const stateIndex = this.stateClassifier.classifyState(systemData);
    return {
      state: stateIndex,
      stateName: this.stateClassifier.getStateName(stateIndex)
    };
  }

  // Método para obtener todas las predicciones de una vez
  async getAllPredictions(currentData, telemetryData, historicalWeatherData, systemData) {
    if (!this.isInitialized) {
      console.warn('AIService no está inicializado');
      return null;
    }

    return {
      eta: this.predictETA(currentData),
      anomalies: this.detectAnomalies(telemetryData),
      weather: this.predictWeather(historicalWeatherData),
      systemState: this.classifySystemState(systemData)
    };
  }
}

const aiService = new AIService();
export default aiService; 