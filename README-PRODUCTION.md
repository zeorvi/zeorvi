# 🏪 Sistema de Restaurantes con IA - Producción

Sistema completo de gestión de restaurantes con inteligencia artificial, tiempo real y analytics avanzados.

## 🚀 Características Principales

### 📊 **Dashboard Inteligente**
- ✅ Control de mesas en tiempo real
- ✅ Gestión de reservas automática
- ✅ Métricas y analytics avanzados
- ✅ Sistema de alertas inteligentes
- ✅ Predicciones de ocupación con IA

### 🤖 **Agente IA Avanzado**
- ✅ Procesamiento de lenguaje natural
- ✅ Gestión automática de reservas
- ✅ Análisis de patrones de clientes
- ✅ Recomendaciones inteligentes
- ✅ Integración con Retell AI

### ⚡ **Tiempo Real**
- ✅ WebSocket para actualizaciones instantáneas
- ✅ Sincronización entre dashboard y agente
- ✅ Notificaciones push
- ✅ Estados persistentes

### 📈 **Analytics y Predicciones**
- ✅ Motor de IA predictiva
- ✅ Análisis de ocupación histórica
- ✅ Proyecciones de ingresos
- ✅ Optimización automática
- ✅ Reportes detallados

## 🛠️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dashboard     │    │   Agente IA     │    │   Analytics     │
│   (React)       │◄──►│   (Retell)      │◄──►│   Engine        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WebSocket     │    │   PostgreSQL    │    │   Alert System  │
│   Server        │    │   Database      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📦 Instalación y Configuración

### 1. **Requisitos del Sistema**
- Node.js 18+
- PostgreSQL 15+
- Redis 7+ (opcional, para cache)
- Docker & Docker Compose (para despliegue)

### 2. **Instalación Rápida**
```bash
# Clonar repositorio
git clone <repository-url>
cd restaurante-ai-platform

# Instalar dependencias
npm install

# Configurar base de datos
npm run setup:db

# Configurar para producción
node scripts/setup-production-config.js

# Desplegar
./deploy.sh
```

### 3. **Configuración Manual**

#### Variables de Entorno (.env.production)
```env
# Base de datos
DATABASE_URL=postgresql://username:password@localhost:5432/restaurant_ai_platform

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Retell AI
RETELL_API_KEY=your_retell_api_key_here

# WebSocket
WS_PORT=8081

# Seguridad
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
```

#### Base de Datos
```bash
# Crear base de datos
createdb restaurant_ai_platform

# Ejecutar migraciones
psql restaurant_ai_platform < scripts/setup-production-database.sql

# Inicializar datos
node scripts/setup-production.js
```

## 🔧 API Endpoints

### **Restaurantes**
- `GET /api/restaurant/tables?restaurantId=rest_001` - Obtener mesas
- `POST /api/restaurant/update-table-status` - Actualizar estado de mesa
- `GET /api/restaurant/schedule?restaurantId=rest_001` - Obtener horario
- `POST /api/restaurant/update-schedule` - Actualizar horario
- `GET /api/restaurant/metrics?restaurantId=rest_001` - Obtener métricas

### **Retell AI**
- `GET /api/retell/restaurant-status?restaurantId=rest_001` - Estado completo
- `POST /api/retell/webhook` - Webhook de eventos
- `GET /api/retell/tables?restaurantId=rest_001` - Mesas disponibles
- `POST /api/retell/reservations` - Crear reserva

### **Analytics**
- `GET /api/analytics/report?restaurantId=rest_001&period=week` - Reporte completo
- `POST /api/analytics/clear-cache` - Limpiar cache

### **Alertas**
- `GET /api/alerts?restaurantId=rest_001` - Alertas activas
- `POST /api/alerts/acknowledge` - Reconocer alerta
- `PUT /api/alerts/resolve` - Resolver alerta

### **WebSocket**
- `ws://localhost:3000/ws` - Conexión tiempo real

## 📊 Base de Datos

### **Tablas Principales**

