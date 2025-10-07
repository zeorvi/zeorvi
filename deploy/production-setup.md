# Configuración de Producción para 30+ Restaurantes

## 📋 Checklist de Despliegue

### 1. Variables de Entorno Críticas
```bash
# Base de Datos
DATABASE_URL=postgresql://user:password@host:port/database
DB_POOL_SIZE=20
DB_CONNECTION_TIMEOUT=5000
DB_IDLE_TIMEOUT=30000

# Seguridad
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Retell AI
RETELL_API_KEY=your-retell-api-key
RETELL_WEBHOOK_SECRET=your-webhook-secret

# Twilio
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Google Sheets
GOOGLE_CREDENTIALS_PATH=google-credentials.json
GOOGLE_SHEETS_ID=your-spreadsheet-id

# Redis
REDIS_URL=redis://localhost:6379

# Monitoreo
MONITORING_ENABLED=true
MONITORING_INTERVAL_MS=30000
ALERT_MEMORY_THRESHOLD=85
ALERT_CPU_THRESHOLD=80
ALERT_RESPONSE_TIME_THRESHOLD=2000
ALERT_ERROR_RATE_THRESHOLD=5

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESS=true

# CORS
CORS_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com

# Logging
LOG_LEVEL=info
LOG_ENABLE_CONSOLE=true
LOG_ENABLE_FILE=true
LOG_MAX_FILE_SIZE=10m
LOG_MAX_FILES=5
```

### 2. Configuración de Base de Datos PostgreSQL

#### Configuración de Servidor
```sql
-- Configuración optimizada para 30+ restaurantes
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
SELECT pg_reload_conf();
```

#### Índices Críticos
```sql
-- Ejecutar después del despliegue
\i src/lib/database/schema.sql
```

### 3. Configuración de Redis

#### Configuración optimizada
```conf
# redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
tcp-keepalive 300
timeout 0
```

### 4. Configuración de Nginx (si se usa)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=webhook:10m rate=100r/s;
    
    location /api/retell/webhook {
        limit_req zone=webhook burst=50 nodelay;
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5. Configuración de PM2

#### ecosystem.config.js
```javascript
module.exports = {
  apps: [{
    name: 'restaurante-ai-platform',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=4096',
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

### 6. Scripts de Despliegue

#### deploy.sh
```bash
#!/bin/bash

echo "🚀 Iniciando despliegue de producción..."

# 1. Backup de base de datos
echo "📦 Creando backup de base de datos..."
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Instalar dependencias
echo "📦 Instalando dependencias..."
npm ci --production

# 3. Build de producción
echo "🔨 Construyendo aplicación..."
npm run build

# 4. Ejecutar migraciones de base de datos
echo "🗄️ Ejecutando migraciones..."
npm run db:migrate

# 5. Reiniciar aplicación
echo "🔄 Reiniciando aplicación..."
pm2 restart restaurante-ai-platform

# 6. Verificar salud
echo "🏥 Verificando salud de la aplicación..."
sleep 10
curl -f http://localhost:3000/api/health || exit 1

echo "✅ Despliegue completado exitosamente!"
```

### 7. Monitoreo y Alertas

#### Script de monitoreo
```bash
#!/bin/bash
# monitor.sh

while true; do
    # Verificar CPU
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
        echo "ALERTA: CPU usage alto: $CPU_USAGE%"
        # Enviar notificación
    fi
    
    # Verificar memoria
    MEM_USAGE=$(free | grep Mem | awk '{printf("%.2f", $3/$2 * 100.0)}')
    if (( $(echo "$MEM_USAGE > 85" | bc -l) )); then
        echo "ALERTA: Memoria usage alto: $MEM_USAGE%"
        # Enviar notificación
    fi
    
    # Verificar aplicación
    if ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "ALERTA: Aplicación no responde"
        # Reiniciar aplicación
        pm2 restart restaurante-ai-platform
    fi
    
    sleep 60
done
```

### 8. Configuración de Logs

#### Logrotate
```bash
# /etc/logrotate.d/restaurante-ai-platform
/path/to/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 9. Configuración de Firewall

```bash
# UFW
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw allow 8081/tcp
ufw enable
```

### 10. Configuración de SSL (Let's Encrypt)

```bash
# Certbot
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

## 🔧 Comandos de Mantenimiento

### Backup de Base de Datos
```bash
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restaurar Backup
```bash
gunzip -c backup_20241206_143000.sql.gz | psql $DATABASE_URL
```

### Limpiar Logs
```bash
pm2 flush
find /path/to/logs -name "*.log" -mtime +30 -delete
```

### Verificar Estado del Sistema
```bash
pm2 status
pm2 logs --lines 100
df -h
free -h
top
```

## 📊 Métricas de Rendimiento Esperadas

### Con 30+ Restaurantes:
- **Respuesta API**: < 500ms (95% de requests)
- **Uso de CPU**: < 70%
- **Uso de Memoria**: < 80%
- **Conexiones DB**: < 80% del pool máximo
- **Rate Limit**: Configurado por plan de restaurante

### Escalabilidad:
- **Restaurantes Básicos**: 100 req/15min
- **Restaurantes Premium**: 500 req/15min
- **Restaurantes Enterprise**: 2000 req/15min

## 🚨 Plan de Contingencia

### En caso de fallo:
1. **Revisar logs**: `pm2 logs`
2. **Verificar recursos**: `htop`, `df -h`
3. **Reiniciar servicios**: `pm2 restart all`
4. **Restaurar backup**: Si es necesario
5. **Escalar recursos**: Aumentar CPU/RAM si es necesario

### Contactos de Emergencia:
- **DevOps**: [contacto]
- **Base de Datos**: [contacto]
- **Infraestructura**: [contacto]
