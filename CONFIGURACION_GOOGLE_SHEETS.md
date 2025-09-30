# 📊 Configuración Google Sheets + Retell AI + Dashboard

## 🎯 **Objetivo**
Configurar un sistema donde:
1. **Retell AI** detecta reservas en las llamadas
2. **Google Sheets** almacena las reservas automáticamente
3. **Dashboard** muestra las reservas en tiempo real

---

## 📋 **Paso 1: Crear Google Sheets**

### 1.1 Crear la Hoja
1. Ve a [Google Sheets](https://sheets.google.com)
2. Crea nueva hoja de cálculo
3. Nómbrala (ej: "Reservas Restaurante")

### 1.2 Configurar Columnas
En la **primera fila (A1:G1)**:

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| **Fecha** | **Hora** | **Horario** | **Cliente** | **Teléfono** | **Personas** | **Estado** |

### 1.3 Obtener ID
- Copia la URL de tu Google Sheets
- El ID es la parte entre `/d/` y `/edit`
- Ejemplo: `1ABC123DEF456GHI789JKL`

---

## 🔑 **Paso 2: Google Service Account**

### 2.1 Crear Service Account
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea proyecto nuevo o selecciona existente
3. Habilita **Google Sheets API**
4. Ve a "Credenciales" → "Crear credenciales" → "Cuenta de servicio"
5. Descarga archivo JSON
6. Renómbralo como `google-credentials.json`

### 2.2 Dar Permisos
1. Copia el email del service account del archivo JSON
2. Comparte tu Google Sheets con ese email
3. Dale permisos de **"Editor"**

---

## ⚙️ **Paso 3: Variables de Entorno**

Crea archivo `.env.local` en la raíz del proyecto:

```env
# Google Sheets
GOOGLE_SHEETS_ID=tu_id_de_la_hoja_aqui
GOOGLE_CREDENTIALS_PATH=./google-credentials.json

# Retell AI
RETELL_API_KEY=tu_api_key_de_retell_aqui

# Aplicación
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

---

## 🧪 **Paso 4: Probar Configuración**

Ejecuta el script de prueba:

```bash
node scripts/test-google-sheets.js
```

**Salida esperada:**
```
🧪 Probando conexión con Google Sheets...

📖 Leyendo reservas existentes...
✅ Encontradas 0 reservas

📊 Obteniendo estadísticas...
✅ Estadísticas: { totalReservas: 0, reservasHoy: 0, ... }

🔍 Verificando disponibilidad...
✅ Disponibilidad para 2024-01-15 a las 20:00 para 4 personas: SÍ

➕ Creando reserva de prueba...
✅ Reserva de prueba creada exitosamente

🎉 ¡Todas las pruebas pasaron! Google Sheets está configurado correctamente.
```

---

## 🔄 **Paso 5: Configurar Retell AI**

### 5.1 Webhook URL
Configura en Retell AI el webhook:
```
http://tu-dominio.com/api/retell/webhook
```

### 5.2 Eventos a Capturar
- `call_analyzed` - Cuando Retell analiza la llamada
- `call_ended` - Cuando termina la llamada

---

## 🎯 **Paso 6: Flujo Automático**

### 6.1 Cuando llega una llamada:
1. **Retell AI** responde automáticamente
2. **Retell AI** analiza la conversación
3. **Webhook** detecta si hay reserva
4. **Sistema** extrae datos (nombre, teléfono, fecha, hora, personas)
5. **Google Sheets** se actualiza automáticamente
6. **Dashboard** se actualiza cada 30 segundos

### 6.2 Datos que se extraen:
- ✅ Nombre del cliente
- ✅ Teléfono
- ✅ Número de personas
- ✅ Fecha de reserva
- ✅ Hora de reserva
- ✅ Solicitudes especiales
- ✅ Estado (confirmada/pendiente/cancelada)

---

## 📱 **Paso 7: Verificar en Dashboard**

1. Inicia el servidor: `npm run dev`
2. Ve a tu dashboard de restaurante
3. Verás las reservas automáticamente
4. Botón "🔄 Actualizar" para sincronización manual

---

## 🔧 **Solución de Problemas**

### Error: "Google Sheets API no habilitada"
```bash
# Ve a Google Cloud Console
# Habilita "Google Sheets API"
```

### Error: "Credenciales no válidas"
```bash
# Verifica que google-credentials.json esté en la raíz
# Verifica que el Service Account tenga acceso al Sheets
```

### Error: "No se detectan reservas"
```bash
# Verifica que Retell AI esté enviando webhooks
# Revisa los logs en la consola del navegador
```

### Dashboard vacío
```bash
# Verifica que GOOGLE_SHEETS_ID esté correcto
# Ejecuta: node scripts/test-google-sheets.js
```

---

## 📊 **Estructura de Datos**

### Google Sheets:
```
A: Fecha (2024-01-15)
B: Hora (20:00)
C: Horario (20:00)
D: Cliente (Juan Pérez)
E: Teléfono (555-1234)
F: Personas (4)
G: Estado (confirmada)
```

### Dashboard:
```json
{
  "id": "res_1234567890",
  "time": "20:00",
  "clientName": "Juan Pérez",
  "partySize": 4,
  "table": "Por asignar",
  "status": "confirmed",
  "notes": "Mesa cerca de la ventana",
  "phone": "555-1234"
}
```

---

## 🚀 **¡Listo!**

Tu sistema está configurado para:
- ✅ Detectar reservas automáticamente en llamadas
- ✅ Guardarlas en Google Sheets
- ✅ Mostrarlas en el dashboard en tiempo real
- ✅ Sincronización automática cada 30 segundos

**¡Las reservas de Retell AI aparecerán automáticamente en tu dashboard!** 🎉
