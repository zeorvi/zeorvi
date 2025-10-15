# 🚀 Instalación del Script de Liberación Automática

## ✅ **Ventajas de usar Google Apps Script:**
- ✅ **100% GRATIS** - Sin costos adicionales
- ✅ **Ejecución automática** cada 5 minutos (o menos)
- ✅ **Confiable** - Infraestructura de Google
- ✅ **Fácil de configurar** - Solo 5 pasos
- ✅ **Funciona para todos tus restaurantes** - Un solo script

---

## 📋 **Paso a Paso - Instalación (5 minutos):**

### **1. Abre tu Google Sheet de Reservas**
- Ve a: https://docs.google.com/spreadsheets/d/115x4UoUoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4/edit
- Este es el Google Sheet de **La Gaviota**

### **2. Abre el Editor de Apps Script**
- En el menú superior, haz clic en: **Extensiones** > **Apps Script**
- Se abrirá una nueva pestaña con el editor de código

### **3. Pega el Código del Script**
- Borra todo el código que aparece por defecto (`function myFunction() { ... }`)
- Copia todo el contenido del archivo `google-sheets-auto-release.gs`
- Pégalo en el editor
- Haz clic en el icono del **💾 disco** para guardar
- Ponle un nombre al proyecto: "Liberación Automática de Mesas"

### **4. Configura el ID de tu Google Sheet**
En la línea 22 del script, verás:
```javascript
SPREADSHEET_ID: '115x4UoUoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4',
```

**Ya está configurado con el ID correcto de La Gaviota** ✅

Si tienes otro restaurante, copia el ID de la URL:
```
https://docs.google.com/spreadsheets/d/[ESTE_ES_EL_ID]/edit
```

### **5. Ejecuta la Prueba Manual (Opcional)**
Antes de activar el trigger automático, prueba que funciona:
- En el editor, selecciona la función: **`probarScript`** (en el menú desplegable arriba)
- Haz clic en el botón ▶️ **Ejecutar**
- La primera vez te pedirá permisos:
  - Haz clic en **"Revisar permisos"**
  - Selecciona tu cuenta de Google
  - Haz clic en **"Avanzado"** > **"Ir a [nombre del proyecto] (no seguro)"**
  - Haz clic en **"Permitir"**
- Revisa los logs en la parte inferior (View > Logs) para ver si funcionó

### **6. Configura el Trigger Automático**
Ahora configura que se ejecute automáticamente cada 5 minutos:

**Opción A: Usar la función automática (Recomendado)**
- En el editor, selecciona la función: **`configurarTrigger`**
- Haz clic en ▶️ **Ejecutar**
- ¡Listo! El trigger está configurado

**Opción B: Configurar manualmente**
- Haz clic en el icono del ⏰ **reloj** (Triggers) en el menú lateral izquierdo
- Haz clic en **+ Añadir trigger** (abajo a la derecha)
- Configura:
  - **Función a ejecutar:** `liberarMesasAutomaticamente`
  - **Origen del evento:** Controlado por tiempo
  - **Tipo de activador basado en tiempo:** Activador de minutero
  - **Intervalo de minutos:** Cada 5 minutos (o el intervalo que prefieras)
- Haz clic en **Guardar**

---

## 🎯 **¿Qué hace el Script?**

Cada 5 minutos, el script:

1. ⏰ **Lee todas las reservas** de la hoja "Reservas"
2. 🔍 **Busca reservas** con estado "Ocupada" o "Reservada"
3. ⏱️ **Calcula el tiempo transcurrido** desde la hora de reserva
4. ✅ **Si pasaron 2 horas**, cambia el estado a "Completada"
5. 📝 **Registra los cambios** en una nueva hoja llamada "Log_Liberaciones"

---

## 📊 **Monitoreo - Nueva Hoja de Log**

El script creará automáticamente una nueva hoja llamada **"Log_Liberaciones"** donde verás:

| Timestamp | Fecha Reserva | Hora | Cliente | Mesa | Estado Anterior | Horas Transcurridas |
|-----------|---------------|------|---------|------|----------------|---------------------|
| 2025-10-15 14:35:22 | 2025-10-15 | 12:00 | Juan Pérez | M1 | Ocupada | 2.59 |
| 2025-10-15 14:35:22 | 2025-10-15 | 11:30 | María López | M3 | Reservada | 3.08 |

Esto te permite:
- ✅ Ver qué mesas se liberaron automáticamente
- ✅ Auditoría completa de cambios
- ✅ Detectar patrones de ocupación

---

## ⚙️ **Configuración Avanzada (Opcional)**

Puedes ajustar estos valores en la línea 22-30 del script:

```javascript
const CONFIG = {
  // Cambiar el tiempo de liberación (por defecto 2 horas)
  HORAS_HASTA_LIBERAR: 2,  // Cambia a 1.5, 3, etc.
  
  // Cambiar el estado final
  ESTADO_LIBRE: 'Completada',  // O 'Libre', 'Disponible', etc.
  
  // Estados que deben ser liberados
  ESTADOS_OCUPADOS: ['Ocupada', 'Reservada', 'ocupada', 'reservada'],
};
```

---

## 🔧 **Solución de Problemas**

### **El script no se ejecuta:**
1. Verifica que el trigger esté configurado (icono ⏰)
2. Revisa los logs: View > Logs o View > Executions
3. Asegúrate de haber dado todos los permisos

### **El script da error:**
1. Verifica que los nombres de las columnas en tu hoja sean exactos:
   - `Fecha`, `Hora`, `Estado`, `Cliente`, `Mesa`
2. Revisa que el SPREADSHEET_ID sea correcto
3. Mira los logs para ver el error específico

### **Las mesas no se liberan:**
1. Verifica que el estado sea exactamente "Ocupada" o "Reservada" (con mayúsculas)
2. Asegúrate de que la columna "Fecha" esté en formato de fecha de Google Sheets
3. Verifica que la columna "Hora" esté en formato HH:MM (ej: 14:30)

---

## 📧 **Notificaciones por Email (Opcional)**

Si quieres recibir un email cuando hay errores:

1. Busca la función `enviarNotificacionError` en el script (línea ~180)
2. Cambia `'tu-email@ejemplo.com'` por tu email real
3. Descomenta la línea en la función principal (quitar los `//`)

---

## ✅ **Verificación Final**

Después de instalar, verifica que funciona:

1. ✅ Ve a la hoja "Reservas"
2. ✅ Crea una reserva de prueba con:
   - Fecha: Hoy
   - Hora: Hace 3 horas (ej: si son las 15:00, pon 12:00)
   - Estado: "Ocupada"
3. ✅ Espera 5 minutos
4. ✅ Actualiza la página y verifica que el estado cambió a "Completada"
5. ✅ Revisa la nueva hoja "Log_Liberaciones" para ver el registro

---

## 🎉 **¡Listo! Tu Sistema es 100% Automático y GRATIS**

Ahora tienes:
- ✅ **Plan Gratuito de Vercel** - $0/mes
- ✅ **Liberación automática de mesas** - Google lo hace gratis
- ✅ **Sistema completamente funcional** - Sin intervención manual
- ✅ **Escalable** - Funciona para todos tus restaurantes

**Con esto puedes mantener el plan gratuito de Vercel y tener todas las funcionalidades premium** 🚀

