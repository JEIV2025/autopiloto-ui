# 🌊 Configuración de APIs para Datos Marítimos

## APIs Disponibles (Solo Gratuitas)

### 1. OpenWeatherMap API (Gratuita)
- **Propósito**: Datos básicos de clima
- **Límites**: 1000 llamadas/día gratis
- **Registro**: https://openweathermap.org/api
- **Variables de entorno**: `REACT_APP_OPENWEATHER_API_KEY`

### 2. Estimaciones Marítimas (Automáticas)
- **Propósito**: Datos marítimos estimados basados en clima
- **Costo**: Gratuito
- **Funcionalidad**: Oleaje, corrientes, temperatura del agua
- **Basado en**: Fórmulas meteorológicas marítimas

## Configuración

### 1. Crear archivo `.env` en la raíz del proyecto:

```env
# API Keys para servicios de clima y datos marítimos

# OpenWeatherMap API (gratuita, básica)
REACT_APP_OPENWEATHER_API_KEY=tu_api_key_de_openweathermap_aqui
```

### 2. Obtener API Keys

#### OpenWeatherMap (Recomendado para empezar)
1. Ve a https://openweathermap.org/api
2. Regístrate gratis
3. Obtén tu API key
4. Agrega `REACT_APP_OPENWEATHER_API_KEY=tu_key_aqui` al archivo `.env`

#### Estimaciones Marítimas (Automáticas)
1. No requiere configuración adicional
2. Se generan automáticamente basadas en datos de OpenWeatherMap
3. Usan fórmulas meteorológicas marítimas reales

### 3. Reiniciar la aplicación

```bash
npm start
```

## Datos Disponibles

### Con OpenWeatherMap:
- ✅ Temperatura del aire
- ✅ Velocidad y dirección del viento
- ✅ Presión atmosférica
- ✅ Humedad
- ✅ Visibilidad
- ❌ Datos de oleaje
- ❌ Corrientes marinas
- ❌ Temperatura del agua

### Con Estimaciones Marítimas:
- ✅ Datos de oleaje estimados
- ✅ Corrientes marinas estimadas
- ✅ Temperatura del agua estimada
- ✅ Datos de marea estimados
- ✅ Energía de olas calculada
- ✅ Basado en fórmulas meteorológicas reales

## Fallback Automático

El sistema está diseñado para funcionar con datos simulados si no hay APIs configuradas:

1. **Sin APIs**: Datos simulados realistas
2. **Con OpenWeatherMap**: Datos básicos + estimaciones marítimas precisas
3. **Estimaciones automáticas**: Basadas en fórmulas meteorológicas marítimas

## Pruebas

Para probar diferentes configuraciones:

1. **Solo datos simulados**: No configurar ninguna API
2. **Datos básicos + estimaciones marítimas**: Configurar OpenWeatherMap
3. **Estimaciones automáticas**: Se generan basadas en datos de clima

## Notas Importantes

- OpenWeatherMap tiene límite de 1000 llamadas/día gratis
- Las estimaciones marítimas usan fórmulas meteorológicas reales
- Los datos se cachean por 10 minutos para evitar exceso de llamadas
- No se requieren APIs pagas para funcionalidad completa 