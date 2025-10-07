# Sistema de Webhooks Específicos por Restaurante

## 🎯 Problema Resuelto

Anteriormente, todos los restaurantes compartían un solo webhook URL (`/api/retell/webhook`), lo que causaba problemas para:
- Identificar qué restaurante recibía cada llamada
- Configurar agentes específicos en Retell AI
- Escalar el sistema para múltiples restaurantes

## ✅ Solución Implementada

### 1. Webhooks Específicos por Restaurante

Cada restaurante ahora tiene su propio webhook URL:
```
/api/retell/webhook/[restaurantId]
```

**Ejemplos:**
- La Gaviota: `/api/retell/webhook/rest_003`
- El Buen Sabor: `/api/retell/webhook/rest_004`

### 2. Sistema de Redirección Legacy

El webhook original (`/api/retell/webhook`) ahora redirige automáticamente a los webhooks específicos basándose en el `agent_id`.

### 3. Gestión de Agentes Integrada

La gestión de agentes Retell AI está ahora integrada en el panel de administración principal.

## 🚀 Cómo Configurar

### Paso 1: Acceder al Panel de Administración

1. Ve a `/admin`
2. Haz clic en "Agentes Retell AI" para expandir la sección
3. Verás la gestión completa de agentes

### Paso 2: Configurar un Nuevo Agente

1. Haz clic en "Nuevo Agente"
2. Selecciona el restaurante
3. Ingresa el Agent ID de Retell AI
4. Configura la voz y idioma
5. Personaliza el prompt si es necesario
6. Haz clic en "Crear Agente"

### Paso 3: Obtener el Webhook URL

Después de crear el agente, obtendrás un webhook URL específico como:
```
https://tu-dominio.com/api/retell/webhook/rest_003
```

### Paso 4: Configurar en Retell AI

1. Ve a tu dashboard de Retell AI
2. Edita el agente correspondiente
3. Configura el webhook URL específico del restaurante
4. Guarda la configuración

## 📋 URLs de Webhook por Restaurante

| Restaurante | Restaurant ID | Webhook URL |
|-------------|---------------|-------------|
| La Gaviota | rest_003 | `/api/retell/webhook/rest_003` |
| El Buen Sabor | rest_004 | `/api/retell/webhook/rest_004` |

## 🔧 API Endpoints

### Gestión de Agentes

- `GET /api/retell/agents` - Listar todos los agentes
- `GET /api/retell/agents/[restaurantId]` - Obtener configuración específica
- `POST /api/retell/agents/[restaurantId]` - Crear/actualizar agente
- `DELETE /api/retell/agents/[restaurantId]` - Eliminar agente

### Webhooks

- `POST /api/retell/webhook` - Webhook legacy (redirige automáticamente)
- `POST /api/retell/webhook/[restaurantId]` - Webhook específico del restaurante

## 🧪 Pruebas

### Script de Prueba Automatizado

Ejecuta el script de prueba para verificar que todo funciona:

```bash
node scripts/test-restaurant-webhooks.js
```

Este script:
- Prueba webhooks específicos por restaurante
- Verifica la redirección desde el webhook legacy
- Comprueba la configuración de agentes

### Pruebas Manuales

1. **Probar webhook específico:**
   ```bash
   curl -X POST https://tu-dominio.com/api/retell/webhook/rest_003 \
     -H "Content-Type: application/json" \
     -d '{"event":"call_started","agent_id":"agent_2082fc7a622cdbd22441b22060","call_id":"test_123"}'
   ```

2. **Probar webhook legacy:**
   ```bash
   curl -X POST https://tu-dominio.com/api/retell/webhook \
     -H "Content-Type: application/json" \
     -d '{"event":"call_started","agent_id":"agent_2082fc7a622cdbd22441b22060","call_id":"test_123"}'
   ```

## 📊 Monitoreo

### Logs

Los logs ahora incluyen información específica del restaurante:
```
Retell Webhook received - restaurantId: rest_003, agentId: agent_2082fc7a622cdbd22441b22060
```

### Dashboard

En el panel de administración puedes:
- Ver todos los agentes configurados
- Copiar webhook URLs
- Verificar el estado de cada agente
- Eliminar agentes no utilizados

## 🔄 Migración desde Sistema Anterior

### Para Restaurantes Existentes

1. Los webhooks existentes seguirán funcionando (redirección automática)
2. Recomendamos migrar gradualmente a webhooks específicos
3. Actualiza la configuración en Retell AI cuando sea conveniente

### Para Nuevos Restaurantes

1. Usa siempre webhooks específicos por restaurante
2. Configura el agente desde el panel de administración
3. Copia el webhook URL específico para Retell AI

## 🚨 Consideraciones Importantes

### Seguridad

- Cada webhook URL es específico del restaurante
- No hay riesgo de confusión entre restaurantes
- Los logs incluyen información de auditoría completa

### Escalabilidad

- Fácil agregar nuevos restaurantes
- Configuración automática de webhooks
- Gestión centralizada desde el panel de administración

### Compatibilidad

- Sistema backward compatible
- Webhook legacy sigue funcionando
- Migración gradual sin interrupciones

## 📞 Soporte

Si tienes problemas:

1. Verifica los logs en el panel de administración
2. Ejecuta el script de prueba
3. Confirma que el webhook URL en Retell AI es correcto
4. Verifica que el restaurante existe en la base de datos

## 🎉 Beneficios

✅ **Webhooks únicos por restaurante**  
✅ **Configuración automática**  
✅ **Gestión integrada en el panel de administración**  
✅ **Sistema de redirección legacy**  
✅ **Escalabilidad para múltiples restaurantes**  
✅ **Logs específicos por restaurante**  
✅ **Fácil configuración en Retell AI**
