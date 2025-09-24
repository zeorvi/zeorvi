# 🔧 Configuración de Variables de Entorno

## 📋 Variables Requeridas

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# =============================================
# BASE DE DATOS
# =============================================

# PostgreSQL
DATABASE_URL=postgresql://admin:secure_restaurant_2024@localhost:5432/restaurant_platform
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=secure_restaurant_2024
DB_NAME=restaurant_platform

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# =============================================
# AUTENTICACIÓN
# =============================================

# JWT Secret (¡CAMBIA ESTO EN PRODUCCIÓN!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024

# =============================================
# SERVICIOS EXTERNOS
# =============================================

# Retell AI (mantener los existentes)
RETELL_API_KEY=key_af2cbf1b9fb5a43ebc84bc56b27b
RETELL_AGENT_ID=agent_2082fc7a622cdbd22441b22060

# Twilio (mantener los existentes)
TWILIO_ACCOUNT_SID=TKeeaa06c4cb6cc36135a403c046fef1f2
TWILIO_AUTH_TOKEN=8a1ec4fac38025b24b3945a48eb1b48d
TWILIO_PHONE_NUMBER=+34984175959

# OpenAI (si lo usas)
OPENAI_API_KEY=your-openai-api-key

# =============================================
# CONFIGURACIÓN DE LA APLICACIÓN
# =============================================

# Entorno
NODE_ENV=development

# URL de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Sentry (opcional)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# =============================================
# SEGURIDAD
# =============================================

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 🚀 Pasos de Configuración

### 1. **Crear el archivo .env.local**
```bash
# Copiar el contenido de arriba a .env.local
cp ENV_SETUP.md .env.local
# Luego editar .env.local con tus valores reales
```

### 2. **Configurar la Base de Datos**
```bash
# Iniciar PostgreSQL y Redis
npm run db:start

# Configurar esquema
npm run db:setup

# Probar configuración
npm run db:test
```

### 3. **Iniciar la Aplicación**
```bash
npm run dev
```

## 🔑 Credenciales por Defecto

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Admin | admin@restauranteia.com | admin123 | admin |
| El Buen Sabor | admin@elbuensabor.com | restaurante123 | restaurant |
| La Gaviota | admin@lagaviota.com | restaurante123 | restaurant |

## ⚠️ Importante

1. **Cambiar JWT_SECRET**: Usa una clave segura en producción
2. **Cambiar contraseñas**: Cambia las contraseñas por defecto
3. **Configurar HTTPS**: En producción usa HTTPS
4. **Backup**: Configura backup automático de la base de datos

## 🆘 Solución de Problemas

### Error de Conexión a PostgreSQL
```bash
# Verificar que PostgreSQL esté ejecutándose
pg_isready -h localhost -p 5432

# Verificar credenciales
psql -h localhost -U admin -d restaurant_platform
```

### Error de Conexión a Redis
```bash
# Verificar que Redis esté ejecutándose
redis-cli ping

# Debería responder: PONG
```

### Error de Build
```bash
# Limpiar cache y reinstalar
rm -rf .next node_modules
npm install
npm run dev
```
