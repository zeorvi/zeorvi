# 🤖 Sistema Automático Completo: Restaurantes + Google Sheets + Retell AI + Dashboard

## 🎯 **Visión General**

Este sistema crea **automáticamente** toda la configuración necesaria para un restaurante:
- ✅ **Google Sheets** con mesas, horarios y disponibilidad
- ✅ **Retell AI** configurado para detectar reservas
- ✅ **Dashboard** sincronizado automáticamente
- ✅ **APIs** multi-restaurante

---

## 🚀 **Flujo Automático Completo**

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
- 📊 **Hoja de Reservas** (`Reservas_Mi_Restaurante`)
- 🪑 **Hoja de Mesas** (`Mesas_Mi_Restaurante`)
- ⏰ **Hoja de Horarios** (`Horarios_Mi_Restaurante`)
- 📅 **Hoja de Disponibilidad** (`Disponibilidad_Mi_Restaurante`)
- 🤖 **Configuración Retell AI** (`Retell_Mi_Restaurante`)

### 3. **Retell AI** detecta reservas automáticamente
- 📞 Cliente llama → Retell AI responde
- 🧠 Retell AI analiza la conversación
- 📝 Detecta datos de reserva (nombre, teléfono, fecha, hora, personas)
- 📊 Escribe automáticamente en Google Sheets del restaurante

### 4. **Dashboard** se actualiza automáticamente
- 🔄 Lee Google Sheets cada 30 segundos
- 📱 Muestra reservas en tiempo real
- 🎯 Botón "Actualizar" para sincronización manual

---

## 📊 **Estructura de Google Sheets**

### **Por cada restaurante se crean 5 hojas:**

#### 1. **Hoja de Reservas** (`Reservas_[Nombre_Restaurante]`)
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Fecha | Hora | Horario | Cliente | Teléfono | Personas | Mesa | Estado |

#### 2. **Hoja de Mesas** (`Mesas_[Nombre_Restaurante]`)
| A | B | C | D | E |
|---|---|---|---|---|
| ID | Numero | Capacidad | Ubicación | Tipo |

#### 3. **Hoja de Horarios** (`Horarios_[Nombre_Restaurante]`)
| A | B | C | D |
|---|---|---|---|
| Día | Hora Apertura | Hora Cierre | Abierto |

#### 4. **Hoja de Disponibilidad** (`Disponibilidad_[Nombre_Restaurante]`)
| A | B | C | D |
|---|---|---|---|
| Fecha | Hora | Mesa | Disponible |

#### 5. **Configuración Retell AI** (`Retell_[Nombre_Restaurante]`)
| A | B | C |
|---|---|---|
| Configuración | Valor | Descripción |

---

## 🔧 **Configuración Inicial**

### **1. Variables de Entorno** (`.env.local`)
```env
# Google Sheets
GOOGLE_SHEETS_ID=tu_id_de_la_hoja_de_calculo
GOOGLE_CREDENTIALS_PATH=./google-credentials.json

# Retell AI
RETELL_API_KEY=tu_api_key_de_retell

# Aplicación
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

### **2. Google Service Account**
- Crear en [Google Cloud Console](https://console.cloud.google.com)
- Habilitar Google Sheets API
- Descargar `google-credentials.json`
- Compartir Google Sheets con el email del service account

---

## 🧪 **Probar el Sistema**

### **Prueba Completa:**
```bash
node scripts/test-auto-system.js
```

### **Prueba Simple:**
```bash
node scripts/test-google-sheets.js
```

---

## 📱 **APIs Disponibles**

### **Crear Restaurante**
```bash
POST /api/restaurants/create
```

### **Obtener Reservas**
```bash
GET /api/google-sheets/reservas?restaurantId=rest_123&restaurantName=Mi%20Restaurante&fecha=2024-01-15
```

### **Crear Reserva**
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
  "restauranteId": "rest_123"
}
```

### **Verificar Disponibilidad**
```bash
GET /api/google-sheets/disponibilidad?fecha=2024-01-15&hora=20:00&personas=4&restaurantId=rest_123&restaurantName=Mi%20Restaurante
```

### **Webhook Retell AI**
```bash
POST /api/retell/webhook
```

---

## 🎯 **Características del Sistema**

### ✅ **Completamente Automático**
- No necesitas crear Google Sheets manualmente
- No necesitas configurar Retell AI manualmente
- No necesitas sincronizar dashboard manualmente

### ✅ **Multi-Restaurante**
- Cada restaurante tiene sus propias hojas
- APIs soportan múltiples restaurantes
- Dashboard específico por restaurante

### ✅ **Tiempo Real**
- Dashboard se actualiza cada 30 segundos
- Retell AI escribe inmediatamente en Google Sheets
- Sincronización automática

### ✅ **Escalable**
- Soporta ilimitados restaurantes
- Cada restaurante es independiente
- APIs optimizadas para rendimiento

---

## 🔄 **Flujo de Datos**

```
1. Cliente llama
   ↓
2. Retell AI responde
   ↓
3. Retell AI analiza conversación
   ↓
4. Webhook detecta reserva
   ↓
5. Extrae datos (nombre, teléfono, fecha, hora, personas)
   ↓
6. Escribe en Google Sheets del restaurante
   ↓
7. Dashboard lee Google Sheets
   ↓
8. Muestra reserva en tiempo real
```

---

## 🚀 **¡Listo para Usar!**

Una vez configurado:

1. **Crea restaurantes** con `POST /api/restaurants/create`
2. **Configura Retell AI** con el webhook `/api/retell/webhook`
3. **Las reservas aparecen automáticamente** en el dashboard
4. **Todo se sincroniza automáticamente** con Google Sheets

**¡El sistema está completamente automatizado!** 🎉

---

## 📞 **Soporte**

Si tienes problemas:
1. Ejecuta `node scripts/test-auto-system.js`
2. Verifica las variables de entorno
3. Revisa los logs en la consola del navegador
4. Verifica que Google Sheets API esté habilitada
