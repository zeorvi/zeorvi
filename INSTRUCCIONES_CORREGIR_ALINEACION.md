# 🔧 Instrucciones para Corregir Alineación de Reservas

## Problema Solucionado

Las reservas se estaban insertando desplazadas en Google Sheets, empezando desde la columna **I (Mesa)** en lugar de la columna **A (ID)**.

## Cambios Implementados

### 1. Modificación en `src/lib/googleSheetsService.ts`

**Antes:**
```typescript
await sheets.spreadsheets.values.append({
  spreadsheetId: sheetId,
  range: "Reservas!A:L",
  valueInputOption: "USER_ENTERED",
  requestBody: { values: [[...datos]] }
});
```

**Ahora:**
```typescript
// Calcular la siguiente fila disponible
const existingData = await sheets.spreadsheets.values.get({
  spreadsheetId: sheetId,
  range: "Reservas!A:A",
});

const nextRow = (existingData.data.values?.length || 1) + 1;

// Usar UPDATE en lugar de APPEND para garantizar posición exacta
await sheets.spreadsheets.values.update({
  spreadsheetId: sheetId,
  range: `Reservas!A${nextRow}:L${nextRow}`,
  valueInputOption: "USER_ENTERED",
  requestBody: { values: [[...datos]] }
});
```

### 2. Nuevos Endpoints Creados

#### `/api/google-sheets/fix-alignment` (POST)
Corrige las reservas existentes que están desalineadas.

**Parámetros:**
- `restaurantId`: ID del restaurante (default: `rest_003`)
- `dryRun`: Si es `true`, solo detecta sin corregir (default: `false`)

#### `/api/google-sheets/debug-structure` (GET)
Muestra la estructura de Google Sheets para debugging.

**Parámetros:**
- `restaurantId`: ID del restaurante (default: `rest_003`)

## Cómo Ejecutar la Corrección

### Opción 1: Script Automático (Recomendado)

Espera a que el deploy de Vercel termine (revisa https://vercel.com/dashboard) y luego ejecuta:

```bash
node fix-reservas-produccion.js
```

Este script:
1. ✅ Analiza las reservas actuales
2. ✅ Detecta filas desalineadas
3. ✅ Corrige las filas automáticamente
4. ✅ Verifica que todo esté correcto
5. ✅ Crea una reserva de prueba
6. ✅ Verifica que la nueva reserva se insertó correctamente

### Opción 2: Manual con cURL/PowerShell

#### Paso 1: Detectar filas desalineadas (Dry Run)

```bash
curl -X POST "https://restaurante-ai-platform.vercel.app/api/google-sheets/fix-alignment?restaurantId=rest_003&dryRun=true"
```

O en PowerShell:
```powershell
Invoke-WebRequest -Method POST -Uri "https://restaurante-ai-platform.vercel.app/api/google-sheets/fix-alignment?restaurantId=rest_003&dryRun=true" | Select-Object -ExpandProperty Content
```

#### Paso 2: Corregir las filas

```bash
curl -X POST "https://restaurante-ai-platform.vercel.app/api/google-sheets/fix-alignment?restaurantId=rest_003"
```

O en PowerShell:
```powershell
Invoke-WebRequest -Method POST -Uri "https://restaurante-ai-platform.vercel.app/api/google-sheets/fix-alignment?restaurantId=rest_003" | Select-Object -ExpandProperty Content
```

#### Paso 3: Verificar las reservas

```bash
curl "https://restaurante-ai-platform.vercel.app/api/google-sheets/reservas?restaurantId=rest_003"
```

O en PowerShell:
```powershell
Invoke-WebRequest -Uri "https://restaurante-ai-platform.vercel.app/api/google-sheets/reservas?restaurantId=rest_003" | Select-Object -ExpandProperty Content
```

## Cómo Verificar que Está Funcionando

### En Google Sheets

1. Abre tu Google Sheet: https://docs.google.com/spreadsheets/d/115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4/edit

2. Ve a la pestaña **"Reservas"**

3. Verifica que los encabezados son:
   ```
   A: ID | B: Fecha | C: Hora | D: Turno | E: Cliente | F: Teléfono 
   G: Personas | H: Zona | I: Mesa | J: Estado | K: Notas | L: Creado
   ```

4. Verifica que todas las reservas tienen datos empezando desde la columna A (no desde I)

### Creando una Reserva de Prueba por Voz

1. Llama al agente de voz
2. Crea una reserva
3. Verifica en Google Sheets que la reserva se insertó correctamente en las columnas A-L

## Qué Hace el Fix de Alineación

El endpoint `/api/google-sheets/fix-alignment`:

1. **Lee todas las reservas** del rango `A2:Z`
2. **Identifica filas desalineadas** donde:
   - La columna A (ID) está vacía
   - La columna I tiene un valor que empieza con "R" (indicando que es un ID)
3. **Mueve los datos** de las columnas I-T a A-L:
   - I → A (ID)
   - J → B (Fecha)
   - K → C (Hora)
   - L → D (Turno)
   - M → E (Cliente)
   - N → F (Teléfono)
   - O → G (Personas)
   - P → H (Zona)
   - Q → I (Mesa)
   - R → J (Estado)
   - S → K (Notas)
   - T → L (Creado)
4. **Limpia las columnas viejas** (M-T) para evitar duplicados

## Troubleshooting

### "The deployment could not be found on Vercel"
**Solución:** El deploy aún está procesándose. Espera 2-5 minutos y vuelve a intentar.

### "No se encontraron filas desalineadas"
**Solución:** ¡Perfecto! Significa que ya no hay problemas o ya fueron corregidos.

### "La reserva de prueba no se encuentra"
**Solución:** Puede ser un problema de caché. Espera 10-15 segundos y verifica directamente en Google Sheets.

## Contacto

Si hay algún problema o duda, revisa los logs en:
- Vercel Dashboard: https://vercel.com/dashboard
- Google Sheets: https://docs.google.com/spreadsheets/d/115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4/edit

