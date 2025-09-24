# Configuración de Supabase para Restaurante AI Platform

Este documento explica cómo configurar Supabase como base de datos para la plataforma de restaurantes.

## 🚀 Configuración Inicial

### 1. Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Anota la información de conexión:
   - Host
   - Puerto
   - Base de datos
   - Usuario
   - Contraseña

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con la siguiente configuración:

```bash
# Configuración de Base de Datos PostgreSQL (Supabase)
DATABASE_URL=postgresql://postgres.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@aws-0-us-west-1.pooler.supabase.com:6543/postgres

# Configuración de Redis (opcional para desarrollo local)
REDIS_URL=redis://localhost:6379

# JWT Secret para autenticación
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Firebase (mantener para compatibilidad)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Airtable (opcional)
AIRTABLE_API_KEY=your-airtable-api-key
AIRTABLE_BASE_ID=your-base-id

# Twilio (opcional)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Retell AI (opcional)
RETELL_API_KEY=your-retell-api-key

# Gmail API (opcional)
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
GMAIL_REFRESH_TOKEN=your-gmail-refresh-token
```

### 3. Obtener la URL de Conexión

En el panel de Supabase:

1. Ve a **Settings** → **Database**
2. Copia la **Connection string** (URI)
3. Reemplaza `[YOUR-PASSWORD]` con tu contraseña real
4. Usa esta URL como `DATABASE_URL` en tu `.env.local`

## 🔧 Scripts de Configuración

### Probar Conexión

```bash
npm run db:test-connection
```

Este script verifica que la conexión a Supabase funcione correctamente.

### Configurar Base de Datos

```bash
npm run db:setup
```

Este script:
- Crea todas las tablas necesarias
- Inserta datos de ejemplo
- Configura usuarios demo
- Verifica que todo funcione

## 📋 Estructura de la Base de Datos

### Tablas Principales

- `restaurants` - Información de restaurantes
- `restaurant_users` - Usuarios del sistema
- `restaurant_schemas` - Schemas dinámicos por restaurante

### Schemas por Restaurante

Cada restaurante tiene su propio schema con:
- `tables` - Mesas del restaurante
- `reservations` - Reservas
- `clients` - Clientes
- `orders` - Pedidos
- `menu_items` - Elementos del menú

## 🚨 Solución de Problemas

### Error: ECONNREFUSED

**Causa:** No se puede conectar a Supabase

**Solución:**
1. Verifica que la URL de Supabase sea correcta
2. Asegúrate de que el proyecto Supabase esté activo
3. Verifica que la contraseña de la base de datos sea correcta
4. Revisa la configuración de red/firewall

### Error: 28P01 (Invalid Password)

**Causa:** Credenciales incorrectas

**Solución:**
1. Verifica la contraseña en el panel de Supabase
2. Asegúrate de usar la contraseña correcta del proyecto
3. Verifica que el usuario tenga permisos

### Error: ENOTFOUND

**Causa:** URL de conexión incorrecta

**Solución:**
1. Verifica que la URL de conexión sea correcta
2. Asegúrate de tener conexión a internet
3. Verifica que el proyecto Supabase esté activo
4. Revisa la URL en el panel de Supabase

## 🔐 Seguridad

### Variables de Entorno

- **NUNCA** commits el archivo `.env.local` al repositorio
- Usa contraseñas seguras y únicas
- Rota las credenciales regularmente

### Permisos de Base de Datos

- Usa el usuario `postgres` para operaciones administrativas
- Crea usuarios específicos para la aplicación
- Configura permisos mínimos necesarios

## 📊 Monitoreo

### Panel de Supabase

- Monitorea el uso de la base de datos
- Revisa logs de conexión
- Configura alertas de uso

### Logs de la Aplicación

- Revisa logs de conexión
- Monitorea errores de base de datos
- Configura alertas de errores

## 🚀 Despliegue

### Variables de Entorno en Producción

```bash
# Producción
DATABASE_URL=postgresql://postgres.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@aws-0-us-west-1.pooler.supabase.com:6543/postgres
JWT_SECRET=your-production-jwt-secret
REDIS_URL=redis://your-redis-host:6379
```

### Configuración de Red

- Configura firewall para permitir conexiones desde tu aplicación
- Usa SSL/TLS para conexiones seguras
- Configura rate limiting si es necesario

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js pg Documentation](https://node-postgres.com/)

## 🆘 Soporte

Si tienes problemas con la configuración:

1. Revisa los logs de error
2. Verifica la configuración de Supabase
3. Prueba la conexión con el script de prueba
4. Consulta la documentación de Supabase
5. Contacta al equipo de desarrollo

