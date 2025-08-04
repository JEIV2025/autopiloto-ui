/**
 * Servicio especializado para normalización de datos marítimos
 * Implementa diferentes estrategias según el tipo de dato
 */
class DataNormalizer {
  constructor() {
    // Rangos típicos para datos marítimos
    this.maritimeRanges = {
      // Velocidades (nudos)
      velocidad: { min: 0, max: 50, unit: 'nudos' },
      velocidad_viento: { min: 0, max: 100, unit: 'km/h' },
      velocidad_corriente: { min: 0, max: 10, unit: 'nudos' },
      
      // Distancias (millas náuticas)
      distancia: { min: 0, max: 1000, unit: 'nm' },
      profundidad: { min: 0, max: 5000, unit: 'metros' },
      
      // Condiciones marítimas
      oleaje_altura: { min: 0, max: 20, unit: 'metros' },
      oleaje_periodo: { min: 2, max: 20, unit: 'segundos' },
      temperatura_agua: { min: -2, max: 35, unit: '°C' },
      temperatura_aire: { min: -20, max: 50, unit: '°C' },
      
      // Presión y humedad
      presion: { min: 900, max: 1100, unit: 'hPa' },
      humedad: { min: 0, max: 100, unit: '%' },
      
      // Visibilidad
      visibilidad: { min: 0, max: 50, unit: 'km' },
      
      // Consumo de combustible
      consumo_combustible: { min: 0, max: 200, unit: 'l/h' },
      
      // Tiempo
      eta: { min: 0.1, max: 72, unit: 'horas' },
      
      // Estados del sistema (0-1)
      estado_sistema: { min: 0, max: 1, unit: 'normalizado' },
      anomalias: { min: 0, max: 1, unit: 'normalizado' }
    };

    // Histórico de datos para normalización adaptativa
    this.dataHistory = {};
    this.adaptiveStats = {};
  }

  /**
   * Normalización Min-Max (0-1) para datos con rangos conocidos
   */
  minMaxNormalize(value, featureName) {
    const range = this.maritimeRanges[featureName];
    if (!range) {
      console.warn(`Rango no definido para ${featureName}, usando Z-Score`);
      return this.zScoreNormalize(value, featureName);
    }

    const normalized = (value - range.min) / (range.max - range.min);
    return Math.max(0, Math.min(1, normalized)); // Clamp entre 0-1
  }

  /**
   * Normalización Z-Score para datos sin rangos predefinidos
   */
  zScoreNormalize(value, featureName) {
    if (!this.adaptiveStats[featureName]) {
      this.adaptiveStats[featureName] = { mean: 0, std: 1, count: 0 };
    }

    const stats = this.adaptiveStats[featureName];
    
    // Actualizar estadísticas de forma incremental
    stats.count++;
    const delta = value - stats.mean;
    stats.mean += delta / stats.count;
    const delta2 = value - stats.mean;
    stats.std = Math.sqrt((stats.std * stats.std * (stats.count - 1) + delta * delta2) / stats.count);

    // Evitar división por cero
    const std = stats.std || 1;
    return (value - stats.mean) / std;
  }

  /**
   * Normalización robusta para datos con outliers
   */
  robustNormalize(value, featureName) {
    if (!this.dataHistory[featureName]) {
      this.dataHistory[featureName] = [];
    }

    // Mantener solo los últimos 1000 valores
    this.dataHistory[featureName].push(value);
    if (this.dataHistory[featureName].length > 1000) {
      this.dataHistory[featureName].shift();
    }

    const data = this.dataHistory[featureName];
    const sorted = [...data].sort((a, b) => a - b);
    
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const median = sorted[Math.floor(sorted.length * 0.5)];

    // Evitar división por cero
    if (iqr === 0) return 0;
    
    return (value - median) / iqr;
  }

  /**
   * Normalización logarítmica para datos con distribución exponencial
   */
  logNormalize(value, featureName) {
    const range = this.maritimeRanges[featureName];
    if (!range) return this.zScoreNormalize(value, featureName);

    // Aplicar logaritmo natural con offset para valores negativos
    const offset = Math.abs(range.min) + 1;
    const logValue = Math.log(value + offset);
    const logMin = Math.log(range.min + offset);
    const logMax = Math.log(range.max + offset);

    return (logValue - logMin) / (logMax - logMin);
  }

