# 🔧 CONFIGURACIÓN CORRECTA DE FUNCIONES EN RETELL AI

## ⚠️ FORMATO CORRECTO PARA RETELL

Retell AI NO permite enviar un body personalizado con `function_name` y `parameters`. 
En su lugar, debes configurar las funciones de esta manera:

---

## 📋 OPCIÓN 1: Usar Custom Tools (Recomendado)

### En Retell Dashboard → Agent → Tools/Functions

Para cada función, crea un **Custom Tool** con esta estructura:

---

### ✅ Función 1: `verificar_disponibilidad`

**Configuración:**
- **Name:** `verificar_disponibilidad`
- **Description:** "Verifica disponibilidad de mesas para fecha, hora y personas"
- **URL:** `https://zeorvi.com/api/retell/functions/rest_003`
- **Method:** `POST`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body Template:**
```json
{
  "function_name": "verificar_disponibilidad",
  "parameters": {
    "fecha": "{{fecha}}",
    "hora": "{{hora}}",
    "personas": {{personas}},
    "zona": "{{zona}}"
  }
}
```

**Parameters Schema:**
```json
{
  "type": "object",
  "properties": {
    "fecha": {
      "type": "string",
      "description": "Fecha en formato YYYY-MM-DD o 'mañana'"
    },
    "hora": {
      "type": "string",
      "description": "Hora en formato HH:MM (24h), ej: 20:00"
    },
    "personas": {
      "type": "integer",
      "description": "Número de personas"
    },
    "zona": {
      "type": "string",
      "description": "Zona preferida (opcional)"
    }
  },
  "required": ["fecha", "hora", "personas"]
}
```

---

### ✅ Función 2: `crear_reserva`

**Configuración:**
- **Name:** `crear_reserva`
- **Description:** "Crea una nueva reserva con los datos del cliente"
- **URL:** `https://zeorvi.com/api/retell/functions/rest_003`
- **Method:** `POST`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body Template:**
```json
{
  "function_name": "crear_reserva",
  "parameters": {
    "fecha": "{{fecha}}",
    "hora": "{{hora}}",
    "personas": {{personas}},
    "cliente": "{{cliente}}",
    "telefono": "{{telefono}}",
    "turno": "Cena",
    "zona": "",
    "mesa": "",
    "notas": "{{notas}}"
  }
}
```

**Parameters Schema:**
```json
{
  "type": "object",
  "properties": {
    "fecha": {
      "type": "string",
      "description": "Fecha en formato YYYY-MM-DD"
    },
    "hora": {
      "type": "string",
      "description": "Hora en formato HH:MM"
    },
    "personas": {
      "type": "integer",
      "description": "Número de personas"
    },
    "cliente": {
      "type": "string",
      "description": "Nombre completo del cliente"
    },
    "telefono": {
      "type": "string",
      "description": "Teléfono del cliente - usa {{call.from_number}}"
    },
    "notas": {
      "type": "string",
      "description": "Notas, alergias o preferencias"
    }
  },
  "required": ["fecha", "hora", "personas", "cliente", "telefono"]
}
```

---

### ✅ Función 3: `modificar_reserva`

**Configuración:**
- **Name:** `modificar_reserva`
- **Description:** "Modifica una reserva existente del cliente"
- **URL:** `https://zeorvi.com/api/retell/functions/rest_003`
- **Method:** `POST`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body Template:**
```json
{
  "function_name": "modificar_reserva",
  "parameters": {
    "cliente": "{{cliente}}",
    "telefono": "{{telefono}}",
    "nueva_fecha": "{{nueva_fecha}}",
    "nueva_hora": "{{nueva_hora}}",
    "nuevas_personas": {{nuevas_personas}}
  }
}
```

**Parameters Schema:**
```json
{
  "type": "object",
  "properties": {
    "cliente": {
      "type": "string",
      "description": "Nombre del cliente"
    },
    "telefono": {
      "type": "string",
      "description": "Teléfono del cliente - usa {{call.from_number}}"
    },
    "nueva_fecha": {
      "type": "string",
      "description": "Nueva fecha YYYY-MM-DD (opcional)"
    },
    "nueva_hora": {
      "type": "string",
      "description": "Nueva hora HH:MM (opcional)"
    },
    "nuevas_personas": {
      "type": "integer",
      "description": "Nuevo número de personas (opcional)"
    }
  },
  "required": ["cliente", "telefono"]
}
```

---

### ✅ Función 4: `cancelar_reserva`

