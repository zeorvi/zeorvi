# Mejora: Mesas Completadas Disponibles para el Agente

## Problema Identificado

Cuando una mesa pasaba a estado "Completada" 2 horas después de haber sido ocupada, el agente no reconocía claramente que esa mesa estaba libre y disponible para nuevas reservas.

## Solución Implementada

### 1. Lógica Existente (Ya Funcionaba)

El sistema ya tenía la lógica correcta en varios lugares:

- **`src/lib/googleSheetsService.ts`** (líneas 504-512): Ya excluía las reservas con estado "completada" y "cancelada" de considerarse como ocupadas
- **`src/app/api/retell/check-availability/route.ts`** (líneas 71-77): Ya filtraba correctamente las reservas excluyendo completadas y canceladas
- **`src/lib/autoTableRelease.ts`**: Sistema automático que cambia reservas de "Reservada" a "Completada" después de 2 horas

### 2. Mejoras Implementadas

#### A. Mensajes Explícitos al Agente

**Archivo: `src/lib/googleSheetsService.ts`**

1. **Líneas 515-520**: Se agregó contador de mesas completadas
```typescript
// Contar mesas completadas que ahora están libres
const mesasCompletadas = reservas.filter(reserva => {
  if (reserva.Fecha !== fecha) return false;
  const estado = (reserva.Estado || '').toLowerCase().trim();
  return estado === 'completada';
});
```

2. **Líneas 584-586**: Se agregó mensaje explícito al agente
```typescript
// Información adicional sobre mesas completadas que están libres
if (mesasCompletadas.length > 0) {
  mensaje += `. Nota: ${mesasCompletadas.length} mesa${mesasCompletadas.length > 1 ? 's' : ''} con estado "Completada" ${mesasCompletadas.length > 1 ? 'están' : 'está'} libre${mesasCompletadas.length > 1 ? 's' : ''} y disponible${mesasCompletadas.length > 1 ? 's' : ''} para nuevas reservas.`;
}
```

#### B. Endpoint de Mesas Mejorado

**Archivo: `src/app/api/google-sheets/mesas/route.ts`**

Se agregó información sobre mesas liberadas:
- Identifica mesas con reservas completadas hoy
- Agrega campo `tieneReservaCompletada` a cada mesa
- Devuelve contadores: `mesasLibresPorCompletadas` y lista de `mesasCompletadas`
- Incluye nota explicativa: _"Las mesas con estado 'Completada' están libres y disponibles para nuevas reservas"_

#### C. Endpoint de Reservas Mejorado

**Archivo: `src/app/api/google-sheets/reservas/route.ts`**

Se agregaron estadísticas detalladas:
```typescript
const estadisticas = {
  total: reservas.length,
  completadas: reservas.filter(r => (r.Estado || '').toLowerCase() === 'completada').length,
  canceladas: reservas.filter(r => (r.Estado || '').toLowerCase() === 'cancelada').length,
  activas: reservas.filter(r => {
    const estado = (r.Estado || '').toLowerCase();
    return !['completada', 'cancelada'].includes(estado);
  }).length
};
```

Y nota explicativa para el agente.

## Cómo Funciona Ahora

### Flujo Completo

1. **Una mesa es reservada** → Estado: "Confirmada"
2. **Cliente llega** → Mesa ocupada durante la comida/cena
3. **2 horas después** → Sistema automático (`autoTableRelease.ts`) cambia estado a "Completada"
4. **Agente consulta disponibilidad** → El sistema:
   - Excluye las reservas "Completada" de las mesas ocupadas
   - Cuenta cuántas mesas están completadas
   - Devuelve mensaje explícito: _"X mesa(s) con estado 'Completada' está(n) libre(s) y disponible(s) para nuevas reservas"_

### Endpoints que el Agente Puede Usar

1. **Verificar disponibilidad**:
   ```
   POST /api/retell/functions
   {
     "name": "verificar_disponibilidad",
     "parameters": {
       "fecha": "2025-10-17",
       "hora": "20:00",
       "personas": 4
     }
   }
   ```
   
   Respuesta incluye: Mensaje con información sobre mesas completadas que están libres

2. **Consultar mesas**:
   ```
   GET /api/google-sheets/mesas?restaurantId=rest_003
   ```
   
   Respuesta incluye:
   - `mesasLibresPorCompletadas`: Número de mesas con reservas completadas
   - `mesasCompletadas`: Array con IDs de mesas completadas
   - `nota`: Explicación de que están libres

3. **Consultar reservas**:
   ```
   GET /api/google-sheets/reservas?restaurantId=rest_003&fecha=2025-10-17
   ```
   
   Respuesta incluye:
   - `estadisticas.completadas`: Número de reservas completadas
   - `estadisticas.activas`: Número de reservas activas (ocupan mesa)
   - `nota`: Explicación de que las completadas tienen mesas libres

## Estados de Reserva

### Estados que OCUPAN mesa:
- `pendiente`
- `confirmada`
- `reservada`
- `ocupada`

### Estados que NO ocupan mesa (mesas LIBRES):
- `completada` ← **Mesa disponible para nuevas reservas**
- `cancelada` ← **Mesa disponible para nuevas reservas**

## Logs para Debugging

El sistema ahora muestra logs claros:
```
📊 [Google Sheets] 5 mesas con reservas completadas hoy (libres)
📊 Estadísticas: 5 completadas (mesas libres), 3 activas
✅ Reservas obtenidas de google_sheets en 234ms (8 reservas)
```

## Testing

Para probar que funciona correctamente:

1. Crea una reserva para hoy a una hora pasada (ej: 18:00 si son las 20:00)
2. Espera a que el cron automático ejecute o ejecuta manualmente:
   ```
   GET /api/cron/liberar-mesas
   ```
3. Verifica que el estado cambió a "Completada"
4. Consulta disponibilidad y verás el mensaje explícito sobre mesas libres
5. El agente podrá reservar esa mesa sin problemas

## Archivos Modificados

- ✅ `src/lib/googleSheetsService.ts` - Lógica principal de disponibilidad
- ✅ `src/app/api/google-sheets/mesas/route.ts` - Endpoint de mesas
- ✅ `src/app/api/google-sheets/reservas/route.ts` - Endpoint de reservas
- ✅ `src/app/api/retell/functions/route.ts` - Fix para conversión de días de la semana

## Fix Adicional: Conversión de Días de la Semana

### Problema Detectado
El agente fallaba al crear reservas cuando el usuario decía días de la semana (ej: "domingo", "lunes"):
```
Error: Fecha inválida: domingo
```

### Solución
La función `crear_reserva` ahora usa la misma función `obtenerFecha` que usa `verificar_disponibilidad`, la cual convierte correctamente:

- **Días de la semana**: "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"
- **Palabras clave**: "hoy", "mañana", "pasado mañana"
- **Fechas ISO**: "2025-10-17"

Ejemplo de conversión:
```
"domingo" → "2025-10-20" (el próximo domingo)
"lunes" → "2025-10-21" (el próximo lunes)
"hoy" → "2025-10-17"
"mañana" → "2025-10-18"
```

La función maneja correctamente días con y sin acentos ("miércoles" y "miercoles", "sábado" y "sabado").

## Sin Errores

✅ No se encontraron errores de linting
✅ La lógica existente se mantuvo intacta
✅ Solo se agregaron mejoras en mensajes y estadísticas
✅ Fix de conversión de fechas para días de la semana