#### `table_states`
```sql
CREATE TABLE table_states (
    id UUID PRIMARY KEY,
    restaurant_id VARCHAR(50) NOT NULL,
    table_id VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL,
    location VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    client_name VARCHAR(100),
    client_phone VARCHAR(20),
    party_size INTEGER,
    notes TEXT,
    occupied_at TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `reservations`
```sql
CREATE TABLE reservations (
    id UUID PRIMARY KEY,
    restaurant_id VARCHAR(50) NOT NULL,
    table_id VARCHAR(50),
    client_name VARCHAR(100) NOT NULL,
    client_phone VARCHAR(20) NOT NULL,
    party_size INTEGER NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmada',
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `restaurant_metrics`
```sql
CREATE TABLE restaurant_metrics (
    id UUID PRIMARY KEY,
    restaurant_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    hour INTEGER NOT NULL,
    total_tables INTEGER NOT NULL,
    occupied_tables INTEGER NOT NULL DEFAULT 0,
    reserved_tables INTEGER NOT NULL DEFAULT 0,
    free_tables INTEGER NOT NULL DEFAULT 0,
    occupancy_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    revenue DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🤖 Configuración del Agente IA

### **Retell AI Setup**

1. **Crear Agente en Retell**
```javascript
const agentConfig = {
  name: "Restaurant Assistant",
  voice: "alloy",
  language: "es-ES",
  webhook_url: "https://your-domain.com/api/retell/webhook",
  prompt: generateAgentPrompt(restaurantId)
};
```

2. **Configurar Webhook**
```javascript
// El webhook maneja múltiples restaurantes
// Identifica el restaurante por agent_id
const restaurantId = getRestaurantByAgentId(agentId);
```

3. **Capacidades del Agente**
- ✅ Consultar disponibilidad de mesas
- ✅ Crear y modificar reservas
- ✅ Obtener información del restaurante
- ✅ Proporcionar recomendaciones
- ✅ Manejar cancelaciones

## 📈 Analytics y Predicciones

### **Motor de IA Predictiva**

```javascript
// Generar predicción de ocupación
const prediction = await occupancyPredictor.predictOccupancy(
  restaurantId,
  date,
  hour
);

// Resultado
{
  predictedOccupancy: 75.5,
  confidenceScore: 0.85,
  factors: {
    dayOfWeek: 'friday',
    seasonality: 1.2,
    historicalAverage: 70.0,
    recentTrend: 5.5
  },
  recommendations: [
    'Preparar personal adicional',
    'Considerar promociones especiales'
  ]
}
```

### **Reportes de Analytics**

```javascript
// Generar reporte completo
const report = await analyticsEngine.generateAnalyticsReport(
  restaurantId,
  'week'
);

// Incluye:
// - Resumen ejecutivo
// - Analytics de ocupación
// - Analytics de ingresos
// - Analytics de mesas
// - Analytics de reservas
// - Predicciones
// - Recomendaciones
```

## 🚨 Sistema de Alertas

### **Tipos de Alertas**

1. **Alta Ocupación** (≥85%)
   - Severidad: Alta
   - Cooldown: 15 minutos
   - Acción: Aumentar personal

2. **Baja Ocupación** (≤20%)
   - Severidad: Media
   - Cooldown: 30 minutos
   - Acción: Promociones

3. **Conflictos de Mesas**
   - Severidad: Media
   - Cooldown: 10 minutos
   - Acción: Revisar información

4. **Anomalías en Predicciones**
   - Severidad: Baja
   - Cooldown: 60 minutos
   - Acción: Revisar datos históricos

### **Configuración de Alertas**

```javascript
// Configurar umbrales
await alertSystem.configureAlerts(restaurantId, {
  highOccupancyThreshold: 85,
  lowOccupancyThreshold: 20,
  predictionAnomalyThreshold: 30,
  tableConflictEnabled: true,
  scheduleChangeEnabled: true,
  systemErrorEnabled: true
});
```

## 🔌 WebSocket - Tiempo Real

### **Conexión**
```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  // Suscribirse a restaurante
  ws.send(JSON.stringify({
    type: 'subscribe',
    restaurantId: 'rest_001'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.data.eventType) {
    case 'table_status_changed':
      updateTableUI(message.data);
      break;
    case 'alert_triggered':
      showAlert(message.data.alert);
      break;
    case 'metrics_updated':
      updateMetrics(message.data.metrics);
      break;
  }
};
```

### **Eventos Disponibles**
- `table_status_changed` - Cambio de estado de mesa
- `alert_triggered` - Nueva alerta
- `alert_acknowledged` - Alerta reconocida
- `alert_resolved` - Alerta resuelta
- `metrics_updated` - Métricas actualizadas
- `initial_state` - Estado inicial

## 🐳 Despliegue con Docker

### **Docker Compose**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: restaurant_ai_platform
      POSTGRES_USER: restaurant_user
      POSTGRES_PASSWORD: restaurant_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://restaurant_user:restaurant_password@postgres:5432/restaurant_ai_platform
    depends_on:
      - postgres
      - redis
```

### **Comandos de Despliegue**
```bash
# Construir y desplegar
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Parar servicios
docker-compose -f docker-compose.prod.yml down
```

## 📱 Uso del Sistema

### **1. Dashboard del Restaurante**
- Acceder a `http://localhost:3000/restaurant/rest_001`
- Ver estado de mesas en tiempo real
- Gestionar horarios y disponibilidad
- Monitorear métricas y alertas

### **2. Agente IA**
- Configurar en Retell AI
- Proporcionar webhook URL
- El agente maneja reservas automáticamente
- Responde consultas de clientes

### **3. Analytics**
- Generar reportes: `/api/analytics/report`
- Ver predicciones de ocupación
- Analizar tendencias históricas
- Obtener recomendaciones

### **4. Alertas**
- Monitorear alertas activas: `/api/alerts`
- Reconocer alertas importantes
- Resolver problemas identificados
- Configurar umbrales personalizados

## 🔧 Mantenimiento

### **Monitoreo**
```bash
# Verificar estado de servicios
curl http://localhost:3000/api/health

# Verificar base de datos
psql restaurant_ai_platform -c "SELECT COUNT(*) FROM table_states;"

# Verificar WebSocket
wscat -c ws://localhost:3000/ws
```

### **Backup**
```bash
# Backup de base de datos
pg_dump restaurant_ai_platform > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql restaurant_ai_platform < backup_20231201.sql
```

### **Logs**
```bash
# Ver logs de la aplicación
docker-compose logs -f app

# Ver logs de base de datos
docker-compose logs -f postgres
```

## 🚀 Escalabilidad

### **Horizontal Scaling**
- Múltiples instancias de la aplicación
- Load balancer para distribución
- Redis para sesiones compartidas
- PostgreSQL con réplicas de lectura

### **Vertical Scaling**
- Aumentar recursos de CPU/RAM
- Optimizar consultas de base de datos
- Cache con Redis
- CDN para assets estáticos

## 📞 Soporte

### **Documentación**
- [API Reference](./docs/api.md)
- [Database Schema](./docs/database.md)
- [WebSocket Events](./docs/websocket.md)
- [AI Agent Guide](./docs/agent.md)

### **Contacto**
- Email: support@restaurant-ai.com
- Discord: [Servidor de Soporte](https://discord.gg/restaurant-ai)
- GitHub Issues: [Reportar Problemas](https://github.com/restaurant-ai/issues)

---

## 🎉 ¡Sistema Listo para Producción!

El sistema está completamente configurado y listo para manejar restaurantes en producción con:

- ✅ **Base de datos real** con persistencia
- ✅ **Tiempo real** con WebSocket
- ✅ **IA predictiva** para optimización
- ✅ **Analytics avanzados** para insights
- ✅ **Sistema de alertas** inteligente
- ✅ **Agente IA** completamente funcional
- ✅ **Escalabilidad** y alta disponibilidad

**¡Disfruta de tu sistema de restaurantes inteligente! 🍽️🤖**
