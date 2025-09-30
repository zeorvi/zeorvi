# 📞 Flujo Completo de Reservas: Cliente → Retell AI → Google Sheets → Dashboard

## 🎯 **Visión General**

El sistema funciona completamente automático:
1. **Cliente llama** → Retell AI responde
2. **Retell AI consulta** Google Sheets para verificar disponibilidad
3. **Retell AI crea/modifica** reserva en Google Sheets
4. **Retell AI responde** al cliente con confirmación o rechazo
5. **Dashboard se actualiza** automáticamente en tiempo real

---

## 🔄 **Flujo Detallado**

### **1. Cliente Llama al Restaurante**
- Cliente marca el número del restaurante
- Retell AI responde automáticamente
- Cliente explica que quiere hacer una reserva

### **2. Retell AI Detecta la Solicitud**
- Retell AI analiza la conversación
- Detecta palabras clave: "reserva", "mesa", "cita", etc.
- Extrae información: nombre, teléfono, fecha, hora, personas

### **3. Sistema Verifica Disponibilidad**
- Retell AI consulta Google Sheets del restaurante
- Verifica si hay disponibilidad para la fecha/hora solicitada
- Considera la capacidad del restaurante y reservas existentes

### **4. Sistema Procesa la Reserva**
- **Si hay disponibilidad**: Crea la reserva en Google Sheets
- **Si no hay disponibilidad**: Sugiere horarios alternativos
- **Si es modificación**: Actualiza la reserva existente

### **5. Retell AI Responde al Cliente**
- **Confirmación**: "¡Perfecto! Su reserva ha sido confirmada..."
- **Rechazo**: "Lo siento, no tenemos disponibilidad..."
- **Alternativas**: "¿Le gustaría probar con estos horarios...?"

### **6. Dashboard se Actualiza**
- Dashboard lee Google Sheets cada 10 segundos
- Muestra la nueva reserva automáticamente
- Indicador de sincronización en tiempo real

---

## 🤖 **Configuración de Retell AI**

### **Cada restaurante tiene su agente único:**
```json
{
  "agentId": "rest_gaviota_001_agent",
  "restaurantName": "La Gaviota",
  "phoneNumber": "555-0101",
  "spreadsheetId": "spreadsheet_gaviota_001",
  "webhookUrl": "https://tu-dominio.com/api/retell/webhook",
  "language": "es",
  "voice": "alloy",
  "model": "gpt-4o-mini"
}
```

### **Prompt del sistema personalizado:**
```
Eres el asistente virtual de La Gaviota. Tu trabajo es ayudar a los clientes con reservas de restaurante.

INFORMACIÓN DEL RESTAURANTE:
- Nombre: La Gaviota
- Teléfono: 555-0101

INSTRUCCIONES:
1. Saluda amablemente al cliente
2. Pregunta por qué tipo de servicio necesita (reserva, información, etc.)
3. Si quiere hacer una reserva, recopila esta información:
   - Nombre completo del cliente
   - Número de teléfono
   - Número de personas
   - Fecha deseada
   - Hora deseada
   - Solicitudes especiales

4. Confirma todos los detalles de la reserva
5. Si todo está correcto, confirma la reserva
6. Proporciona información sobre políticas de cancelación si es necesario

TONO: Amigable y profesional, claro y directo, entusiasta sobre el restaurante
```

---

## 📊 **Google Sheets por Restaurante**

### **Estructura de la hoja "Reservas":**
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Fecha | Hora | Horario | Cliente | Teléfono | Personas | Mesa | Estado |

### **Ejemplo de reserva:**
```
2024-01-15 | 20:00 | 20:00 | Juan Pérez | 555-1234 | 4 | Mesa 1 | confirmada
```

---

## 🔗 **APIs del Sistema**

### **1. Webhook de Retell AI**
```bash
POST /api/retell/webhook
```
- Recibe eventos de Retell AI
- Procesa llamadas analizadas
- Extrae solicitudes de reserva

### **2. Procesar Reserva**
```bash
POST /api/retell/reservation
{
  "customerName": "Juan Pérez",
  "phone": "555-1234",
  "people": 4,
  "date": "2024-01-15",
  "time": "20:00",
  "specialRequests": "Mesa cerca de la ventana",
  "restaurantId": "rest_gaviota_001",
  "restaurantName": "La Gaviota",
  "spreadsheetId": "spreadsheet_gaviota_001",
  "action": "create"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "¡Perfecto! Su reserva ha sido confirmada. Reserva para 4 personas el lunes, 15 de enero de 2024 a las 20:00. Nombre: Juan Pérez. Teléfono: 555-1234. Solicitudes especiales: Mesa cerca de la ventana. La mesa se asignará cuando lleguen. ¡Esperamos verlos pronto!",
  "reservationId": "res_1234567890_abc123",
  "data": {
    "restaurant": "La Gaviota",
    "customer": "Juan Pérez",
    "phone": "555-1234",
    "people": 4,
    "date": "2024-01-15",
    "time": "20:00",
    "status": "confirmed"
  }
}
```

### **3. Verificar Disponibilidad**
```bash
GET /api/retell/reservation?date=2024-01-15&time=20:00&people=4&restaurantId=rest_gaviota_001&restaurantName=La%20Gaviota&spreadsheetId=spreadsheet_gaviota_001
```

