# 🔧 Corrección de Columnas - Google Sheet La Gaviota

## Problema Detectado

El Google Sheet de La Gaviota tiene las columnas **Zona**, **Mesa** y **Estado** en el orden incorrecto.

### Orden Actual (Incorrecto)
```
A: ID
B: Fecha
C: Hora
D: Turno
E: Cliente
F: Teléfono
G: Personas
H: Zona (vacía o incorrecta)
I: confirmada/cancelada/ocupada (ESTADO - pero debería ser MESA)
J: confirmada/completada (Estado duplicado)
K: M1/M2/M3 (MESA - pero debería estar en I)
L: Creado
```

### Orden Correcto Esperado
```
A: ID
B: Fecha
C: Hora
D: Turno
E: Cliente
F: Teléfono
G: Personas
H: Zona
I: Mesa (M1, M2, M3, etc.)
J: Estado (confirmada, cancelada, completada, ocupada)
K: Notas
L: Creado
```

## Solución 1: Corrección Manual en Google Sheets

### Pasos:

1. **Abre el Google Sheet**: https://docs.google.com/spreadsheets/d/115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4/edit

2. **Crea una copia de respaldo**:
   - Archivo > Hacer una copia
   - Guárdala como "La Gaviota - Backup"

3. **Inserta una columna nueva** después de la columna G (Personas):
   - Haz clic derecho en la columna H
   - Selecciona "Insertar 1 columna a la izquierda"
   - Nombra esta nueva columna como "Zona"

4. **Reordena los datos**:
   - Las mesas (M1, M2, M3) que están en la columna K deben moverse a la columna I
   - Los estados (confirmada, cancelada, etc.) que están en la columna I deben moverse a la columna J
   - Agrega valores de Zona en la columna H (por ejemplo: "Sala Principal", "Terraza", etc.)

5. **Verifica los encabezados finales**:
   ```
   H: Zona
   I: Mesa
   J: Estado
   K: Notas
   L: Creado
   ```

## Solución 2: Script Automático (Recomendado)

Ejecuta el script de corrección:

```bash
node fix-lagaviota-columns.js
```

### Pasos del script:

1. **Vista previa**: El script primero mostrará cómo quedarán los datos
2. **Verificación**: Revisa la vista previa antes de aplicar cambios
3. **Aplicar**: Descomenta las líneas de actualización en el código para aplicar

### Importante:
- ⚠️  El script hará una reorganización automática
- ⚠️  Siempre haz un backup antes de ejecutar
- ✅ El script asignará "Sala Principal" como zona por defecto

## Verificación Post-Corrección

Después de corregir, verifica que:

1. ✅ Las mesas (M1, M2, M3) estén en la columna I
2. ✅ Los estados (confirmada, ocupada, etc.) estén en la columna J
3. ✅ Las zonas estén en la columna H
4. ✅ El dashboard carga las reservas correctamente

## Estructura de Ejemplo

| ID | Fecha | Hora | Turno | Cliente | Teléfono | Personas | **Zona** | **Mesa** | **Estado** | Notas | Creado |
|----|-------|------|-------|---------|----------|----------|----------|----------|------------|-------|---------|
| R001 | 2025-10-16 | 20:00 | Cena | Juan Pérez | +34665665665 | 4 | Sala Principal | M1 | confirmada | | 2025-10-15 |
| R002 | 2025-10-16 | 21:00 | Cena | María García | +34677777777 | 2 | Terraza | M5 | ocupada | | 2025-10-15 |

## Soporte

Si tienes problemas con la corrección, contacta al equipo de soporte.

