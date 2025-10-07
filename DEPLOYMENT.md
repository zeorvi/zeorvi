# 🚀 Guía de Deployment - Restaurante AI Platform

## 📋 Índice

1. [Pre-requisitos](#pre-requisitos)
2. [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
3. [Deployment en Vercel (Recomendado)](#deployment-en-vercel)
4. [Deployment con Docker](#deployment-con-docker)
5. [Deployment con PM2](#deployment-con-pm2)
6. [Configuración Post-Deployment](#configuración-post-deployment)
7. [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)
8. [Troubleshooting](#troubleshooting)

---

## 📦 Pre-requisitos

### Obligatorios

- ✅ Node.js 18+ instalado
- ✅ Cuenta de Supabase (base de datos PostgreSQL)
- ✅ Cuenta de Google Cloud (para Google Sheets API)
- ✅ Cuenta de Retell AI
- ✅ Cuenta de Vercel/AWS/DigitalOcean (para hosting)

### Opcionales

- Redis (recomendado para caché en producción)
- Docker & Docker Compose (para deployment con contenedores)
- PM2 (para deployment en servidor propio)

---

## 🔐 Configuración de Variables de Entorno

### Paso 1: Crear archivo de variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env.local  # Para desarrollo
# o
cp .env.production.example .env.production  # Para producción
```

### Paso 2: Configurar variables requeridas

#### 🗄️ Base de Datos (Supabase)

```bash
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
```

**Obtener desde:** Supabase Dashboard > Project Settings > Database > Connection String

⚠️ **IMPORTANTE**: Nunca uses la contraseña por defecto en producción

#### 🔒 JWT Secret

```bash
# Generar secret seguro
JWT_SECRET=$(openssl rand -base64 32)
```

En Windows (PowerShell):
```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
$JWT_SECRET = [Convert]::ToBase64String($bytes)
echo $JWT_SECRET
```

#### 📊 Google Sheets API

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto o selecciona uno existente
3. Habilita Google Sheets API
4. Crea una cuenta de servicio
5. Descarga el archivo JSON de credenciales
6. Guarda el archivo como `google-credentials.json` en la raíz del proyecto

```bash
GOOGLE_CLIENT_EMAIL=tu-servicio@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_PROJECT_ID=tu-proyecto-id
```

#### 🤖 Retell AI

```bash
RETELL_API_KEY=tu-retell-api-key
```

**Obtener desde:** [Retell AI Dashboard](https://app.retellai.com/) > API Keys

---

## 🌐 Deployment en Vercel (Recomendado)

### Opción 1: Deploy Automático desde GitHub

1. **Conecta tu repositorio:**
   - Ve a [Vercel](https://vercel.com/new)
   - Importa tu repositorio de GitHub
   - Selecciona el framework: Next.js

2. **Configura variables de entorno:**
   ```bash
   # En Vercel Dashboard > Settings > Environment Variables
   
   # Agregar todas las variables del archivo .env.production.example
   DATABASE_URL=...
   JWT_SECRET=...
   GOOGLE_CLIENT_EMAIL=...
   GOOGLE_PRIVATE_KEY=...
   RETELL_API_KEY=...
   NEXT_PUBLIC_BASE_URL=https://tu-proyecto.vercel.app
   ```

3. **Deploy:**
   - Vercel automáticamente hace deploy en cada push a main/master

### Opción 2: Deploy desde CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy a producción
vercel --prod

# Configurar variables de entorno
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add GOOGLE_CLIENT_EMAIL production
vercel env add GOOGLE_PRIVATE_KEY production
vercel env add RETELL_API_KEY production
```

### ⚠️ Nota sobre WebSocket en Vercel

Vercel **NO soporta WebSockets** nativos. El sistema está configurado para detectar automáticamente el entorno Vercel y deshabilitar WebSocket.

**Alternativas para tiempo real en Vercel:**
- Usar Server-Sent Events (SSE)
- Usar servicios externos como Pusher o Ably
- Polling con intervalos

---

## 🐳 Deployment con Docker

### Paso 1: Preparar archivos

```bash
# Asegurarse de tener:
# - Dockerfile ✓
# - docker-compose.yml ✓
# - docker-compose.prod.yml ✓
# - .env.local o .env.production ✓
```

### Paso 2: Build de imágenes

```bash
# Para desarrollo
docker-compose build

# Para producción
docker-compose -f docker-compose.prod.yml build
```

### Paso 3: Iniciar servicios

```bash
# Desarrollo
docker-compose up -d

# Producción
docker-compose -f docker-compose.prod.yml up -d
```

### Paso 4: Verificar

```bash
# Ver logs
docker-compose logs -f app

# Ver estado
docker-compose ps

# Health check
curl http://localhost:3000/api/health
```

### Comandos útiles

```bash
# Detener servicios
docker-compose down

# Reiniciar
docker-compose restart

# Ver logs de servicio específico
docker-compose logs -f postgres
docker-compose logs -f redis

# Entrar al contenedor
docker-compose exec app sh

# Backup de base de datos
docker-compose exec postgres pg_dump -U restaurant_user restaurant_ai_platform > backup.sql
```

---

## ⚡ Deployment con PM2

### Paso 1: Instalar PM2

```bash
npm install -g pm2
```

### Paso 2: Build de producción

```bash
NODE_ENV=production npm run build
```

### Paso 3: Iniciar con PM2

```bash
# Iniciar aplicación
pm2 start ecosystem.config.js --env production

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup
```

### Paso 4: Comandos PM2

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs restaurante-ai-platform

# Monitoreo en tiempo real
pm2 monit

# Reiniciar
pm2 restart restaurante-ai-platform

# Detener
pm2 stop restaurante-ai-platform

# Eliminar
pm2 delete restaurante-ai-platform
```

---

## ⚙️ Configuración Post-Deployment

### 1. Configurar Agentes de Retell AI

```bash
# Crear agente para restaurante
curl -X POST https://api.retellai.com/v1/agents \
  -H "Authorization: Bearer $RETELL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Asistente La Gaviota",
    "voice": "alloy",
    "language": "es-ES",
    "webhook_url": "https://tu-dominio.vercel.app/api/retell/webhook"
  }'
```

### 2. Configurar Google Sheets

1. Comparte cada Google Sheet con el email de servicio:
   - `zeorvi@zeorvi.iam.gserviceaccount.com`
   - Dale permisos de **Editor**

2. Copia el ID de cada Sheet desde la URL:
   ```
   https://docs.google.com/spreadsheets/d/[ESTE-ES-EL-ID]/edit
   ```

3. Actualiza `src/lib/restaurantSheets.ts`:
   ```typescript
   export const RESTAURANT_SHEETS = {
     rest_003: {
       name: "La Gaviota",
       spreadsheetId: "TU-SHEET-ID-AQUI",
     },
   };
   ```

### 3. Configurar Webhooks

En Retell AI Dashboard:
- Webhook URL: `https://tu-dominio.com/api/retell/webhook`
- Events: `call.started`, `call.ended`, `call.analyzed`

### 4. Configurar CORS (si es necesario)

Ya está configurado en `vercel.json` y `next.config.ts`, pero verifica que tu dominio esté permitido.

---

## 📊 Monitoreo y Mantenimiento

### Health Checks

```bash
# Check básico
curl https://tu-dominio.com/api/health

# Check detallado (requiere auth de admin)
curl -X POST https://tu-dominio.com/api/health \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Logs

#### Vercel
```bash
vercel logs [deployment-url]
```

#### Docker
```bash
docker-compose logs -f --tail=100
```

#### PM2
```bash
pm2 logs --lines 100
```

### Métricas

El sistema incluye monitoreo automático:
- `/api/health` - Estado del sistema
- Logs estructurados con winston
- Alertas automáticas configurables

### Backups Automáticos

Con Docker:
```bash
# El servicio de backup corre automáticamente cada 24 horas
# Los backups se guardan en ./backups/
```

Manual:
```bash
# Backup de base de datos
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20240101.sql
```

---

## 🔧 Troubleshooting

### Error: "Database connection failed"

**Solución:**
1. Verifica que `DATABASE_URL` esté correctamente configurado
2. Comprueba que Supabase esté activo
3. Verifica las credenciales

```bash
# Test de conexión
psql $DATABASE_URL -c "SELECT 1"
```

### Error: "Google Sheets API error"

**Solución:**
1. Verifica que el Sheet esté compartido con la cuenta de servicio
2. Comprueba que las credenciales sean correctas
3. Verifica que la API de Google Sheets esté habilitada

### Error: "WebSocket already in use"

**Solución:**
- El sistema ahora usa un singleton para WebSocket
- Si persiste, reinicia el servidor
- En Vercel, esto no debería ocurrir (WebSocket está deshabilitado)

### Error de Build

```bash
# Limpiar cache y reinstalar
rm -rf .next node_modules
npm install
npm run build
```

### Performance lento

1. **Habilitar Redis** para caché
2. **Optimizar queries** de base de datos
3. **Configurar CDN** para assets estáticos
4. **Escalar horizontalmente** con más instancias

---

## 📝 Checklist Final de Deployment

### Pre-deployment
- [ ] Todas las variables de entorno configuradas
- [ ] `google-credentials.json` creado y no commiteado
- [ ] Build exitoso sin errores
- [ ] Tests pasando (si existen)
- [ ] Linter sin errores críticos

### Post-deployment
- [ ] Health check OK
- [ ] Base de datos conectada
- [ ] Google Sheets funcionando
- [ ] Retell AI webhooks activos
- [ ] Logs sin errores críticos
- [ ] Monitoreo configurado

### Seguridad
- [ ] JWT_SECRET único y seguro
- [ ] Contraseñas de DB cambiadas
- [ ] CORS configurado correctamente
- [ ] HTTPS habilitado
- [ ] Variables sensibles no commiteadas

---

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs primero
2. Consulta la documentación técnica
3. Verifica las variables de entorno
4. Revisa el estado de los servicios externos

---

## 🎉 ¡Deployment Exitoso!

Tu sistema está ahora en producción. Recuerda:

- Monitorear logs regularmente
- Hacer backups periódicos
- Mantener dependencias actualizadas
- Revisar métricas de rendimiento

**¡Buena suerte con tu plataforma! 🚀**