  /**
   * Normalización especializada para datos marítimos
   */
  maritimeNormalize(value, featureName, method = 'auto') {
    // Detectar método automáticamente basado en el tipo de dato
    if (method === 'auto') {
      method = this.detectNormalizationMethod(featureName);
    }

    switch (method) {
      case 'minmax':
        return this.minMaxNormalize(value, featureName);
      case 'zscore':
        return this.zScoreNormalize(value, featureName);
      case 'robust':
        return this.robustNormalize(value, featureName);
      case 'log':
        return this.logNormalize(value, featureName);
      default:
        return this.minMaxNormalize(value, featureName);
    }
  }

  /**
   * Detectar método de normalización basado en el tipo de dato
   */
  detectNormalizationMethod(featureName) {
    // Datos con rangos bien definidos
    const minMaxFeatures = [
      'velocidad', 'distancia', 'profundidad', 'presion', 'humedad',
      'temperatura_agua', 'temperatura_aire', 'visibilidad'
    ];

    // Datos que pueden tener outliers
    const robustFeatures = [
      'oleaje_altura', 'velocidad_viento', 'consumo_combustible'
    ];

    // Datos con distribución exponencial
    const logFeatures = [
      'eta', 'oleaje_periodo'
    ];

    if (minMaxFeatures.includes(featureName)) return 'minmax';
    if (robustFeatures.includes(featureName)) return 'robust';
    if (logFeatures.includes(featureName)) return 'log';
    
    return 'zscore'; // Método por defecto
  }

  /**
   * Normalizar un conjunto completo de datos marítimos
   */
  normalizeMaritimeDataset(data) {
    const normalized = {};
    const metadata = {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'number' && !isNaN(value)) {
        const method = this.detectNormalizationMethod(key);
        normalized[key] = this.maritimeNormalize(value, key, method);
        metadata[key] = {
          original: value,
          method: method,
          range: this.maritimeRanges[key] || null
        };
      } else {
        normalized[key] = value; // Mantener valores no numéricos
      }
    }

    return { normalized, metadata };
  }

  /**
   * Desnormalizar un valor normalizado
   */
  denormalize(normalizedValue, featureName, method = 'auto') {
    if (method === 'auto') {
      method = this.detectNormalizationMethod(featureName);
    }

    switch (method) {
      case 'minmax':
        return this.denormalizeMinMax(normalizedValue, featureName);
      case 'zscore':
        return this.denormalizeZScore(normalizedValue, featureName);
      case 'robust':
        return this.denormalizeRobust(normalizedValue, featureName);
      case 'log':
        return this.denormalizeLog(normalizedValue, featureName);
      default:
        return normalizedValue;
    }
  }

  denormalizeMinMax(normalizedValue, featureName) {
    const range = this.maritimeRanges[featureName];
    if (!range) return normalizedValue;
    return normalizedValue * (range.max - range.min) + range.min;
  }

  denormalizeZScore(normalizedValue, featureName) {
    const stats = this.adaptiveStats[featureName];
    if (!stats) return normalizedValue;
    return normalizedValue * stats.std + stats.mean;
  }

  denormalizeRobust(normalizedValue, featureName) {
    const data = this.dataHistory[featureName];
    if (!data || data.length === 0) return normalizedValue;
    
    const sorted = [...data].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const median = sorted[Math.floor(sorted.length * 0.5)];
    
    return normalizedValue * iqr + median;
  }

  denormalizeLog(normalizedValue, featureName) {
    const range = this.maritimeRanges[featureName];
    if (!range) return normalizedValue;
    
    const offset = Math.abs(range.min) + 1;
    const logMin = Math.log(range.min + offset);
    const logMax = Math.log(range.max + offset);
    const logValue = normalizedValue * (logMax - logMin) + logMin;
    
    return Math.exp(logValue) - offset;
  }

  /**
   * Obtener estadísticas de normalización
   */
  getNormalizationStats() {
    return {
      adaptiveStats: this.adaptiveStats,
      dataHistorySizes: Object.fromEntries(
        Object.entries(this.dataHistory).map(([key, data]) => [key, data.length])
      ),
      maritimeRanges: this.maritimeRanges
    };
  }

  /**
   * Limpiar historial de datos
   */
  clearHistory() {
    this.dataHistory = {};
    this.adaptiveStats = {};
  }
}

export default new DataNormalizer(); 