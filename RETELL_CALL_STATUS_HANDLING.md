# Manejo de Estados de Llamadas en Retell

## Comportamiento del Sistema

### Llamadas Completadas ✅
- **Estado**: `completed`
- **Procesamiento**: ✅ SÍ se procesa
- **Acciones**:
  - Se guarda el transcript completo en la base de datos
  - Se procesa el resumen y elementos de acción
  - Se crean reservas automáticamente si hay datos de reserva
  - Se activa redirección automática al dashboard (solo para La Gaviota)
  - Se notifica al dashboard en tiempo real

### Llamadas Cortadas/Incompletas ❌
- **Estados**: `failed`, `cancelled`, `busy`, `no-answer`, `timeout`
- **Procesamiento**: ❌ NO se procesa
- **Acciones**:
  - Se registra el evento en los logs
  - NO se guarda transcript
  - NO se procesa resumen
  - NO se crean reservas
  - NO se activa redirección al dashboard

## Código de Implementación

### Verificación de Estado
```typescript
// En handleCallAnalyzed()
if (payload.call_status !== 'completed') {
  logger.info('Call not completed, skipping processing', {
    restaurantId,
    callId: payload.call_id,
    callStatus: payload.call_status
  });
  return;
}
```

### Estados de Llamada Retell
- `completed`: Llamada completada exitosamente
- `failed`: Llamada falló
- `cancelled`: Llamada cancelada
- `busy`: Línea ocupada
- `no-answer`: Sin respuesta
- `timeout`: Tiempo de espera agotado

## Beneficios

1. **Eficiencia**: Solo se procesan conversaciones válidas
2. **Calidad**: Evita datos incompletos o corruptos
3. **Experiencia**: Dashboard solo muestra conversaciones completas
4. **Recursos**: Ahorra procesamiento en llamadas fallidas

## Configuración en Retell

Para configurar el agente en Retell, usar:

**Webhook Principal**: `https://tu-dominio.com/api/retell/webhook`
**Webhook de Redirección**: `https://tu-dominio.com/api/retell/dashboard-redirect`

El sistema automáticamente:
- Recibe todos los eventos de llamada
- Filtra solo las completadas
- Procesa únicamente las conversaciones exitosas
- Redirige al dashboard solo para llamadas válidas
