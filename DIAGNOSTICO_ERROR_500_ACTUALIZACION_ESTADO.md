# Diagnóstico: Error 500 al Actualizar Estado de Reserva

## Problema
Al intentar cambiar el estado de una reserva desde el dashboard, se recibe un error 500.

## Cambios Realizados

### 1. Mejoras en el Logging
- ✅ Agregado logging detallado en `/api/google-sheets/update-reservation-status`
- ✅ Agregado logging detallado en `GoogleSheetsService.updateReservationStatus()`
- ✅ Mejora en manejo de errores con mensajes específicos

### 2. Corrección de Mapeo de Estados
**Antes:**
```typescript
const statusMapping: Record<string, string> = {
  'reserved': 'confirmada',  // ❌ No coincidía con el frontend
  'occupied': 'ocupada',
  // ...
};
```

**Después:**
```typescript
const statusMapping: Record<string, string> = {
  'confirmed': 'confirmada',  // ✅ Coincide con el frontend
  'reserved': 'confirmada',   // Por compatibilidad
  'occupied': 'ocupada',
  'completed': 'completada',
  'cancelled': 'cancelada'
};
```

### 3. Manejo Seguro de SpreadsheetId
```typescript
// Antes: await getSpreadsheetId() - pero la función es sincrónica
// Ahora: try-catch apropiado
let spreadsheetId: string;
try {
  spreadsheetId = getSpreadsheetId(restaurantId);
} catch (error) {
  return { success: false, error: `No se encontró configuración...` };
}
```

### 4. Mejoras en UI
- ✅ Toast notifications con errores específicos
- ✅ Toast de éxito al actualizar correctamente
- ✅ Mejor manejo de respuestas JSON/Text

## Cómo Diagnosticar

### Paso 1: Verificar Logs del Servidor
Cuando ejecutes el dashboard y cambies el estado, busca en los logs:

```
📥 Datos recibidos en update-reservation-status: { restaurantId, reservationId, newStatus, fecha }
📋 Estado recibido: confirmed -> Mapeado a Google Sheets: confirmada
🔄 [updateReservationStatus] Iniciando actualización con parámetros: {...}
📊 [updateReservationStatus] SpreadsheetId obtenido: 115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4
```

### Paso 2: Usar Script de Prueba
```bash
# Primero, edita test-update-status.js con un ID de reserva real
node test-update-status.js
```

### Paso 3: Verificar Estructura de Google Sheets
La hoja "Reservas" debe tener estas columnas:
- A = ID
- B = Fecha
- C = Hora
- D = Turno
- E = Cliente
- F = Teléfono
- G = Personas
- H = Zona
- I = Mesa
- J = Estado

### Paso 4: Verificar restaurantId
El componente debe recibir `restaurantId="rest_003"` para La Gaviota.

Verifica en `src/lib/restaurantSheets.ts`:
```typescript
export const RESTAURANT_SHEETS = {
  rest_003: {
    name: "La Gaviota",
    spreadsheetId: "115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4",
  },
};
```

## Posibles Causas del Error 500

### 1. RestaurantId Incorrecto
Si el `restaurantId` no es `rest_003`, la función `getSpreadsheetId()` lanzará un error.

**Solución:** Verificar que el componente recibe el `restaurantId` correcto.

### 2. Reserva No Encontrada
Si el ID de la reserva o la fecha no coinciden exactamente con los datos en Google Sheets.

**Logs a buscar:**
```
🔍 Fila X: ID="...", Fecha="...", Cliente="..."
❌ Error: Reserva no encontrada
```

**Solución:** 
- Verificar que el ID en Google Sheets coincida exactamente
- Verificar que la fecha tenga el formato correcto (YYYY-MM-DD)

### 3. Error de Credenciales de Google Sheets
Si las credenciales no son válidas o han expirado.

**Logs a buscar:**
```
❌ [updateReservationStatus] Error actualizando estado de reserva: Error: ...
```

### 4. Columna de Estado Incorrecta
Si la estructura de columnas en Google Sheets no coincide.

**Solución:** Verificar que la columna J contenga el estado.

## Próximos Pasos

1. **Ejecutar la aplicación** y observar los logs del servidor
2. **Intentar cambiar el estado** de una reserva
3. **Copiar los logs completos** que aparezcan en la consola del servidor
4. **Revisar el mensaje de error** que aparece en el toast notification
5. **Ejecutar el script de prueba** para aislar el problema

## Información Adicional

### Formato de Estados

**Frontend → API:**
- `confirmed` → `confirmada`
- `occupied` → `ocupada`
- `completed` → `completada`
- `cancelled` → `cancelada`

### Logs Mejorados

Ahora todos los errores incluyen:
- 📥 Datos recibidos
- 📋 Mapeo de estados
- 🔄 Inicio de actualización
- 📊 SpreadsheetId obtenido
- 🔍 Búsqueda de reserva
- ✅/❌ Resultado final

### Script de Prueba

El archivo `test-update-status.js` permite probar la API directamente:

```javascript
const testData = {
  restaurantId: 'rest_003',
  reservationId: 'RES-XXXXX',  // ← Ajustar con ID real
  newStatus: 'confirmed',
  fecha: '2025-10-15'
};
```

