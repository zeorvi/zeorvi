# 🎯 INSTRUCCIONES PARA CONFIGURAR RETELL

## 📋 PASOS PARA CONFIGURAR EL AGENTE

### 1. **Copia el Prompt**
- Abre el archivo `PROMPT_RETELL_COMPLETO.md`
- Copia TODO el contenido

### 2. **Reemplaza las Variables**
Antes de pegar en Retell, reemplaza estas variables con los datos específicos de cada restaurante:

```
{{restaurant_name}} → Nombre real del restaurante (ej: "El Buen Sabor")
{{restaurant_id}} → ID del restaurante (ej: "rest_elbuensabor_001")
{{restaurant_type}} → Tipo de restaurante (ej: "Restaurante familiar")
{{restaurant_specialty}} → Especialidad (ej: "Cocina mediterránea")
{{restaurant_ambiance}} → Ambiente (ej: "Elegante pero familiar")
{{restaurant_locations}} → Lista de ubicaciones disponibles
```

### 3. **Ejemplo de Reemplazo**

**ANTES:**
```
**Eres el recepcionista virtual de {{restaurant_name}}.**
```

**DESPUÉS:**
```
**Eres el recepcionista virtual de El Buen Sabor.**
```

### 4. **Configuración en Retell**

#### **🎙️ Configuración de Voz:**
- **Idioma:** Español (España) - `es-ES`
- **Voz:** Masculina, amable y profesional
- **Velocidad:** 1.0 (natural)
- **Temperatura:** 0.8 (conversacional)

#### **⚙️ Configuración del Agente:**
- **Interruption Threshold:** 500ms
- **Enable Backchannel:** ✅ Activado
- **Enable Transfer Call:** ❌ Desactivado
- **Enable Webhook:** ✅ Activado

#### **🔗 Webhooks:**
```
Webhook URL: https://tu-dominio.com/api/retell/webhook
Events: call_started, call_ended, call_analyzed
```

#### **🌐 API Endpoints:**
Asegúrate de que estos endpoints estén funcionando:
```
GET /api/retell/calendar
POST /api/retell/calendar
GET /api/retell/cancel-reservation
POST /api/retell/cancel-reservation
PUT /api/retell/cancel-reservation
```

### 5. **Variables Dinámicas en Retell**

Si tu plataforma Retell soporta variables dinámicas, puedes usar:

```json
{
  "custom_llm_dynamic_variables": [
    {
      "name": "restaurant_name",
      "description": "Nombre del restaurante",
      "value": "El Buen Sabor"
    },
    {
      "name": "restaurant_id", 
      "description": "ID del restaurante",
      "value": "rest_elbuensabor_001"
    }
  ]
}
```

### 6. **Ejemplo Completo para "El Buen Sabor"**

```
# 🎯 PROMPT COMPLETO PARA RETELL - AGENTE DE RESERVAS

## 👋 PERSONALIDAD DEL AGENTE

**Eres el recepcionista virtual de El Buen Sabor. Tienes una personalidad cálida, profesional y muy amable.**

### 🎭 Características de Personalidad:
- **Muy amable y sonriente** (se nota en tu voz)
- **Profesional pero cercano** - Como un recepcionista experimentado
- **Paciente y comprensivo** - Nunca te apresuras con el cliente
- **Proactivo** - Ofreces alternativas y sugerencias
- **Empático** - Entiendes las necesidades del cliente
- **Eficiente** - Resuelves todo rápidamente pero sin prisa

## 🏪 INFORMACIÓN DEL RESTAURANTE

**Nombre:** El Buen Sabor
**ID:** rest_elbuensabor_001
**Tipo:** Restaurante familiar con ambiente acogedor
**Especialidad:** Cocina mediterránea y platos tradicionales
**Ambiente:** Elegante pero familiar, perfecto para cualquier ocasión

### 📍 Ubicaciones Disponibles:
- **Salón Principal:** Interior elegante y acogedor
- **Terraza:** Al aire libre con vista, perfecta para cenas románticas
- **Comedor Familiar:** Área tranquila ideal para familias con niños

[... resto del prompt con "El Buen Sabor" en lugar de {{restaurant_name}}]
```

### 7. **Testing**

Una vez configurado, prueba estas frases:

#### **✅ Frases de Prueba:**
- "Hola, quiero hacer una reserva"
- "Necesito una mesa para 4 personas mañana a las 8"
- "Quiero cancelar mi reserva"
- "¿Tienen mesa disponible para hoy?"
- "Somos celíacos, ¿tienen opciones?"

#### **🎯 Respuestas Esperadas:**
- Saludo amable con nombre del restaurante
- Preguntas por detalles de la reserva
- Consulta de disponibilidad
- Pregunta por necesidades especiales
- Confirmación sin detalles técnicos

### 8. **Monitoreo**

#### **📊 Métricas a Vigilar:**
- **Tasa de conversión** de llamadas a reservas
- **Tiempo promedio** de llamada
- **Satisfacción** del cliente
- **Errores** en el proceso de reserva

#### **🔍 Logs Importantes:**
- Llamadas que no resultaron en reserva
- Errores de API
- Cancelaciones frecuentes
- Horarios más solicitados

---

## 🚀 RESULTADO FINAL

Con esta configuración tendrás un agente de voz que:

✅ **Se presenta correctamente** con el nombre del restaurante
✅ **Maneja reservas** de forma natural y amable  
✅ **Pregunta por necesidades especiales** automáticamente
✅ **Ofrece alternativas** cuando no hay disponibilidad
✅ **Confirma detalles** sin mencionar información técnica
✅ **Cancela y modifica** reservas de forma empática
✅ **Mantiene un tono** profesional pero cercano

**¡Tu agente estará listo para atender a los clientes como el mejor recepcionista del mundo!** 🎉

