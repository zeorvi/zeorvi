# 📞 Cómo Probar con una Llamada Real de Retell AI

## 🎯 Objetivo

Hacer una llamada real al agente de Retell AI y verificar que la reserva se guarde automáticamente en Google Sheets.

---

## ✅ Verificaciones Previas

Antes de hacer la prueba con llamada real, asegúrate de que:

- ✅ **Google Sheets está conectado** (ya verificado ✓)
- ✅ **Retell AI está conectado** (ya verificado ✓)
- ✅ **El flujo completo funciona** (ya verificado ✓)
- ✅ **El servidor está corriendo** (`npm run dev`)

---

## 🔧 Paso 1: Configurar el Agente de Retell AI

### 1.1 Acceder a Retell AI Dashboard

1. Ve a [https://app.retellai.com](https://app.retellai.com)
2. Inicia sesión con tu cuenta

### 1.2 Crear o Configurar el Agente

**Opción A: Si ya tienes un agente para La Gaviota**

1. Busca el agente que contenga "rest_003" o "La Gaviota" en el nombre
2. Edita la configuración

**Opción B: Crear un nuevo agente**

1. Click en "Create Agent"
2. Nombre: "La Gaviota - Reservas"
3. Agent ID: `rest_003_agent` (importante que incluya "rest_003")

### 1.3 Configurar el Prompt del Agente

Usa el siguiente prompt optimizado:

```
Eres el asistente de reservas del restaurante La Gaviota, un elegante restaurante 
de mariscos en la costa. Tu trabajo es ayudar a los clientes a hacer reservas de 
forma amable y eficiente.

INFORMACIÓN DEL RESTAURANTE:
- Nombre: La Gaviota
- Horarios: Comida (13:00-16:00), Cena (20:00-23:30)
- Zonas disponibles: Comedor 1, Comedor 2, Terraza, Salón Privado
- Capacidad: 2 a 8 personas por mesa

TU PROCESO DE RESERVA:
1. Saluda amablemente al cliente
2. Pregunta para cuándo desea la reserva (fecha y hora)
3. Pregunta cuántas personas serán
4. Pregunta si tiene preferencia de zona
5. Solicita el nombre del cliente
6. Solicita un número de teléfono
7. Pregunta si tiene alguna solicitud especial
8. Confirma todos los datos
9. Despídete cordialmente

DATOS A EXTRAER:
- customer_name: Nombre completo del cliente
- phone: Número de teléfono (formato +34XXXXXXXXX)
- people: Número de personas (número)
- date: Fecha de la reserva (YYYY-MM-DD)
- time: Hora de la reserva (HH:MM formato 24h)
- zone: Zona preferida (Comedor 1, Comedor 2, Terraza, Salón Privado)
- special_requests: Cualquier solicitud especial
- reservation_made: true (si la reserva se confirma)

IMPORTANTE:
- Sé amable y profesional en todo momento
- Si el cliente pide una hora fuera del horario, sugiere alternativas
- Si pide más de 8 personas, sugiere el Salón Privado
- Confirma TODOS los datos antes de finalizar
```

### 1.4 Configurar el Webhook

1. En la configuración del agente, busca "Webhook URL"
2. Ingresa: `https://tu-dominio.vercel.app/api/retell/webhook/rest_003`
   - O si estás probando localmente: usa ngrok (ver sección siguiente)

### 1.5 Configurar Metadata

En la sección de "Metadata" del agente, agrega:

```json
{
  "restaurantId": "rest_003",
  "restaurantName": "La Gaviota"
}
```

### 1.6 Configurar Custom Analysis

En "Custom Analysis" o "Call Analysis", configura para extraer:

```json
{
  "reservation_made": "boolean",
  "customer_name": "string",
  "phone": "string",
  "people": "number",
  "date": "string",
  "time": "string",
  "zone": "string",
  "special_requests": "string"
}
```

---

## 🌐 Paso 2: Exponer tu Servidor Local (si no estás en producción)

Si estás probando localmente, necesitas exponer tu servidor:

### Opción 1: Usar ngrok

```bash
# Instalar ngrok
npm install -g ngrok

# Exponer el puerto 3000
ngrok http 3000
```

Copia la URL que ngrok te da (ej: `https://abc123.ngrok.io`) y úsala en el webhook de Retell:
```
https://abc123.ngrok.io/api/retell/webhook/rest_003
```

### Opción 2: Desplegar en Vercel

Si ya tienes el proyecto en Vercel:
```
https://tu-proyecto.vercel.app/api/retell/webhook/rest_003
```

---

## 🎤 Paso 3: Hacer la Llamada de Prueba

### 3.1 Obtener el Número de Teléfono del Agente

1. En Retell AI Dashboard, ve a tu agente
2. Busca "Phone Number" o "Test Call"
3. Copia el número de teléfono

### 3.2 Preparar el Guión de la Llamada

Ejemplo de conversación:

```
Tú: Hola, quiero hacer una reserva

Agente: ¡Hola! Encantado de ayudarte. ¿Para qué fecha y hora te gustaría reservar?

Tú: Para mañana a las 8 de la noche

Agente: Perfecto, ¿para cuántas personas?

Tú: Somos 4 personas

Agente: Excelente, ¿tienen preferencia de zona?

Tú: Sí, en la terraza si es posible

Agente: Claro, ¿a qué nombre hago la reserva?

Tú: Carlos Martínez

Agente: Perfecto Carlos, ¿me puede dar un número de teléfono?

Tú: Sí, es el 666 123 456

Agente: ¿Alguna solicitud especial para su reserva?

Tú: Sí, es para celebrar un cumpleaños

Agente: ¡Qué bien! Déjame confirmar: reserva para 4 personas mañana a las 20:00 
        en la terraza, a nombre de Carlos Martínez, teléfono 666123456, 
        y es para celebrar un cumpleaños. ¿Es correcto?

Tú: Sí, todo correcto

Agente: ¡Perfecto! Su reserva está confirmada. ¡Nos vemos mañana!
```

### 3.3 Hacer la Llamada

1. Llama al número del agente
2. Sigue el guión preparado
3. Completa la reserva

---

## 🔍 Paso 4: Verificar la Reserva en Google Sheets

### Opción 1: Abrir Google Sheets

1. Ve a: https://docs.google.com/spreadsheets/d/115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4/edit
2. Busca tu reserva en la hoja "Reservas"
3. Debería aparecer con todos los datos que proporcionaste

### Opción 2: Usar el Script de Verificación

```bash
node ver-reservas-actuales.js
```

Busca tu reserva en la lista. Debería aparecer con:
- ✅ Tu nombre
- ✅ Tu teléfono
- ✅ Fecha y hora correctas
- ✅ Número de personas
- ✅ Zona solicitada
- ✅ Estado: Confirmada

---

## 📊 Paso 5: Verificar los Logs

### Ver logs del webhook

```bash
# En tu terminal donde corre npm run dev
# Deberías ver logs como:

🔄 Webhook recibido de Retell AI
📞 Call ID: call_xxxxx
🤖 Agent ID: rest_003_agent
📍 Restaurant ID: rest_003
✅ Reserva detectada
📝 Guardando en Google Sheets...
✅ Reserva guardada exitosamente
```

---

## ✅ Checklist de Verificación

Después de hacer la llamada, verifica:

- [ ] La llamada se completó exitosamente
- [ ] El agente entendió todos los datos
- [ ] La reserva aparece en Google Sheets
- [ ] Todos los datos son correctos:
  - [ ] Nombre del cliente
  - [ ] Teléfono
  - [ ] Fecha
  - [ ] Hora
  - [ ] Número de personas
  - [ ] Zona preferida
  - [ ] Notas especiales
- [ ] Estado es "Confirmada"
- [ ] Mesa asignada automáticamente

---

## 🐛 Solución de Problemas

### Problema: La reserva no aparece en Google Sheets

**Posibles causas:**

1. **Webhook no configurado correctamente**
   - Verifica que la URL del webhook sea correcta
   - Si usas ngrok, asegúrate de que esté corriendo

2. **Metadatos faltantes**
   - Verifica que el agente tenga `restaurantId: "rest_003"` en metadata

3. **Custom Analysis no configurado**
   - Asegúrate de que `reservation_made` sea `true`
   - Verifica que todos los campos se extraen correctamente

4. **Servidor no corriendo**
   - Asegúrate de que `npm run dev` esté corriendo
   - Verifica que no haya errores en la consola

### Problema: El agente no entiende bien

**Soluciones:**

1. Mejora el prompt con más ejemplos
2. Habla más claramente y pausadamente
3. Da la información en el orden que el agente espera

### Problema: Errores en los logs

**Revisa:**

1. Variables de entorno:
   ```bash
   GOOGLE_CLIENT_EMAIL=zeorvi@zeorvi.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY=<debe estar configurada>
   ```

2. Permisos de Google Sheets:
   - El email `zeorvi@zeorvi.iam.gserviceaccount.com` debe tener acceso al sheet

---

## 🎉 Resultado Esperado

Si todo funciona correctamente:

1. ✅ Haces la llamada al agente de Retell AI
2. ✅ Proporcionas los datos de la reserva
3. ✅ El agente confirma la reserva
4. ✅ La llamada termina
5. ✅ Retell AI envía el webhook a tu servidor
6. ✅ Tu servidor procesa los datos
7. ✅ La reserva se guarda en Google Sheets
8. ✅ Puedes ver la reserva en el sheet

**Tiempo total:** Menos de 2 minutos desde el final de la llamada

---

## 📝 Próximos Pasos

Una vez que la prueba funcione:

1. **Configurar notificaciones**
   - SMS al cliente confirmando la reserva
   - Email con los detalles
   - Notificación al restaurante

2. **Mejorar el agente**
   - Agregar validación de disponibilidad en tiempo real
   - Sugerir alternativas si no hay disponibilidad
   - Manejar modificaciones y cancelaciones

3. **Dashboard para el restaurante**
   - Ver reservas en tiempo real
   - Modificar estado de reservas
   - Generar reportes

---

## 🔗 Enlaces Útiles

- **Google Sheet:** https://docs.google.com/spreadsheets/d/115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4/edit
- **Retell AI Dashboard:** https://app.retellai.com
- **Documentación Retell AI:** https://docs.retellai.com

---

**¿Necesitas ayuda?** Revisa los logs del servidor y del webhook para identificar el problema.