**Respuesta:**
```json
{
  "success": true,
  "available": true,
  "message": "Disponible para 4 personas el 2024-01-15 a las 20:00",
  "suggestedTimes": ["19:00", "19:30", "21:00", "21:30"],
  "maxCapacity": 50
}
```

### **4. Obtener Reservas**
```bash
GET /api/google-sheets/reservas?restaurantId=rest_gaviota_001&restaurantName=La%20Gaviota&fecha=2024-01-15&spreadsheetId=spreadsheet_gaviota_001
```

---

## 📱 **Dashboard en Tiempo Real**

### **Características:**
- ✅ **Sincronización cada 10 segundos**
- ✅ **Indicador de tiempo real** (punto verde pulsante)
- ✅ **Actualización automática** de reservas
- ✅ **Botón de actualización manual**

### **URL del Dashboard:**
```
https://tu-dominio.com/dashboard/rest_gaviota_001
```

---

## 🧪 **Probar el Sistema**

### **Prueba Completa:**
```bash
node scripts/test-complete-flow.js
```

### **Prueba de APIs:**
```bash
# Verificar disponibilidad
curl "http://localhost:3001/api/retell/reservation?date=2024-01-15&time=20:00&people=4&restaurantId=rest_gaviota_001&restaurantName=La%20Gaviota&spreadsheetId=spreadsheet_gaviota_001"

# Crear reserva
curl -X POST "http://localhost:3001/api/retell/reservation" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Juan Pérez",
    "phone": "555-1234",
    "people": 4,
    "date": "2024-01-15",
    "time": "20:00",
    "specialRequests": "Mesa cerca de la ventana",
    "restaurantId": "rest_gaviota_001",
    "restaurantName": "La Gaviota",
    "spreadsheetId": "spreadsheet_gaviota_001",
    "action": "create"
  }'
```

---

## 🎯 **Casos de Uso**

### **Caso 1: Reserva Exitosa**
1. Cliente llama: "Hola, quiero reservar una mesa para 4 personas mañana a las 8"
2. Retell AI: "Perfecto, ¿podría darme su nombre y teléfono?"
3. Cliente: "Soy Juan Pérez, teléfono 555-1234"
4. Sistema verifica disponibilidad → ✅ Disponible
5. Sistema crea reserva en Google Sheets
6. Retell AI: "¡Perfecto! Su reserva ha sido confirmada para 4 personas mañana a las 20:00"
7. Dashboard se actualiza automáticamente

### **Caso 2: Sin Disponibilidad**
1. Cliente llama: "Quiero reservar para 6 personas hoy a las 8"
2. Sistema verifica disponibilidad → ❌ No disponible
3. Retell AI: "Lo siento, no tenemos disponibilidad para 6 personas hoy a las 20:00. ¿Le gustaría probar con estos horarios: 19:00, 19:30, 21:00?"
4. Cliente: "Sí, 21:00 está bien"
5. Sistema crea reserva para 21:00
6. Retell AI confirma la nueva reserva

### **Caso 3: Modificación de Reserva**
1. Cliente llama: "Hola, soy Juan Pérez, quería cambiar mi reserva de mañana"
2. Sistema busca reserva existente → ✅ Encontrada
3. Retell AI: "Perfecto, encontré su reserva para mañana a las 20:00. ¿Qué le gustaría cambiar?"
4. Cliente: "Cambiar la hora a las 21:00"
5. Sistema verifica disponibilidad para 21:00 → ✅ Disponible
6. Sistema actualiza reserva en Google Sheets
7. Retell AI: "¡Perfecto! He modificado su reserva para mañana a las 21:00"

---

## 🚀 **Configuración Inicial**

### **1. Variables de Entorno:**
```env
# Google Sheets
GOOGLE_SHEETS_ID=tu_id_principal_de_google_sheets
GOOGLE_CREDENTIALS_PATH=./google-credentials.json
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-service-account@proyecto.iam.gserviceaccount.com

# Retell AI
RETELL_API_KEY=tu_api_key_de_retell

# Aplicación
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

### **2. Crear Restaurante:**
```bash
curl -X POST "http://localhost:3001/api/restaurants/create" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "La Gaviota",
    "address": "Calle del Mar 123",
    "phone": "555-0101",
    "email": "info@lagaviota.com",
    "capacity": 50,
    "features": ["Terraza", "WiFi", "Parking"]
  }'
```

### **3. Configurar Retell AI:**
- Usar el `agentId` generado
- Configurar el webhook: `https://tu-dominio.com/api/retell/webhook`
- Usar el prompt personalizado del restaurante

---

## 🎉 **¡Sistema Listo!**

Una vez configurado:
1. **Cliente llama** al restaurante
2. **Retell AI responde** automáticamente
3. **Sistema gestiona** la reserva completamente
4. **Dashboard se actualiza** en tiempo real
5. **Cliente recibe** confirmación inmediata

**¡El sistema funciona completamente automático!** 🚀

---

## 📞 **Soporte**

Si tienes problemas:
1. Ejecuta `node scripts/test-complete-flow.js`
2. Verifica las variables de entorno
3. Revisa los logs de Retell AI
4. Verifica que Google Sheets esté configurado
5. Revisa el dashboard en tiempo real
