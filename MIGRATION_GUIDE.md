# 🚀 Guía de Migración: Firebase → PostgreSQL

## 📋 Resumen

Este proyecto ha migrado completamente de Firebase Firestore a una base de datos PostgreSQL propia. Esta migración incluye:

- ✅ **Sistema de autenticación personalizado** (reemplaza Firebase Auth)
- ✅ **Base de datos PostgreSQL** (reemplaza Firestore)
- ✅ **Cache Redis** (reemplaza Firebase Real-time)
- ✅ **APIs REST** (reemplaza Firebase SDK)
- ✅ **WebSockets** (reemplaza Firebase Real-time)

## 🛠️ Instalación y Configuración

### 1. **Instalar Dependencias**

```bash
npm install
```

### 2. **Configurar Base de Datos**

#### Opción A: Docker (Recomendado)
```bash
# Iniciar PostgreSQL y Redis
npm run db:start

# Configurar la base de datos
npm run db:setup
```

#### Opción B: Instalación Manual
```bash
# Instalar PostgreSQL
# Instalar Redis
# Crear base de datos
createdb restaurant_platform

# Configurar la base de datos
npm run db:setup
```

### 3. **Configurar Variables de Entorno**

Crear archivo `.env.local`:

```env
# Base de datos
DATABASE_URL=postgresql://admin:secure_restaurant_2024@localhost:5432/restaurant_platform
REDIS_URL=redis://localhost:6379

# Autenticación
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024

# Servicios externos (mantener los existentes)
RETELL_API_KEY=key_af2cbf1b9fb5a43ebc84bc56b27b
RETELL_AGENT_ID=agent_2082fc7a622cdbd22441b22060
TWILIO_ACCOUNT_SID=TKeeaa06c4cb6cc36135a403c046fef1f2
TWILIO_AUTH_TOKEN=8a1ec4fac38025b24b3945a48eb1b48d
TWILIO_PHONE_NUMBER=+34984175959
```

### 4. **Migrar Datos de Firebase (Opcional)**

Si tienes datos existentes en Firebase:

```bash
# Configurar variables de Firebase en .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_dominio
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id

# Ejecutar migración
npm run db:migrate
```

## 🔑 Credenciales de Acceso

### Usuarios por Defecto

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Admin | admin@restauranteia.com | admin123 | admin |
| El Buen Sabor | admin@elbuensabor.com | restaurante123 | restaurant |
| La Gaviota | admin@lagaviota.com | restaurante123 | restaurant |

### Usuarios Migrados de Firebase

- **Contraseña por defecto**: `password123`
- **Recomendación**: Cambiar contraseñas en el primer login

## 🏗️ Arquitectura de la Nueva Base de Datos

### Tablas Principales

```sql
-- Restaurantes
restaurants (id, name, slug, owner_email, config, retell_config, twilio_config, ...)

-- Usuarios del sistema
restaurant_users (id, restaurant_id, email, password_hash, role, permissions, ...)

-- Schema por restaurante
restaurant_[uuid].tables (id, number, capacity, status, ...)
restaurant_[uuid].reservations (id, client_name, reservation_date, ...)
restaurant_[uuid].clients (id, name, phone, email, ...)
restaurant_[uuid].retell_config (agent_id, api_key, config, ...)
restaurant_[uuid].twilio_config (account_sid, auth_token, ...)
```

### Ventajas de la Nueva Arquitectura

1. **🔒 Seguridad**: Autenticación JWT con hash bcrypt
2. **⚡ Rendimiento**: Cache Redis + índices optimizados
3. **📊 Escalabilidad**: Schema por restaurante
4. **🔧 Control**: Base de datos propia sin dependencias externas
5. **💰 Costo**: Sin costos de Firebase
6. **🌐 Offline**: Funciona sin conexión a internet

## 🚀 Iniciar la Aplicación

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

## 🔧 Comandos Útiles

```bash
# Base de datos
npm run db:start      # Iniciar PostgreSQL y Redis
npm run db:stop       # Detener servicios
npm run db:reset      # Resetear base de datos
npm run db:setup      # Configurar esquema
npm run db:migrate    # Migrar desde Firebase
npm run db:backup     # Crear backup

# Desarrollo
npm run dev           # Servidor de desarrollo
npm run build         # Construir para producción
npm run start         # Servidor de producción
npm run lint          # Linter
npm run test          # Tests
```

## 📊 APIs Disponibles

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `GET /api/auth/me` - Información del usuario
- `POST /api/auth/logout` - Cerrar sesión

### Restaurantes
- `GET /api/restaurants` - Listar restaurantes
- `POST /api/restaurants` - Crear restaurante
- `GET /api/restaurants/[id]` - Obtener restaurante
- `PUT /api/restaurants/[id]` - Actualizar restaurante
- `DELETE /api/restaurants/[id]` - Eliminar restaurante

### Mesas y Reservas
- `GET /api/restaurants/[id]/tables` - Listar mesas
- `POST /api/restaurants/[id]/tables` - Crear mesa
- `PUT /api/restaurants/[id]/tables/[tableId]` - Actualizar mesa
- `GET /api/restaurants/[id]/reservations` - Listar reservas
- `POST /api/restaurants/[id]/reservations` - Crear reserva

## 🔍 Monitoreo y Logs

### Logs Estructurados
- **Autenticación**: Login, logout, errores
- **API**: Requests, responses, errores
- **Base de datos**: Queries, transacciones
- **Seguridad**: Intentos de acceso, ataques

### Métricas Disponibles
- Usuarios activos
- Reservas por día
- Mesas ocupadas
- Errores de API
- Tiempo de respuesta

## 🛡️ Seguridad

### Medidas Implementadas
- ✅ **Rate Limiting**: 5 intentos de login por minuto
- ✅ **JWT Tokens**: Tokens seguros con expiración
- ✅ **Hash de Contraseñas**: bcrypt con salt rounds
- ✅ **Validación de Entrada**: Sanitización de datos
- ✅ **Headers de Seguridad**: CSP, HSTS, etc.
- ✅ **Logs de Auditoría**: Registro de todas las acciones

### Configuración de Producción
1. Cambiar `JWT_SECRET` por una clave segura
2. Configurar HTTPS
3. Configurar firewall
4. Configurar backup automático
5. Configurar monitoreo

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

### Error de Autenticación
1. Verificar que el usuario existe en `restaurant_users`
2. Verificar que la contraseña esté hasheada correctamente
3. Verificar que el token JWT sea válido

### Error de Permisos
1. Verificar que el usuario tenga el rol correcto
2. Verificar que el usuario tenga los permisos necesarios
3. Verificar que el restaurante esté activo

## 📞 Soporte

Si encuentras problemas durante la migración:

1. **Revisar logs**: `logs/` directory
2. **Verificar configuración**: Variables de entorno
3. **Probar conexiones**: PostgreSQL y Redis
4. **Revisar permisos**: Usuario de base de datos

## 🎯 Próximos Pasos

1. ✅ **Migración completada**
2. 🔄 **Probar funcionalidades**
3. 📊 **Configurar monitoreo**
4. 🚀 **Desplegar a producción**
5. 📈 **Optimizar rendimiento**

¡La migración está completa! Tu sistema ahora funciona con una base de datos propia sin dependencias de Firebase. 🎉
