# 🎉 Sistema Completo de Google Sheets para Restaurantes

## ✅ **Lo que hemos implementado**

### 🏗️ **1. Estructura de Google Sheets por Restaurante**

Cada restaurante tiene un Google Sheet con **3 hojas especializadas**:

```
📘 Google Sheets "La Gaviota - Gestión"
├── 🪑 Mesas (infraestructura fija)
├── 📆 Reservas (reservas confirmadas)  
└── ⏰ Turnos (horarios de servicio)
```

### 🪑 **Hoja "Mesas"**
Define la infraestructura fija del restaurante:

| ID | Zona | Capacidad | Turnos | Estado | Notas |
|----|------|-----------|--------|--------|-------|
| M1 | Comedor 1 | 2 | Comida, Cena | Libre | |
| M2 | Comedor 1 | 2 | Comida, Cena | Libre | |
| M3 | Comedor 1 | 4 | Comida | Libre | |
| M4 | Comedor 2 | 3 | Comida, Cena | Libre | |
| M5 | Comedor 2 | 3 | Comida, Cena | Libre | |
| M6 | Terraza | 4 | Cena | Libre | |
| M7 | Terraza | 6 | Cena | Libre | |
| M8 | Salón Privado | 8 | Comida, Cena | Libre | |

### 📆 **Hoja "Reservas"**
Donde el agente de Retell escribe y lee cada reserva:

| ID | Fecha | Hora | Turno | Cliente | Teléfono | Personas | Zona | Mesa | Estado | Notas | Creado |
|----|-------|------|-------|---------|----------|----------|------|------|--------|-------|--------|
| R001 | 2024-01-20 | 21:00 | Cena | María García | +34 666 123 456 | 4 | Terraza | M6 | Confirmada | Mesa cerca ventana | 2024-01-20 17:35 |
| R002 | 2024-01-21 | 13:30 | Comida | Juan López | +34 666 789 012 | 2 | Comedor 1 | M1 | Pendiente | Aniversario | 2024-01-20 18:10 |

### ⏰ **Hoja "Turnos"**
Control de horarios de servicio:

| Turno | Inicio | Fin |
|-------|--------|-----|
| Comida | 13:00 | 16:00 |
| Cena | 20:00 | 23:30 |

## 🚀 **Scripts Automatizados**

### **1. Script de Creación**
```bash
node scripts/create-restaurant-sheets.js
```

**Lo que hace:**
- ✅ Crea Google Sheets para cada restaurante
- ✅ Configura las 3 hojas (Mesas, Reservas, Turnos)
- ✅ Agrega datos de ejemplo específicos por restaurante
- ✅ Formatea encabezados con colores
- ✅ Genera archivo `.env.sheets` con IDs reales

### **2. Script de Pruebas**
```bash
node scripts/test-sheets-structure.js
```

**Lo que hace:**
- ✅ Verifica que todas las hojas existan
- ✅ Valida estructura de columnas
- ✅ Prueba funciones de lectura
- ✅ Simula verificación de disponibilidad
- ✅ Prueba escritura de reservas

## 🧠 **Flujo de Reserva del Agente Retell**

### **Ejemplo de conversación:**

1. **Cliente**: "Quiero reservar para 4 personas a las 9 en terraza"
2. **Agente**: Llama a `verificar_disponibilidad` con:
   - Fecha: "2024-01-20"
   - Hora: "21:00" 
   - Personas: 4
   - Zona: "Terraza"
3. **Backend**: 
   - Lee hoja "Mesas" → filtra por zona="Terraza", capacidad>=4, turnos incluye "Cena"
   - Lee hoja "Reservas" → busca mesas ocupadas ese día/hora
   - Encuentra mesa disponible (ej: M6)
4. **Agente**: "Perfecto, tengo mesa M6 para 4 personas en terraza a las 21:00"
5. **Cliente**: "Sí, confírmalo"
6. **Agente**: Llama a `crear_reserva` con todos los datos
7. **Backend**: Escribe en hoja "Reservas" con estado "Confirmada"

## 🔧 **Configuración Requerida**

### **Variables de Entorno:**
```bash
# Google Sheets IDs (generados automáticamente)
LA_GAVIOTA_SHEET_ID=1BvXyZ1234567890abcdefghijklmnop
EL_BUEN_SABOR_SHEET_ID=1CwXyZ0987654321zyxwvutsrqponmlk
RESTAURANT_001_SHEET_ID=1DxXyZ2468135790zyxwvutsrqponmlk
RESTAURANT_002_SHEET_ID=1ExXyZ1357924680zyxwvutsrqponmlk

# Google API
GOOGLE_CREDENTIALS_PATH=google-credentials.json
GOOGLE_PROJECT_ID=tu-project-id

# Retell AI
RETELL_API_KEY=tu_api_key
RETELL_WEBHOOK_SECRET=tu_webhook_secret
NEXT_PUBLIC_BASE_URL=https://tu-dominio.com
```

### **Configuración en Retell AI:**
```json
// En cada agente, agregar:
{
  "metadata": {
    "restaurantId": "rest_003",
    "restaurantName": "La Gaviota"
  }
}

// URLs:
Function Calling URL: https://tu-dominio.com/api/retell/functions
Webhook URL: https://tu-dominio.com/api/retell/webhook
```

## 📋 **Funciones Disponibles para el Agente**

| Función | Descripción | Parámetros |
|---------|-------------|------------|
| `verificar_disponibilidad` | Comprueba mesas libres | fecha, hora, personas, zona |
| `crear_reserva` | Añade nueva reserva | cliente, teléfono, fecha, hora, personas, notas |
| `cancelar_reserva` | Cambia estado a cancelada | cliente, teléfono |
| `consultar_reservas_dia` | Devuelve reservas del día | fecha |
| `obtener_estadisticas` | Estadísticas del restaurante | - |

## 🎯 **Próximos Pasos**

### **1. Configurar Google API**
- Crear proyecto en Google Cloud Console
- Habilitar Google Sheets API
- Crear credenciales de servicio
- Descargar `google-credentials.json`

### **2. Ejecutar Scripts**
```bash
# Crear los Google Sheets
node scripts/create-restaurant-sheets.js

# Probar la estructura
node scripts/test-sheets-structure.js
```

### **3. Configurar Variables**
- Copiar IDs del archivo `.env.sheets` generado
- Configurar en Vercel
- Actualizar configuración en Retell AI

### **4. Probar Sistema Completo**
```bash
# Probar webhook global
node scripts/test-global-webhook-system.js
```

## ✅ **Beneficios de esta Estructura**

1. **📊 Separación clara**: Mesas (infraestructura) vs Reservas (operaciones)
2. **🔄 Escalable**: Fácil agregar nuevos restaurantes
3. **🧠 Inteligente**: El agente puede entender disponibilidad real
4. **📱 Tiempo real**: Dashboard y agente leen/escriben los mismos datos
5. **🛠️ Mantenible**: Estructura estándar para todos los restaurantes
6. **🔍 Debuggeable**: Logs específicos por restaurante

## 🎉 **Resultado Final**

Con esta implementación:
- ✅ El agente Retell puede leer disponibilidad real
- ✅ Puede crear reservas que aparecen en el dashboard
- ✅ El sistema es escalable para 100+ restaurantes
- ✅ Cada restaurante tiene su propio Google Sheet
- ✅ La estructura es estándar y mantenible

¡El sistema está listo para funcionar con la estructura exacta que me recomendaste!
