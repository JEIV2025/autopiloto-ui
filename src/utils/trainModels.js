import * as tf from '@tensorflow/tfjs';

// Función para generar datos de entrenamiento simulados
const generateTrainingData = (numSamples = 1000) => {
  const etaData = [];
  const anomalyData = [];
  const weatherData = [];
  const systemData = [];

  for (let i = 0; i < numSamples; i++) {
    // Datos para ETA
    const lat = Math.random() * 0.1 - 0.05;
    const lon = Math.random() * 0.1 - 0.05;
    const speed = Math.random() * 30 + 10;
    const windDir = Math.random() * 360;
    const windSpeed = Math.random() * 20 + 5;
    const currentDir = Math.random() * 360;
    const currentSpeed = Math.random() * 5 + 1;
    const distance = Math.random() * 50000 + 1000;
    
    // ETA real (simulada basada en distancia y velocidad)
    const eta = (distance / (speed * 0.514)) / 60; // Convertir a minutos
    
    etaData.push({
      input: [lat, lon, speed, windDir, windSpeed, currentDir, currentSpeed, distance],
      output: [eta]
    });

    // Datos para anomalías
    const telemetry = [
      Math.random() * 30 + 10, // velocidad
      Math.random() * 360, // rumbo
      Math.random() * 0.1 + 0.9, // lat
      Math.random() * 0.1 + 0.9, // lon
      Math.random() * 20 + 60, // temp motor
      Math.random() * 20 + 80, // nivel combustible
      Math.random() * 5 + 45, // presión aceite
      Math.random() * 1000 + 2000, // RPM
      Math.random() * 2 + 12, // voltaje
      Math.random() * 5 + 10 // corriente
    ];

    // Simular anomalías (5% de probabilidad)
    const hasAnomaly = Math.random() < 0.05;
    if (hasAnomaly) {
      telemetry[Math.floor(Math.random() * telemetry.length)] *= 2; // Valor anómalo
    }

    anomalyData.push({
      input: telemetry,
      output: telemetry // Autoencoder intenta reconstruir
    });

    // Datos para sistema
    const system = [
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

    // Clasificar estado del sistema
    let state = 0; // Normal por defecto
    if (system[0] > 85 || system[2] < 40) state = 2; // Crítico
    else if (system[0] > 75 || system[2] < 45) state = 1; // Warning

    systemData.push({
      input: system,
      output: [state === 0 ? 1 : 0, state === 1 ? 1 : 0, state === 2 ? 1 : 0]
    });
  }

  return { etaData, anomalyData, systemData };
};

// Función para entrenar modelo ETA
export const trainETAModel = async () => {
  console.log('Entrenando modelo ETA...');
  
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ units: 64, activation: 'relu', inputShape: [8] }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({ units: 32, activation: 'relu' }),
      tf.layers.dense({ units: 1, activation: 'linear' })
    ]
  });

  model.compile({
    optimizer: 'adam',
    loss: 'meanSquaredError',
    metrics: ['accuracy']
  });

  const { etaData } = generateTrainingData(500);
  
  const inputs = tf.tensor2d(etaData.map(d => d.input));
  const outputs = tf.tensor2d(etaData.map(d => d.output));

  await model.fit(inputs, outputs, {
    epochs: 50,
    batchSize: 32,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}`);
      }
    }
  });

  console.log('Modelo ETA entrenado exitosamente');
  return model;
};

// Función para entrenar clasificador de sistema
export const trainSystemClassifier = async () => {
  console.log('Entrenando clasificador de sistema...');
  
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ units: 128, activation: 'relu', inputShape: [15] }),
      tf.layers.dropout({ rate: 0.3 }),
      tf.layers.dense({ units: 64, activation: 'relu' }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({ units: 32, activation: 'relu' }),
      tf.layers.dense({ units: 3, activation: 'softmax' })
    ]
  });

  model.compile({
    optimizer: 'adam',
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  const { systemData } = generateTrainingData(1000);
  
  const inputs = tf.tensor2d(systemData.map(d => d.input));
  const outputs = tf.tensor2d(systemData.map(d => d.output));

  await model.fit(inputs, outputs, {
    epochs: 30,
    batchSize: 32,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.accuracy.toFixed(4)}`);
      }
    }
  });

  console.log('Clasificador de sistema entrenado exitosamente');
  return model;
};

// Función para guardar modelos
export const saveModel = async (model, name) => {
  try {
    await model.save(`localstorage://${name}`);
    console.log(`Modelo ${name} guardado exitosamente`);
  } catch (error) {
    console.error(`Error guardando modelo ${name}:`, error);
  }
};

// Función para cargar modelos
export const loadModel = async (name) => {
  try {
    const model = await tf.loadLayersModel(`localstorage://${name}`);
    console.log(`Modelo ${name} cargado exitosamente`);
    return model;
  } catch (error) {
    console.error(`Error cargando modelo ${name}:`, error);
    return null;
  }
}; 