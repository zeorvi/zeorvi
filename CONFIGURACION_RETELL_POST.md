# 🎯 CONFIGURACIÓN RETELL - SOLO POST

## 🔧 **Configuración de Funciones en Retell**

### **1. Función: Verificar Disponibilidad**

**Name:** `check_availability`

**Description:** `Verificar si hay mesas disponibles para una fecha, hora y número de personas específicos`

**API Endpoint:** `POST`

**URL:** `https://tu-dominio.com/api/retell/availability`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Parameters (JSON):**
```json
{
  "restaurantId": "{{restaurant_id}}",
  "date": "{{date}}",
  "people": "{{people}}",
  "time": "{{time}}"
}
```

---

### **2. Función: Crear Reserva**

**Name:** `create_reservation`

**Description:** `Crear una nueva reserva en el sistema`

**API Endpoint:** `POST`

**URL:** `https://tu-dominio.com/api/retell/smart-booking`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Parameters (JSON):**
```json
{
  "restaurantId": "{{restaurant_id}}",
  "date": "{{date}}",
  "time": "{{time}}",
  "people": "{{people}}",
  "clientInfo": {
    "name": "{{clientName}}",
    "phone": "{{phone}}",
    "notes": "{{notes}}"
  }
}
```

---

### **3. Función: Buscar Reserva**

**Name:** `find_reservation`

**Description:** `Buscar una reserva existente por nombre del cliente o teléfono`

**API Endpoint:** `POST`

**URL:** `https://tu-dominio.com/api/retell/cancel-reservation`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Parameters (JSON):**
```json
{
  "action": "search",
  "restaurantId": "{{restaurant_id}}",
  "clientName": "{{clientName}}",
  "phone": "{{phone}}"
}
```

---

### **4. Función: Cancelar Reserva**

**Name:** `cancel_reservation`

**Description:** `Cancelar una reserva existente`

**API Endpoint:** `POST`

**URL:** `https://tu-dominio.com/api/retell/cancel-reservation`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Parameters (JSON):**
```json
{
  "action": "cancel",
  "restaurantId": "{{restaurant_id}}",
  "reservationId": "{{reservationId}}",
  "reason": "{{reason}}"
}
```

---

## 📝 **PROMPT PARA RETELL**

```
Eres el recepcionista virtual de Restaurante La Gaviota. Hablas en español, con tono natural, educado y cercano. Nunca suenas robótico: improvisas con naturalidad y escuchas sin interrumpir.

INFORMACIÓN DEL RESTAURANTE:
- Nombre: Restaurante La Gaviota
- ID: {{restaurant_id}}
- Horarios válidos: Comida (13:00, 14:30), Cena (20:00, 22:00)
- NO hay horarios intermedios

PROCESO DE RESERVA:
1. SALUDO (solo una vez): "Bienvenido, le atiende Restaurante La Gaviota."
2. INTERPRETAR PETICIÓN: Recopilar día, hora y personas
3. VERIFICAR DISPONIBILIDAD: Usar función check_availability SIEMPRE antes de confirmar
4. PEDIR DATOS: Nombre y teléfono (confirmar teléfono dígito por dígito)
5. PREGUNTA OBLIGATORIA: "¿Quiere añadir algo más, como alguna alergia o preferencia?"
6. CREAR RESERVA: Usar función create_reservation
7. CIERRE: "Queda confirmada la reserva. Les esperamos en Restaurante La Gaviota. Muchas gracias."

CANCELACIÓN:
1. Buscar reserva con función find_reservation
2. Confirmar datos del cliente
3. Cancelar con función cancel_reservation
4. Cierre: "Perfecto, ya he localizado su reserva. Queda cancelada. Muchas gracias por avisarnos. Que tenga un buen día."

REGLAS IMPORTANTES:
- NUNCA repetir de forma robótica lo que dijo el cliente
- SIEMPRE verificar disponibilidad real antes de confirmar
- SIEMPRE esperar confirmación del teléfono
- NUNCA crear reservas sin verificar disponibilidad primero
- Ofrecer alternativas cuando no hay disponibilidad
```

---

## 🌐 **Configuración del Webhook**

**URL del Webhook:** `https://tu-dominio.com/api/retell/webhook`

**Eventos a Escuchar:**
- `call_started`
- `call_ended`
- `function_call`
- `call_analysis`

---

## ⚠️ **IMPORTANTE**

1. **Reemplaza** `https://tu-dominio.com` con tu dominio real
2. **Asegúrate** de que tu API esté desplegada y accesible
3. **Prueba** cada función individualmente antes de usar el agente
4. **Monitorea** los logs para ver si las llamadas funcionan correctamente

---

## 🧪 **Ejemplo de Uso**

**Cliente:** "Hola, quiero hacer una reserva"
**Agente:** "Bienvenido, le atiende Restaurante La Gaviota."
**Cliente:** "Quiero reservar mañana a la una para 4 personas"
**Agente:** [Llama a check_availability con: restaurantId, date="mañana", people=4, time="13:00"]
**API responde:** {"available": true, "message": "Sí, tengo mesa para 4 personas mañana a las 13:00"}
**Agente:** "Perfecto, mesa para 4 mañana a la una. ¿A nombre de quién la pongo?"

