# 🍽️ Restaurante IA Plataforma - Guía de Configuración

## 📋 Prerrequisitos

- Node.js 18+ 
- Cuenta de Firebase
- Cuenta de Airtable
- Cuenta de Twilio
- Cuenta de Retell AI
- Cuenta de Gmail (para envío de emails)

## 🚀 Configuración Inicial

### 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Airtable Configuration
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_airtable_base_id

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Retell AI Configuration
RETELL_API_KEY=your_retell_api_key

# Email Configuration (Gmail API)
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
GMAIL_REFRESH_TOKEN=your_gmail_refresh_token
```

### 2. Configuración de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Habilita Authentication con Email/Password
4. Obtén las credenciales de configuración
5. Configura las reglas de Firestore (opcional para futuras funcionalidades)

### 3. Configuración de Airtable

Crea las siguientes tablas en tu base de Airtable:

#### Tabla: Restaurantes
- ID (Single line text)
- Nombre (Single line text)
- Email (Email)
- FirebaseUID (Single line text)
- NumeroTwilio (Phone number)
- Direccion (Long text)
- Activo (Checkbox)

#### Tabla: Mesas
- ID (Single line text)
- Numero (Number)
- Capacidad (Number)
- Ubicacion (Single line text)
- Restaurante (Link to Restaurantes)
- Disponible (Checkbox)

#### Tabla: Reservas
- ID (Single line text)
- Fecha (Date)
- Hora (Single line text)
- Personas (Number)
- Cliente (Single line text)
- Telefono (Phone number)
- Mesa (Link to Mesas)
- Estado (Single select: Pendiente, Confirmada, Cancelada, Completada)
- Notas (Long text)
- Restaurante (Link to Restaurantes)
- CreadoPorIA (Checkbox)

#### Tabla: Clientes
- ID (Single line text)
- Nombre (Single line text)
- Telefono (Phone number)
- Email (Email)
- HistorialReservas (Rollup field)
- Restaurante (Link to Restaurantes)

### 4. Configuración de Twilio

1. Ve a [Twilio Console](https://console.twilio.com/)
2. Compra un número de teléfono
3. Configura webhooks para Voice y WhatsApp:
   - Voice: `https://tu-dominio.com/api/twilio/webhook`
   - WhatsApp: `https://tu-dominio.com/api/twilio/webhook`

### 5. Configuración de Retell AI

1. Crea una cuenta en [Retell AI](https://retellai.com/)
2. Configura un agente para manejar reservas de restaurantes
3. Obtén tu API key
4. Configura el webhook para recibir eventos

## 🏃‍♂️ Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build
npm start
```

## 📱 Uso de la Plataforma

### Para Restaurantes

1. **Login**: Los restaurantes reciben credenciales por email
2. **Primer Login**: Fuerza cambio de contraseña
3. **Dashboard**: Ve su Airtable embebido con reservas y métricas
4. **Gestión**: Puede ver y gestionar reservas en tiempo real

### Para Administradores

1. **Panel Admin**: Accede a `/admin`
2. **Crear Restaurantes**: Formulario completo con todas las configuraciones
3. **Asignar Números**: Cada restaurante recibe un número Twilio único
4. **Envío de Credenciales**: Automático por email

### Flujo de Reservas Automáticas

1. **Cliente llama/envía WhatsApp** → Twilio recibe
2. **Twilio** → Retell AI procesa la conversación
3. **Retell AI** → Crea reserva en Airtable
4. **Restaurante** → Ve la reserva en su dashboard inmediatamente

## 🔧 Estructura del Proyecto

```
src/
├── app/
│   ├── login/           # Página de login
│   ├── dashboard/       # Dashboard principal
│   ├── admin/           # Panel de administración
│   ├── change-password/ # Cambio de contraseña
│   └── api/             # Rutas API
├── components/
│   ├── ui/              # Componentes UI (shadcn/ui)
│   └── auth/            # Componentes de autenticación
├── lib/
│   ├── firebase.ts      # Configuración Firebase
│   ├── config.ts        # Configuración general
│   └── utils.ts         # Utilidades
└── hooks/
    └── useAuth.ts       # Hook de autenticación
```

## 🚨 Notas Importantes

- **Seguridad**: Nunca expongas las API keys en el frontend
- **Webhooks**: Asegúrate de que tu dominio esté accesible públicamente
- **Airtable**: Configura las vistas filtradas por restaurante
- **Twilio**: Verifica que los números estén configurados correctamente
- **Retell AI**: Entrena el agente con ejemplos de conversaciones de reservas

## 🔮 Próximas Funcionalidades

- [ ] Confirmación automática de reservas
- [ ] Recordatorios por WhatsApp/SMS
- [ ] Reportes de ocupación con IA
- [ ] Multi-sucursal
- [ ] Sistema de suscripciones con Stripe
- [ ] Integración con sistemas POS
- [ ] App móvil para restaurantes

## 🆘 Soporte

Si tienes problemas con la configuración, revisa:

1. Variables de entorno correctas
2. Permisos en Firebase Auth
3. Configuración de webhooks en Twilio
4. Estructura de tablas en Airtable
5. Configuración del agente en Retell AI
