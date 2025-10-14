# 🚀 Cómo Probar las Mejoras de Rendimiento

## ⚡ Prueba Rápida (2 minutos)

### 1. Inicia el servidor

```bash
npm run dev
```

### 2. Abre el dashboard

Ve a: `http://localhost:3000/dashboard`

### 3. Observa la velocidad

1. **Primera carga**: Tardará 2-3 segundos (normal, va a Google Sheets)
2. **Navega entre pestañas**: Agenda → Calendario → Mesas
3. **Observa**: ¡Debería ser instantáneo! (~50-100ms)

### 4. Prueba el botón de actualizar

- Click en el botón 🔄 "Actualizar" (arriba a la derecha)
- Verás la notificación "Datos actualizados"
- Los datos se recargan desde Google Sheets

## 🧪 Prueba Completa con Script (5 minutos)

### 1. Terminal 1 - Servidor

```bash
npm run dev
```

### 2. Terminal 2 - Script de prueba

```bash
node test-cache-performance.js
```

**El script mostrará**:
```
🧪 PRUEBA DE RENDIMIENTO DEL CACHÉ DE GOOGLE SHEETS

📊 TEST 1: Primera carga (Cache Miss)
✓ Duración: 2458ms
✓ Reservas obtenidas: 15

📊 TEST 2: Segunda carga (Cache Hit)
✓ Duración: 87ms
✓ Reservas obtenidas: 15

🚀 Mejora de rendimiento: 96.5%

📊 TEST 3: Requests paralelas (Deduplicación)
✓ 5 requests paralelas completadas en: 2521ms
✓ Duración promedio por request: 504ms

📊 TEST 4: Estadísticas del Caché
✓ Tamaño del caché: 1 items
✓ Keys en caché:
  - reservas:rest_001

✅ Todas las pruebas completadas exitosamente!
```

## 📊 Verificar Logs del Caché

En la consola del servidor verás:

```
❌ [Cache] MISS para: reservas:rest_001 - Fetching...
📊 [Google Sheets] Fetching reservas para rest_001...
✅ [Google Sheets] 15 reservas obtenidas
💾 [Cache] Guardado: reservas:rest_001 (TTL: 30s)

✅ [Cache] HIT para: reservas:rest_001 (edad: 5s)

🔄 [Cache] Deduplicando request para: reservas:rest_001
```

## 🔍 Monitorear el Caché

### Ver estadísticas en tiempo real

```bash
curl http://localhost:3000/api/cache/invalidate | jq
```

**Salida**:
```json
{
  "success": true,
  "stats": {
    "cacheSize": 1,
    "pendingRequests": 0,
    "keys": [
      "reservas:rest_001"
    ]
  }
}
```

### Invalidar caché manualmente

```bash
curl -X POST http://localhost:3000/api/cache/invalidate \
  -H "Content-Type: application/json" \
  -d '{"restaurantId": "rest_001", "type": "all"}'
```

## 📈 Resultados Esperados

| Acción | Tiempo Antes | Tiempo Ahora | Mejora |
|--------|--------------|--------------|--------|
| Cargar primera vez | 2-3s | 2-3s | - |
| Recargar (< 30s) | 2-3s | ~50-100ms | ⚡ **95%** |
| Navegar pestañas | 2-3s cada una | Instantáneo | ⚡ **99%** |
| Click actualizar | 2-3s | 2-3s | - |

## ✅ Checklist de Verificación

- [ ] El dashboard carga la primera vez en 2-3s
- [ ] Navegación entre pestañas es instantánea
- [ ] Logs muestran "Cache HIT" en cargas subsecuentes
- [ ] El botón actualizar muestra notificación
- [ ] Script de prueba muestra mejora > 90%
- [ ] No hay errores en la consola

## 🐛 Solución de Problemas

### Si el caché no funciona:

1. **Reinicia el servidor**: `Ctrl+C` y `npm run dev`
2. **Limpia caché del navegador**: `Ctrl+Shift+R`
3. **Verifica logs**: Busca mensajes de error en consola

### Si aparecen errores:

1. **Verifica que Google Sheets esté configurado**:
   - Variables de entorno `GOOGLE_CLIENT_EMAIL` y `GOOGLE_PRIVATE_KEY`
   
2. **Verifica el ID del restaurante**:
   - Debe ser `rest_001` o el que uses en tu configuración

## 📚 Documentación Completa

Para más detalles, consulta:
- `MEJORAS_RENDIMIENTO_RESUMEN.md` - Resumen ejecutivo
- `OPTIMIZACION_DASHBOARD_RENDIMIENTO.md` - Documentación técnica completa

## 🎉 ¡Listo!

Si todo funciona correctamente, deberías ver:
- ⚡ Carga **20 veces más rápida** después de la primera carga
- 🔽 **80% menos** requests a Google Sheets
- ✅ **0 requests duplicadas**
- 🚀 Dashboard mucho más **responsive**

**¡Disfruta de tu dashboard optimizado! 🎊**