**Configuración:**
- **Name:** `cancelar_reserva`
- **Description:** "Cancela la reserva de un cliente"
- **URL:** `https://zeorvi.com/api/retell/functions/rest_003`
- **Method:** `POST`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body Template:**
```json
{
  "function_name": "cancelar_reserva",
  "parameters": {
    "cliente": "{{cliente}}",
    "telefono": "{{telefono}}"
  }
}
```

**Parameters Schema:**
```json
{
  "type": "object",
  "properties": {
    "cliente": {
      "type": "string",
      "description": "Nombre del cliente"
    },
    "telefono": {
      "type": "string",
      "description": "Teléfono del cliente - usa {{call.from_number}}"
    }
  },
  "required": ["cliente", "telefono"]
}
```

---

### ✅ Función 5: `buscar_reserva`

**Configuración:**
- **Name:** `buscar_reserva`
- **Description:** "Busca las reservas activas de un cliente"
- **URL:** `https://zeorvi.com/api/retell/functions/rest_003`
- **Method:** `POST`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body Template:**
```json
{
  "function_name": "buscar_reserva",
  "parameters": {
    "cliente": "{{cliente}}",
    "telefono": "{{telefono}}"
  }
}
```

**Parameters Schema:**
```json
{
  "type": "object",
  "properties": {
    "cliente": {
      "type": "string",
      "description": "Nombre del cliente"
    },
    "telefono": {
      "type": "string",
      "description": "Teléfono del cliente - usa {{call.from_number}}"
    }
  },
  "required": ["cliente", "telefono"]
}
```

---

## 🔍 VERIFICAR QUE FUNCIONA

### Prueba manual del endpoint:

```bash
curl -X POST https://zeorvi.com/api/retell/functions/rest_003 \
  -H "Content-Type: application/json" \
  -d '{
    "function_name": "verificar_disponibilidad",
    "parameters": {
      "fecha": "2025-10-15",
      "hora": "20:00",
      "personas": 2
    }
  }'
```

**Deberías recibir:**
```json
{
  "success": true,
  "function_name": "verificar_disponibilidad",
  "restaurantId": "rest_003",
  "result": {
    "disponible": true,
    "mesa": "M1",
    "mensaje": "..."
  }
}
```

---

## ⚠️ IMPORTANTE: Variables de Retell

En el **Request Body Template**, usa estas variables de Retell:

- `{{call.from_number}}` - Número del que llama
- `{{call.to_number}}` - Número al que llama
- `{{parametro}}` - Cualquier parámetro que defines en el schema

**Ejemplo para teléfono:**
```json
"telefono": "{{call.from_number}}"
```

NO uses:
- ❌ `{{caller_phone_number}}` 
- ❌ `{{phone}}`

USA:
- ✅ `{{call.from_number}}`

---

## 📸 CAPTURA DE PANTALLA DE REFERENCIA

En Retell Dashboard debería verse así:

```
┌─────────────────────────────────────────┐
│ Custom Tool Configuration               │
├─────────────────────────────────────────┤
│ Name: verificar_disponibilidad          │
│ Description: Verifica disponibilidad... │
│                                         │
│ HTTP Method: POST                       │
│ URL: https://zeorvi.com/api/retell/... │
│                                         │
│ Request Body Template:                  │
│ {                                       │
│   "function_name": "verificar_...",    │
│   "parameters": {                       │
│     "fecha": "{{fecha}}",              │
│     "hora": "{{hora}}",                │
│     "personas": {{personas}}           │
│   }                                     │
│ }                                       │
│                                         │
│ Parameters:                             │
│ - fecha (string, required)              │
│ - hora (string, required)               │
│ - personas (integer, required)          │
└─────────────────────────────────────────┘
```

---

## ✅ CHECKLIST

- [ ] Crear tool `verificar_disponibilidad`
- [ ] Crear tool `crear_reserva`
- [ ] Crear tool `modificar_reserva`
- [ ] Crear tool `cancelar_reserva`
- [ ] Crear tool `buscar_reserva`
- [ ] Verificar que el Request Body Template está correcto
- [ ] Usar `{{call.from_number}}` para el teléfono
- [ ] Probar con curl el endpoint
- [ ] Hacer una llamada de prueba a Retell

---

## 🐛 SI SIGUE DANDO ERROR 400

1. **Ve a los logs de Retell** para ver qué está enviando exactamente
2. **Revisa los logs de tu servidor** (Vercel) para ver qué recibe
3. **Verifica** que el Content-Type sea `application/json`
4. **Asegúrate** de que los parámetros numéricos NO tengan comillas:
   - ✅ Correcto: `"personas": {{personas}}`
   - ❌ Incorrecto: `"personas": "{{personas}}"`

