const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

// Configuración de Firebase (usa las mismas variables de entorno)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function createRestaurantUser() {
  try {
    console.log('🚀 Creando usuario restaurante...');
    
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      'elbuensabor@restauranteia.com', 
      'admin123'
    );
    
    console.log('✅ Usuario creado en Firebase Auth:');
    console.log('   - UID:', userCredential.user.uid);
    console.log('   - Email:', userCredential.user.email);
    
    console.log('\n📝 Ahora necesitas agregar este usuario a userMapping.ts:');
    console.log(`
{
  username: 'elbuensabor',
  email: 'elbuensabor@restauranteia.com',
  role: 'restaurant',
  restaurantId: '${userCredential.user.uid}',
  restaurantName: 'El Buen Sabor',
  restaurantType: 'Familiar',
  airtableBaseId: 'appElBuenSabor${Date.now()}',
  airtableUrl: 'https://airtable.com/embed/appElBuenSabor${Date.now()}/tblReservas?backgroundColor=orange&view=viwReservasHoyFamiliar',
  retellConfig: {
    agentId: 'agent_elbuensabor_${Date.now()}',
    apiKey: 'retell_key_elbuensabor_${Math.random().toString(36).substring(2, 8)}',
    voiceId: 'voice_familiar_spanish',
    language: 'es-ES'
  },
  twilioConfig: {
    accountSid: 'AC_elbuensabor_${Date.now()}',
    authToken: 'auth_elbuensabor_${Math.random().toString(36).substring(2, 8)}',
    phoneNumber: '+1234567890',
    whatsappNumber: '+1234567890'
  }
}
    `);
    
    console.log('\n🎉 ¡Usuario creado exitosamente!');
    console.log('🔑 Credenciales:');
    console.log('   - Usuario: elbuensabor');
    console.log('   - Contraseña: admin123');
    console.log('   - URL: http://localhost:3001/');
    
  } catch (error) {
    console.error('❌ Error creando usuario:', error.message);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  El usuario ya existe. Puedes intentar hacer login directamente.');
    } else if (error.code === 'auth/weak-password') {
      console.log('ℹ️  La contraseña es muy débil. Intenta con una más fuerte.');
    }
  }
}

createRestaurantUser();

