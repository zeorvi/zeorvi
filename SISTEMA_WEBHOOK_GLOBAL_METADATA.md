# Sistema de Webhook Global con Metadata - Solución Recomendada por ChatGPT

## 🎯 Problema Resuelto

ChatGPT identificó que el problema principal era que **el agent_id no codificaba el restaurante como esperaba el backend**. La solución recomendada es mantener un **webhook global** pero usar `metadata.restaurantId` para identificar restaurantes.

## ✅ Solución Implementada

### 1. **Webhook Global Único**
```
/api/retell/webhook
```
- Un solo endpoint para todos los restaurantes
- Escalable para 100+ restaurantes sin cambios en el backend
- Identificación de restaurante mediante `metadata.restaurantId`

### 2. **Sistema de Identificación por Prioridades**
```javascript
function getRestaurantFromBody(body) {
  // Prioridad 1: metadata.restaurantId (recomendado)
  const metaId = body?.metadata?.restaurantId || body?.data?.metadata?.restaurantId;
  if (metaId) return metaId;

  // Prioridad 2: patrón en agent_id (fallback)
  const match = agentId.match(/rest_([a-zA-Z0-9_]+)_agent/);
  if (match) return `rest_${match[1]}`;

  // Prioridad 3: mapeo directo (compatibilidad)
  const directMapping = {
    'agent_2082fc7a622cdbd22441b22060': 'rest_003',
    'agent_elbuensabor_001': 'rest_004'
  };
  return directMapping[agentId] || null;
}
```

### 3. **Sistema de Mapeo de Google Sheets**
```javascript
// src/lib/restaurantSheets.ts
export const RESTAURANT_SHEETS = {
  'rest_003': {
    spreadsheetId: process.env.LA_GAVIOTA_SHEET_ID,
    sheetName: 'Reservas',
    description: 'La Gaviota'
  },
  'rest_004': {
    spreadsheetId: process.env.EL_BUEN_SABOR_SHEET_ID,
    sheetName: 'Reservas',
    description: 'El Buen Sabor'
  }
};
```

## 🚀 Cómo Configurar

### Paso 1: Variables de Entorno (Vercel)

```bash
# Retell AI
RETELL_API_KEY=tu_api_key_de_retell
RETELL_WEBHOOK_SECRET=tu_webhook_secret_de_retell
NEXT_PUBLIC_BASE_URL=https://tu-dominio.com

# Google Sheets (uno por restaurante)
LA_GAVIOTA_SHEET_ID=1AbC1234567890xyz
EL_BUEN_SABOR_SHEET_ID=1DeF0987654321uvw
GOOGLE_SHEETS_ID=1DefaultSheetIdForFallback

# Google API
GOOGLE_PROJECT_ID=tu_project_id
GOOGLE_CLIENT_EMAIL=tu_service_account_email
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Paso 2: Configurar en Retell AI Console

1. **Function Calling URL:**
   ```
   https://tu-dominio.com/api/retell/functions
   ```

2. **Webhook URL:**
   ```
   https://tu-dominio.com/api/retell/webhook
   ```

3. **En cada Agente, agregar metadata:**
   ```json
   {
     "metadata": {
       "restaurantId": "rest_003"
     }
   }
   ```

### Paso 3: Configurar Google Sheets

Para cada restaurante, crear un Google Sheet con:
- **ID del Sheet**: Configurar en variables de entorno
- **Hoja "Reservas"** con columnas:
  ```
  Fecha | Hora | Horario | Cliente | Teléfono | Personas | Mesa | Estado
  ```

## 📋 URLs de Configuración

| Restaurante | Restaurant ID | Metadata | Google Sheet ID |
|-------------|---------------|----------|-----------------|
| La Gaviota | rest_003 | `{"restaurantId": "rest_003"}` | `LA_GAVIOTA_SHEET_ID` |
| El Buen Sabor | rest_004 | `{"restaurantId": "rest_004"}` | `EL_BUEN_SABOR_SHEET_ID` |

## 🔧 API Endpoints

### Webhook Global
- `POST /api/retell/webhook` - Webhook único para todos los restaurantes

### Funciones Retell
- `POST /api/retell/functions` - Funciones de Retell AI

### Google Sheets
- `GET /api/google-sheets/reservas?restaurantId=rest_003&spreadsheetId=...` - Reservas específicas

## 🧪 Pruebas

### Script de Prueba Automatizado
```bash
node scripts/test-global-webhook-system.js
```

### Prueba Manual de Webhook
```bash
curl -X POST https://tu-dominio.com/api/retell/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "call_started",
    "agent_id": "agent_2082fc7a622cdbd22441b22060",
    "call_id": "test_123",
    "metadata": {"restaurantId": "rest_003"},
    "data": {"caller_number": "+34 666 123 456"}
  }'
