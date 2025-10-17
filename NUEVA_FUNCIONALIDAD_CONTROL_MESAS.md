# 🪑 Nueva Funcionalidad: Control de Mesas Manual

## Descripción

Ahora cuando el encargado pulsa en "Ocupar" o "Reservar" una mesa desde el control de mesas:

1. **Se abre un modal** solicitando datos del cliente
2. **Se crea automáticamente una reserva** en Google Sheets
3. **La mesa cambia de color** inmediatamente
4. **Se libera automáticamente** después de 2 horas

## Funcionalidades Implementadas

### ✅ Modal de Captura de Datos

Cuando el encargado pulsa "Ocupar" o "Reservar", aparece un formulario con:

- **Nombre del Cliente** (obligatorio)
- **Teléfono** (opcional)
- **Número de Personas** (obligatorio, máximo = capacidad de la mesa)
- **Notas** (opcional)
- **Información**: Mensaje indicando que se liberará automáticamente en 2 horas

### ✅ Creación Automática en Google Sheets

Al confirmar el formulario, se crea una reserva con:

- **Fecha**: Fecha actual
- **Hora**: Hora actual
- **Turno**: Automático según la hora (Desayuno, Comida, Cena)
- **Cliente**: Nombre ingresado
- **Teléfono**: Teléfono ingresado o "Sin teléfono"
- **Personas**: Cantidad ingresada
- **Zona**: Ubicación de la mesa
- **Mesa**: Nombre de la mesa (ej: M1, M2, etc.)
- **Estado**: 
  - `ocupada` si se pulsó "Ocupar"
  - `reservada` si se pulsó "Reservar"
- **Notas**: Incluye el tipo de acción (Walk-in o Reserva manual) y las notas adicionales
- **Creado**: Timestamp automático

### ✅ Cambio de Color Inmediato

- **Ocupada**: Fondo rojo
- **Reservada**: Fondo amarillo
- **Libre**: Fondo verde

El cambio es **instantáneo** después de confirmar el modal.

### ✅ Liberación Automática en 2 Horas

El sistema de `autoTableRelease.ts` (ya existente) se encarga de:

1. Revisar cada minuto las reservas con estado "ocupada" o "reservada"
2. Calcular si han pasado 2 horas desde la creación
3. Cambiar automáticamente el estado a "Completada"
4. La mesa queda disponible para nuevas reservas

## Archivos Modificados/Creados

### Nuevos Archivos

1. **`src/components/restaurant/OccupyTableDialog.tsx`**
   - Modal para capturar datos del cliente
   - Validaciones de formulario
   - Interfaz amigable con iconos

2. **`src/app/api/restaurant/occupy-table/route.ts`**
   - Endpoint POST para crear reservas desde el control de mesas
   - Maneja tanto "ocupada" como "reservada"
   - Crea la reserva en Google Sheets automáticamente

### Archivos Modificados

3. **`src/components/restaurant/TablePlanNew.tsx`**
   - Integración del modal
   - Lógica para capturar el clic en "Ocupar" y "Reservar"
   - Llamada al endpoint para crear la reserva
   - Actualización del estado local de la mesa
   - Notificaciones con toast

## Cómo Usar

### Para el Encargado:

1. **Ir al Dashboard** → Control de Mesas

2. **Seleccionar una mesa libre**

3. **Pulsar "Ocupar"** (para clientes walk-in) o **"Reservar"** (para reservas manuales)

4. **Completar el formulario**:
   - Nombre del cliente
   - Teléfono (opcional)
   - Número de personas
   - Notas adicionales si es necesario

5. **Pulsar "Ocupar Mesa"**

6. **Resultado**:
   - ✅ La mesa cambia de color inmediatamente
   - ✅ Se muestra una notificación de éxito
   - ✅ Se indica que se liberará en 2 horas
   - ✅ La reserva aparece en Google Sheets

### Para Verificar en Google Sheets:

1. Abrir: https://docs.google.com/spreadsheets/d/115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4/edit

2. Ir a la pestaña **"Reservas"**

3. Buscar la última fila insertada

4. Verificar que todos los datos estén presentes en las columnas A-L

## Diferencias entre "Ocupar" y "Reservar"

### Ocupar (Walk-in)
- **Estado en Google Sheets**: `ocupada`
- **Color**: Rojo
- **Notas**: "Walk-in - ..."
- **Uso**: Para clientes que llegan sin reserva

### Reservar (Manual)
- **Estado en Google Sheets**: `reservada`
- **Color**: Amarillo
- **Notas**: "Reserva manual - ..."
- **Uso**: Para reservas hechas por teléfono o presencialmente

**Ambas se liberan automáticamente en 2 horas.**

## Beneficios

✅ **Sincronización Total**: Todo lo que hace el encargado queda registrado en Google Sheets

✅ **Trazabilidad**: Cada acción tiene timestamp y datos del cliente

✅ **Automatización**: No hay que recordar liberar las mesas manualmente

✅ **Datos Completos**: Se registra cliente, teléfono, personas, notas, etc.

✅ **Integración con IA**: El agente de voz puede ver estas reservas

✅ **Control Visual**: Cambio de color inmediato para saber el estado

## Flujo Técnico

```
1. Encargado pulsa "Ocupar" o "Reservar"
         ↓
2. Se abre modal con formulario
         ↓
3. Encargado completa datos
         ↓
4. Se llama a /api/restaurant/occupy-table
         ↓
5. Endpoint crea reserva en Google Sheets
         ↓
6. Se actualiza estado local de la mesa
         ↓
7. Mesa cambia de color inmediatamente
         ↓
8. Notificación de éxito al encargado
         ↓
9. [2 horas después]
         ↓
10. autoTableRelease.ts cambia estado a "Completada"
         ↓
11. Mesa queda libre para nuevas reservas
```

## Notas Técnicas

- **Formato de fecha**: YYYY-MM-DD (ISO 8601)
- **Formato de hora**: HH:MM (24 horas)
- **Inserción en Google Sheets**: Usa `UPDATE` en lugar de `APPEND` para evitar problemas de alineación
- **Caché**: Se invalida automáticamente después de crear la reserva
- **Validación**: Se verifica disponibilidad antes de crear (aunque al ser manual, tiene menos restricciones)

## Próximos Pasos Sugeridos

1. ✅ **Ya implementado**: Creación automática de reservas
2. ✅ **Ya implementado**: Liberación automática en 2 horas
3. 🔄 **Pendiente**: Editar reserva desde el control de mesas
4. 🔄 **Pendiente**: Liberar manualmente antes de las 2 horas
5. 🔄 **Pendiente**: Ver historial de reservas de una mesa
6. 🔄 **Pendiente**: Notificaciones push cuando una mesa se libera automáticamente

## Troubleshooting

### "Error al crear la reserva"
- Verificar que Google Sheets esté accesible
- Revisar logs en Vercel
- Verificar que el restaurantId sea correcto

### "La mesa no cambia de color"
- Refrescar la página
- Verificar la conexión a internet
- Revisar la consola del navegador para errores

### "No aparece en Google Sheets"
- Verificar que estés en la pestaña "Reservas"
- Hacer scroll hasta el final
- Actualizar Google Sheets (F5)
- Verificar que no haya problemas de permisos

## Contacto

Para más información o soporte, revisar:
- Logs en Vercel Dashboard
- Google Sheets directamente
- Consola del navegador (F12)

