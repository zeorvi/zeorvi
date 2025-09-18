// Script para configurar usuarios de demostración
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');

// Configuración de Firebase (usa las mismas variables de entorno)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAG5jbPwaSubn-VAr5m23_wSRbcD67oX24",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "restaurante-ia-plataforma.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "restaurante-ia-plataforma",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "restaurante-ia-plataforma.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "734662568631",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:734662568631:web:516d037518bc5ae1683b32"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function createDemoUsers() {
  console.log('🚀 Creando usuarios de demostración...\n');

  const users = [
    {
      email: 'admin@restauranteia.com',
      password: 'admin123',
      role: 'admin',
      username: 'admin'
    },
    {
      email: 'admin@elbuensabor.com',
      password: 'restaurante123',
      role: 'restaurant',
      username: 'elbuensabor',
      restaurantName: 'Restaurante El Buen Sabor',
      restaurantType: 'Familiar'
    }
  ];

  for (const user of users) {
    try {
      console.log(`📝 Creando usuario: ${user.username} (${user.email})`);
      
      // Intentar crear el usuario
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
      console.log(`✅ Usuario ${user.username} creado exitosamente`);
      console.log(`   UID: ${userCredential.user.uid}`);
      console.log(`   Email: ${userCredential.user.email}`);
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️  Usuario ${user.username} ya existe, saltando...`);
      } else {
        console.error(`❌ Error creando usuario ${user.username}:`, error.message);
      }
    }
  }

  console.log('\n🎉 Configuración de usuarios completada!');
  console.log('\n📋 Credenciales de acceso:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👨‍💼 ADMINISTRADOR:');
  console.log('   Usuario: admin');
  console.log('   Contraseña: admin123');
    console.log('   URL: http://localhost:3000/');
  console.log('');
  console.log('🍽️  RESTAURANTE:');
  console.log('   Usuario: elbuensabor');
  console.log('   Contraseña: restaurante123');
  console.log('   URL: http://localhost:3000/');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

createDemoUsers().catch(console.error);
