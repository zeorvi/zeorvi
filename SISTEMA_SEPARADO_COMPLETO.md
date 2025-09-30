# 🏪 Sistema Separado Completo: Cada Restaurante Independiente

## 🎯 **Visión General**

Cada restaurante tiene su **propio sistema completamente independiente**:
- ✅ **Google Sheets separado** (archivo independiente)
- ✅ **Retell AI independiente** (agente único)
- ✅ **Dashboard independiente** (URL única)

---

## 🚀 **Flujo de Creación Automática**

### 1. **Crear Restaurante** → Todo se configura automáticamente
```bash
POST /api/restaurants/create
{
  "name": "Mi Restaurante",
  "address": "Calle 123",
  "phone": "555-1234",
  "email": "info@mirestaurante.com",
  "capacity": 50,
  "features": ["Terraza", "WiFi", "Parking"]
}
```

### 2. **Se crean automáticamente:**
- 📊 **Google Sheets independiente** (`Restaurante Mi Restaurante - Sistema de Reservas`)
- 🤖 **Agente Retell AI independiente** (`rest_1234567890_agent`)
- 📱 **Dashboard independiente** (`/dashboard/rest_1234567890`)

---

## 📊 **Estructura de Google Sheets por Restaurante**

Cada restaurante tiene su **propio archivo de Google Sheets** con estas hojas:

### **Hoja 1: Reservas**
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Fecha | Hora | Horario | Cliente | Teléfono | Personas | Mesa | Estado |

### **Hoja 2: Mesas**
| A | B | C | D | E |
|---|---|---|---|---|
| ID | Numero | Capacidad | Ubicación | Tipo |

### **Hoja 3: Horarios**
| A | B | C | D |
|---|---|---|---|---|
| Día | Hora Apertura | Hora Cierre | Abierto |

### **Hoja 4: Disponibilidad**
| A | B | C | D |
|---|---|---|---|
| Fecha | Hora | Mesa | Disponible |

### **Hoja 5: Configuración**
| A | B | C |
|---|---|---|
| Configuración | Valor | Descripción |

### **Hoja 6: Retell AI**
| A | B | C |
|---|---|---|
| Configuración | Valor | Descripción |

---

## 🤖 **Retell AI por Restaurante**

### **Cada restaurante tiene:**
- **Agente único**: `rest_[id]_agent`
- **Prompt personalizado** con nombre y teléfono del restaurante
- **Webhook específico** que identifica el restaurante
- **Configuración independiente** (voz, idioma, modelo)

### **Ejemplo de configuración:**
```json
{
  "agentId": "rest_gaviota_001_agent",
  "restaurantName": "La Gaviota",
  "phoneNumber": "555-0101",
  "spreadsheetId": "spreadsheet_gaviota_001",
  "language": "es",
  "voice": "alloy",
  "model": "gpt-4o-mini"
}
```

---

## 📱 **Dashboard por Restaurante**

### **URLs independientes:**
- `https://tu-dominio.com/dashboard/rest_gaviota_001`
- `https://tu-dominio.com/dashboard/rest_bistro_002`
- `https://tu-dominio.com/dashboard/rest_casa_003`

### **Cada dashboard muestra:**
- ✅ Información específica del restaurante
- ✅ Estado de Google Sheets (activo/inactivo)
- ✅ Estado de Retell AI (activo/inactivo)
- ✅ Reservas del restaurante específico
- ✅ Botón para abrir Google Sheets del restaurante

---

## 🔧 **Configuración Inicial**

