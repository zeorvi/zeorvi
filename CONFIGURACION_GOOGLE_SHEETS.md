# Configuración de Google Sheets API - Estructura Completa

## 🏗️ Estructura de Google Sheets por Restaurante

Cada restaurante tendrá un Google Sheet con **3 hojas**:

### 📘 Google Sheets del restaurante "La Gaviota"
```
├── Mesas (infraestructura fija)
├── Reservas (reservas confirmadas)  
└── Turnos (horarios de servicio)
```

## 🪑 Hoja 1: Mesas

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

## 📆 Hoja 2: Reservas

Donde el agente de Retell escribe y lee cada reserva:

| ID | Fecha | Hora | Turno | Cliente | Teléfono | Personas | Zona | Mesa | Estado | Notas | Creado |
|----|-------|------|-------|---------|----------|----------|------|------|--------|-------|--------|
| R001 | 2024-01-20 | 21:00 | Cena | María García | +34 666 123 456 | 4 | Terraza | M6 | Confirmada | Mesa cerca ventana | 2024-01-20 17:35 |
| R002 | 2024-01-21 | 13:30 | Comida | Juan López | +34 666 789 012 | 2 | Comedor 1 | M1 | Pendiente | Aniversario | 2024-01-20 18:10 |

## ⏰ Hoja 3: Turnos

Control de horarios de servicio:

| Turno | Inicio | Fin |
|-------|--------|-----|
| Comida | 13:00 | 16:00 |
| Cena | 20:00 | 23:30 |

## 🚀 Configuración Automática

### Paso 1: Configurar Google API

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google Sheets:
   - Ve a "APIs y servicios" → "Biblioteca"
   - Busca "Google Sheets API"
   - Haz clic en "Habilitar"

### Paso 2: Crear credenciales de servicio

1. Ve a "APIs y servicios" → "Credenciales"
2. Haz clic en "Crear credenciales" → "Cuenta de servicio"
3. Completa los datos:
   - Nombre: "restaurante-ai-sheets"
   - Descripción: "Servicio para gestionar Google Sheets de restaurantes"
4. Haz clic en "Crear y continuar"
5. Asigna el rol "Editor" o "Propietario"
6. Haz clic en "Listo"

### Paso 3: Descargar clave JSON

1. En la lista de cuentas de servicio, haz clic en la que acabas de crear
2. Ve a la pestaña "Claves"
3. Haz clic en "Agregar clave" → "Crear nueva clave"
4. Selecciona "JSON" y haz clic en "Crear"
5. Descarga el archivo JSON

### Paso 4: Configurar el archivo de credenciales

1. Renombra el archivo descargado a `google-credentials.json`
2. Colócalo en la raíz de tu proyecto
3. Agrega `google-credentials.json` a tu `.gitignore`

### Paso 5: Configurar variables de entorno

Agrega a tu archivo `.env`:

```bash
GOOGLE_CREDENTIALS_PATH=google-credentials.json
GOOGLE_PROJECT_ID=tu-project-id
```

### Paso 6: Ejecutar el script de creación

```bash
node scripts/create-restaurant-sheets.js
```

Este script:
- ✅ Creará automáticamente los Google Sheets para cada restaurante
- ✅ Configurará las 3 hojas (Mesas, Reservas, Turnos) con las columnas correctas
- ✅ Agregará datos de ejemplo para cada restaurante
- ✅ Generará un archivo `.env.sheets` con los IDs reales
- ✅ Formateará los encabezados con colores

### Paso 7: Configurar en Vercel

Copia las variables del archivo `.env.sheets` a las variables de entorno de Vercel:

```bash
LA_GAVIOTA_SHEET_ID=1BvXyZ1234567890abcdefghijklmnop
EL_BUEN_SABOR_SHEET_ID=1CwXyZ0987654321zyxwvutsrqponmlk
RESTAURANT_001_SHEET_ID=1DxXyZ2468135790zyxwvutsrqponmlk
RESTAURANT_002_SHEET_ID=1ExXyZ1357924680zyxwvutsrqponmlk
```

## 🧠 Cómo funciona el agente de Retell

### Flujo de reserva:

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

## ✅ Verificación

Después de ejecutar el script, deberías ver:

```
🏪 La Gaviota (rest_003):
   ID: 1BvXyZ1234567890abcdefghijklmnop
   URL: https://docs.google.com/spreadsheets/d/1BvXyZ1234567890abcdefghijklmnop/edit
   ✅ Hojas: Mesas (8 mesas), Reservas (ejemplos), Turnos (2 turnos)

🏪 El Buen Sabor (rest_004):
   ID: 1CwXyZ0987654321zyxwvutsrqponmlk
   URL: https://docs.google.com/spreadsheets/d/1CwXyZ0987654321zyxwvutsrqponmlk/edit
   ✅ Hojas: Mesas (6 mesas), Reservas (ejemplos), Turnos (2 turnos)
```

¡Y esos serán los IDs reales que necesitas usar!