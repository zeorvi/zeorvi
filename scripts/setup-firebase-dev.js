// Script para configurar colecciones de Firebase en modo desarrollo
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, addDoc } = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAG5jbPwaSubn-VAr5m23_wSRbcD67oX24",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "restaurante-ia-plataforma.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "restaurante-ia-plataforma",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "restaurante-ia-plataforma.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "734662568631",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:734662568631:web:516d037518bc5ae1683b32"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setupFirebaseCollectionsDev() {
  console.log('🔥 Configurando colecciones de Firebase (Modo Desarrollo)...\n');
  console.log('⚠️  IMPORTANTE: Asegúrate de que las reglas de Firestore estén en modo desarrollo');
  console.log('   Ve a Firebase Console > Firestore > Rules y cambia a:');
  console.log('   rules_version = \'2\';');
  console.log('   service cloud.firestore {');
  console.log('     match /databases/{database}/documents {');
  console.log('       match /{document=**} {');
  console.log('         allow read, write: if true;');
  console.log('       }');
  console.log('     }');
  console.log('   }');
  console.log('');

  try {
    // 1. Colección de Restaurantes
    console.log('📊 Creando colección de Restaurantes...');
    const restaurants = [
      {
        id: 'rest_001',
        name: 'Restaurante El Buen Sabor',
        email: 'admin@elbuensabor.com',
        phone: '+34123456789',
        address: 'Calle Principal 123, Madrid',
        type: 'Familiar',
        status: 'active',
        createdAt: new Date(),
        retellConfig: {
          agentId: 'agent_elbuensabor_001',
          apiKey: 'retell_key_elbuensabor_123',
          voiceId: 'voice_familiar_spanish',
          language: 'es-ES'
        },
        twilioConfig: {
          accountSid: 'AC_elbuensabor_123',
          authToken: 'auth_elbuensabor_456',
          phoneNumber: '+34123456789',
          whatsappNumber: '+34123456789'
        }
      }
    ];

    for (const restaurant of restaurants) {
      await setDoc(doc(db, 'restaurants', restaurant.id), restaurant);
      console.log(`   ✅ Restaurante creado: ${restaurant.name}`);
    }

    // 2. Colección de Mesas
    console.log('\n🪑 Creando colección de Mesas...');
    const tables = [
      {
        id: 'M1',
        restaurantId: 'rest_001',
        name: 'M1',
        capacity: 4,
        status: 'libre',
        location: 'Terraza',
        lastUpdated: new Date()
      },
      {
        id: 'M6',
        restaurantId: 'rest_001',
        name: 'M6',
        capacity: 2,
        status: 'reservada',
        location: 'Interior',
        clientId: 'C001',
        reservationId: 'R001',
        lastUpdated: new Date()
      },
      {
        id: 'M14',
        restaurantId: 'rest_001',
        name: 'M14',
        capacity: 6,
        status: 'ocupada',
        location: 'Salón Principal',
        clientId: 'C002',
        reservationId: 'R002',
        lastUpdated: new Date()
      }
    ];

    for (const table of tables) {
      await setDoc(doc(db, 'tables', table.id), table);
      console.log(`   ✅ Mesa creada: ${table.name} (${table.status})`);
    }

    // 3. Colección de Clientes
    console.log('\n👥 Creando colección de Clientes...');
    const clients = [
      {
        id: 'C001',
        name: 'Luis Fernández',
        phone: '+34987654321',
        email: 'luis.fernandez@email.com',
        totalReservations: 3,
        lastVisit: new Date('2024-01-10'),
        preferences: ['Terraza', 'Sin ruido'],
        createdAt: new Date()
      },
      {
        id: 'C002',
        name: 'Ana Ruiz',
        phone: '+34666555444',
        email: 'ana.ruiz@email.com',
        totalReservations: 1,
        lastVisit: new Date(),
        preferences: ['Salón Principal'],
        createdAt: new Date()
      }
    ];

    for (const client of clients) {
      await setDoc(doc(db, 'clients', client.id), client);
      console.log(`   ✅ Cliente creado: ${client.name}`);
    }

    // 4. Colección de Reservas
    console.log('\n📅 Creando colección de Reservas...');
    const reservations = [
      {
        id: 'R001',
        clientId: 'C001',
        tableId: 'M6',
        restaurantId: 'rest_001',
        date: new Date(),
        time: '20:00',
        duration: 120,
        people: 2,
        status: 'confirmada',
        source: 'llamada',
        notes: 'Mesa romántica, sin ruido',
        createdAt: new Date(),
        confirmedAt: new Date()
      },
      {
        id: 'R002',
        clientId: 'C002',
        tableId: 'M14',
        restaurantId: 'rest_001',
        date: new Date(),
        time: '19:30',
        duration: 90,
        people: 6,
        status: 'confirmada',
        source: 'whatsapp',
        notes: 'Celebración familiar',
        createdAt: new Date(),
        confirmedAt: new Date()
      }
    ];

    for (const reservation of reservations) {
      await setDoc(doc(db, 'reservations', reservation.id), reservation);
      console.log(`   ✅ Reserva creada: ${reservation.id} (${reservation.status})`);
    }

    console.log('\n🎉 ¡Colecciones de Firebase configuradas exitosamente!');
    console.log('\n📋 Colecciones creadas:');
    console.log('   • restaurants - Información de restaurantes');
    console.log('   • tables - Mesas y sus estados');
    console.log('   • clients - Datos de clientes');
    console.log('   • reservations - Reservas del sistema');
    
    console.log('\n🌐 Ahora puedes acceder a:');
    console.log('   • http://localhost:3001/ (Login Restaurante)');
    console.log('   • http://localhost:3001/admin-login (Login Admin)');
    console.log('   • http://localhost:3001/demo (Página de demostración)');

  } catch (error) {
    console.error('❌ Error configurando Firebase:', error);
    console.log('\n🔧 Solución:');
    console.log('1. Ve a Firebase Console: https://console.firebase.google.com/');
    console.log('2. Selecciona tu proyecto: restaurante-ia-plataforma');
    console.log('3. Ve a Firestore Database > Rules');
    console.log('4. Cambia las reglas a modo desarrollo:');
    console.log('   rules_version = \'2\';');
    console.log('   service cloud.firestore {');
    console.log('     match /databases/{database}/documents {');
    console.log('       match /{document=**} {');
    console.log('         allow read, write: if true;');
    console.log('       }');
    console.log('     }');
    console.log('   }');
    console.log('5. Ejecuta de nuevo: npm run setup-firebase-dev');
  }
}

setupFirebaseCollectionsDev().catch(console.error);

