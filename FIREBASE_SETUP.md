# 🔥 Configuración de Firebase para Restaurante IA Plataforma

## 📋 Pasos para Configurar Firebase

### 1. **Configurar Reglas de Firestore (IMPORTANTE)**

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: `restaurante-ia-plataforma`
3. Ve a **Firestore Database** > **Rules**
4. Cambia las reglas a modo desarrollo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

5. Haz clic en **Publish**

### 2. **Ejecutar Script de Configuración**

Una vez configuradas las reglas, ejecuta:

```bash
npm run setup-firebase-dev
```

### 3. **Verificar Colecciones Creadas**

Después de ejecutar el script, deberías ver estas colecciones en Firebase Console:

- ✅ **restaurants** - Información de restaurantes
- ✅ **tables** - Mesas y sus estados
- ✅ **clients** - Datos de clientes
- ✅ **reservations** - Reservas del sistema

## 🚀 **Acceso a la Aplicación**

Una vez configurado Firebase, puedes acceder a:

- **🍽️ Restaurante:** http://localhost:3001/
  - Usuario: `elbuensabor`
  - Contraseña: `restaurante123`

- **👨‍💼 Admin:** http://localhost:3001/admin-login
  - Usuario: `admin`
  - Contraseña: `admin123`

- **📖 Demo:** http://localhost:3001/demo
  - Página con instrucciones completas

## 🔧 **Solución de Problemas**

### Error: "Missing or insufficient permissions"

**Solución:**
1. Asegúrate de que las reglas de Firestore estén en modo desarrollo
2. Verifica que hayas hecho clic en "Publish" después de cambiar las reglas
3. Espera unos minutos y vuelve a intentar

### Error: "Firebase project not found"

**Solución:**
1. Verifica que el `projectId` en `.env.local` sea correcto
2. Asegúrate de que el proyecto existe en Firebase Console

### Error: "Authentication failed"

**Solución:**
1. Verifica que las credenciales de Firebase en `.env.local` sean correctas
2. Asegúrate de que la autenticación por email/contraseña esté habilitada

## 📊 **Estructura de Datos**

### Colección: `restaurants`
```javascript
{
  id: "rest_001",
  name: "Restaurante El Buen Sabor",
  email: "admin@elbuensabor.com",
  phone: "+34123456789",
  address: "Calle Principal 123, Madrid",
  type: "Familiar",
  status: "active",
  retellConfig: { ... },
  twilioConfig: { ... }
}
```

### Colección: `tables`
```javascript
{
  id: "M1",
  restaurantId: "rest_001",
  name: "M1",
  capacity: 4,
  status: "libre", // libre, ocupada, reservada
  location: "Terraza",
  lastUpdated: timestamp
}
```

### Colección: `reservations`
```javascript
{
  id: "R001",
  clientId: "C001",
  tableId: "M6",
  restaurantId: "rest_001",
  date: timestamp,
  time: "20:00",
  people: 2,
  status: "confirmada", // pendiente, confirmada, cancelada
  source: "llamada", // llamada, whatsapp, web, admin
  notes: "Mesa romántica"
}
```

## 🎯 **Próximos Pasos**

1. ✅ Configurar reglas de Firestore
2. ✅ Ejecutar script de configuración
3. ✅ Probar login de restaurante
4. ✅ Probar login de administrador
5. ✅ Explorar funcionalidades del sistema

¡Una vez completados estos pasos, tendrás un sistema completo funcionando! 🚀