```

### Prueba Manual de Funciones
```bash
curl -X POST https://tu-dominio.com/api/retell/functions \
  -H "Content-Type: application/json" \
  -d '{
    "function_name": "crear_reserva",
    "parameters": {
      "fecha": "2024-01-20",
      "hora": "20:00",
      "cliente": "María García",
      "telefono": "+34 666 123 456",
      "personas": 4
    },
    "agent_id": "agent_2082fc7a622cdbd22441b22060",
    "metadata": {"restaurantId": "rest_003"}
  }'
```

## 📊 Monitoreo

### Logs Mejorados
Los logs ahora incluyen información específica del restaurante:
```
Restaurante identificado - restaurantId: rest_003, agent_id: agent_2082fc7a622cdbd22441b22060, method: metadata
```

### Dashboard
El dashboard sigue funcionando igual:
- `https://tu-dominio.com/dashboard/rest_003`
- `https://tu-dominio.com/dashboard/rest_004`

## 🔄 Migración desde Sistema Anterior

### Para Restaurantes Existentes
1. **Sin cambios**: Los agentes existentes siguen funcionando (mapeo directo)
2. **Recomendado**: Agregar `metadata.restaurantId` en Retell AI
3. **Opcional**: Migrar gradualmente a metadata

### Para Nuevos Restaurantes
1. **Siempre usar**: `metadata.restaurantId` en la configuración del agente
2. **Configurar**: Google Sheet ID en variables de entorno
3. **Probar**: Con el script de prueba antes de producción

## 🚨 Consideraciones Importantes

### Seguridad
- ✅ Un solo webhook URL (más seguro)
- ✅ Identificación por metadata (flexible)
- ✅ Logs específicos por restaurante

### Escalabilidad
- ✅ Fácil agregar nuevos restaurantes
- ✅ Sin cambios en el backend
- ✅ Configuración centralizada

### Compatibilidad
- ✅ Sistema backward compatible
- ✅ Mapeo directo para agentes existentes
- ✅ Migración gradual sin interrupciones

## 📞 Soporte

Si tienes problemas:

1. **Verificar metadata**: Confirma que `metadata.restaurantId` está configurado en Retell AI
2. **Verificar URLs**: Confirma que las URLs apuntan a tu dominio (no localhost)
3. **Verificar Sheets**: Confirma que los Google Sheets IDs están configurados
4. **Ejecutar pruebas**: Usa el script de prueba para diagnosticar
5. **Revisar logs**: Los logs muestran qué método de identificación se usó

## 🎉 Beneficios de la Solución

✅ **Webhook global único** (más eficiente)  
✅ **Identificación por metadata** (más flexible)  
✅ **Sistema de mapeo de Google Sheets** (escalable)  
✅ **Compatibilidad legacy** (sin interrupciones)  
✅ **Logs mejorados** (mejor debugging)  
✅ **Scripts de prueba** (fácil validación)  
✅ **Escalabilidad para 100+ restaurantes** (futuro-proof)

## 🚀 Próximos Pasos

1. **Configurar variables de entorno** en Vercel
2. **Actualizar configuración** en Retell AI Console
3. **Agregar metadata.restaurantId** a cada agente
4. **Configurar Google Sheets** para cada restaurante
5. **Ejecutar pruebas** con el script automatizado
6. **Probar con llamadas reales**
7. **Monitorear logs** para verificar funcionamiento

Esta solución es la recomendada por ChatGPT y resuelve todos los problemas identificados de manera elegante y escalable.