### **1. Variables de Entorno** (`.env.local`)
```env
# Google Sheets (ID principal para crear nuevos)
GOOGLE_SHEETS_ID=tu_id_principal_de_google_sheets

# Google Service Account
GOOGLE_CREDENTIALS_PATH=./google-credentials.json
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-service-account@proyecto.iam.gserviceaccount.com

# Retell AI
RETELL_API_KEY=tu_api_key_de_retell

# Aplicación
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

### **2. Google Service Account con permisos:**
- **Google Sheets API** - Para crear y gestionar hojas
- **Google Drive API** - Para crear archivos nuevos
- **Permisos de escritura** en Google Drive

---

## 🧪 **Probar el Sistema**

### **Prueba Completa:**
```bash
node scripts/test-separate-systems.js
```

### **Prueba Simple:**
```bash
node scripts/test-google-sheets.js
```

---

## 📱 **APIs Disponibles**

### **Crear Restaurante (Sistema Completo)**
```bash
POST /api/restaurants/create
```

**Respuesta:**
```json
{
  "success": true,
  "restaurant": {
    "id": "rest_1234567890",
    "name": "Mi Restaurante",
    "googleSheets": {
      "spreadsheetId": "spreadsheet_1234567890",
      "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/spreadsheet_1234567890/edit",
      "created": true
    },
    "retellAI": {
      "agentId": "rest_1234567890_agent",
      "webhookUrl": "https://tu-dominio.com/api/retell/webhook",
      "configured": true
    },
    "dashboard": {
      "url": "https://tu-dominio.com/dashboard/rest_1234567890",
      "available": true
    }
  }
}
```

### **Obtener Reservas de un Restaurante**
```bash
GET /api/google-sheets/reservas?restaurantId=rest_123&restaurantName=Mi%20Restaurante&spreadsheetId=spreadsheet_123&fecha=2024-01-15
```

### **Crear Reserva en un Restaurante**
```bash
POST /api/google-sheets/reservas
{
  "fecha": "2024-01-15",
  "hora": "20:00",
  "horario": "20:00",
  "cliente": "Juan Pérez",
  "telefono": "555-1234",
  "personas": 4,
  "mesa": "Mesa 1",
  "restaurante": "Mi Restaurante",
  "restauranteId": "rest_123",
  "spreadsheetId": "spreadsheet_123"
}
```

---

## 🎯 **Características del Sistema Separado**

### ✅ **Completamente Independiente**
- Cada restaurante tiene su propio Google Sheets
- Cada restaurante tiene su propio agente Retell AI
- Cada restaurante tiene su propio dashboard
- No hay interferencia entre restaurantes

### ✅ **Escalable**
- Soporta ilimitados restaurantes
- Cada uno es completamente independiente
- Fácil de gestionar y mantener

### ✅ **Seguro**
- Datos separados por restaurante
- Acceso independiente a cada sistema
- Configuración específica por restaurante

### ✅ **Automático**
- Creación automática de todos los sistemas
- Configuración automática de Retell AI
- Sincronización automática con Google Sheets

---

## 🔄 **Flujo de Datos por Restaurante**

```
1. Cliente llama al restaurante específico
   ↓
2. Retell AI del restaurante responde
   ↓
3. Retell AI detecta reserva
   ↓
4. Webhook identifica el restaurante
   ↓
5. Escribe en Google Sheets del restaurante específico
   ↓
6. Dashboard del restaurante se actualiza automáticamente
   ↓
7. Solo ese restaurante ve la reserva
```

---

## 📞 **Gestión de Restaurantes**

### **Página Principal:**
- `https://tu-dominio.com/restaurants`
- Lista todos los restaurantes
- Estado de cada sistema (Google Sheets, Retell AI, Dashboard)
- Acceso directo a cada dashboard

### **Dashboard Individual:**
- `https://tu-dominio.com/dashboard/[restaurantId]`
- Información específica del restaurante
- Estado de todos los sistemas
- Gestión de reservas

---

## 🚀 **¡Listo para Usar!**

### **Para crear un restaurante:**
1. **Configura las variables de entorno**
2. **Crea el restaurante** con `POST /api/restaurants/create`
3. **Todo se configura automáticamente:**
   - Google Sheets independiente
   - Retell AI independiente
   - Dashboard independiente

### **Para gestionar restaurantes:**
1. **Ve a** `https://tu-dominio.com/restaurants`
2. **Accede a cada dashboard** individualmente
3. **Cada restaurante funciona independientemente**

**¡Cada restaurante es completamente independiente!** 🎉

---

## 📞 **Soporte**

Si tienes problemas:
1. Ejecuta `node scripts/test-separate-systems.js`
2. Verifica las variables de entorno
3. Revisa que Google Drive API esté habilitada
4. Verifica permisos del Service Account
5. Revisa los logs en la consola del navegador
