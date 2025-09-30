// Script para crear el usuario administrador inicial
// Ejecutar con: node scripts/create-admin.js

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

// Configuración de Firebase (usa las mismas variables de entorno)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:demo123456',
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function createAdminUser() {
  try {
    const email = 'admin@restauranteia.com';
    const password = 'Admin123!';
    const username = 'admin';
    
    console.log('🔐 Creando usuario administrador...');
    console.log(`👤 Usuario: ${username}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Contraseña: ${password}`);
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Usuario administrador creado exitosamente!');
    console.log(`🆔 UID: ${user.uid}`);
    console.log('');
    console.log('📋 Credenciales de acceso:');
    console.log(`   Usuario: ${username}`);
    console.log(`   Contraseña: ${password}`);
    console.log('');
    console.log('🌐 Accede al panel de administración: http://localhost:3000/admin-login');
    console.log('💡 Usa el usuario "admin" para hacer login como administrador');
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️  El usuario administrador ya existe');
      console.log('👤 Usuario: admin');
      console.log('📧 Email: admin@restauranteia.com');
      console.log('🔑 Contraseña: Admin123!');
    } else {
      console.error('❌ Error al crear usuario administrador:', error.message);
    }
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  createAdminUser();
}

module.exports = { createAdminUser };
