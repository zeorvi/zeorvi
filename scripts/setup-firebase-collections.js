// Script para configurar colecciones de Firebase
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

async function setupFirebaseCollections() {
  console.log('🔥 Configurando colecciones de Firebase...\n');

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
      },
      {
        id: 'rest_002',
        name: 'La Parrilla del Chef',
        email: 'chef@laparrilla.com',
        phone: '+34666555444',
        address: 'Avenida Central 456, Barcelona',
        type: 'Gourmet',
        status: 'active',
        createdAt: new Date(),
        retellConfig: {
          agentId: 'agent_laparrilla_002',
          apiKey: 'retell_key_laparrilla_456',
          voiceId: 'voice_gourmet_spanish',
          language: 'es-ES'
        },
        twilioConfig: {
          accountSid: 'AC_laparrilla_456',
          authToken: 'auth_laparrilla_789',
          phoneNumber: '+34666555444',
          whatsappNumber: '+34666555444'
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
      },
      {
        id: 'M10',
        restaurantId: 'rest_001',
        name: 'M10',
        capacity: 2,
        status: 'libre',
        location: 'Interior',
        lastUpdated: new Date()
      },
      {
        id: 'M18',
        restaurantId: 'rest_001',
        name: 'M18',
        capacity: 6,
        status: 'reservada',
        location: 'Terraza',
        clientId: 'C003',
        reservationId: 'R003',
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
      },
      {
        id: 'C003',
        name: 'María Gómez',
        phone: '+34123456789',
        email: 'maria.gomez@email.com',
        totalReservations: 5,
        lastVisit: new Date('2024-01-15'),
        preferences: ['Terraza', 'Cumpleaños'],
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
      },
      {
        id: 'R003',
        clientId: 'C003',
        tableId: 'M18',
        restaurantId: 'rest_001',
        date: new Date(),
        time: '21:00',
        duration: 150,
        people: 4,
        status: 'pendiente',
        source: 'llamada',
        notes: 'Cumpleaños, tarta incluida',
        createdAt: new Date()
      }
    ];

    for (const reservation of reservations) {
      await setDoc(doc(db, 'reservations', reservation.id), reservation);
      console.log(`   ✅ Reserva creada: ${reservation.id} (${reservation.status})`);
    }

    // 5. Colección de Notificaciones
    console.log('\n🔔 Creando colección de Notificaciones...');
    const notifications = [
      {
        id: 'notif_001',
        restaurantId: 'rest_001',
        type: 'reservation',
        title: 'Nueva Reserva Confirmada',
        message: 'Mesa M6 reservada para Luis Fernández a las 20:00',
        data: { tableId: 'M6', clientName: 'Luis Fernández', time: '20:00' },
        read: false,
        createdAt: new Date()
      },
      {
        id: 'notif_002',
        restaurantId: 'rest_001',
        type: 'call',
        title: 'Llamada Recibida',
        message: 'Cliente interesado en reserva para 4 personas',
        data: { phone: '+34123456789', people: 4 },
        read: false,
        createdAt: new Date()
      }
    ];

    for (const notification of notifications) {
      await setDoc(doc(db, 'notifications', notification.id), notification);
      console.log(`   ✅ Notificación creada: ${notification.title}`);
    }

    // 6. Colección de Métricas
    console.log('\n📊 Creando colección de Métricas...');
    const metrics = {
      restaurantId: 'rest_001',
      date: new Date().toISOString().split('T')[0],
      totalTables: 5,
      occupiedTables: 1,
      reservedTables: 2,
      freeTables: 2,
      todayReservations: 3,
      weekReservations: 15,
      monthReservations: 45,
      averageOccupancy: 60,
      peakHours: ['20:00', '21:00', '22:00'],
      lastUpdated: new Date()
    };

    await setDoc(doc(db, 'metrics', 'rest_001_today'), metrics);
    console.log('   ✅ Métricas creadas para el restaurante');

    console.log('\n🎉 ¡Colecciones de Firebase configuradas exitosamente!');
    console.log('\n📋 Colecciones creadas:');
    console.log('   • restaurants - Información de restaurantes');
    console.log('   • tables - Mesas y sus estados');
    console.log('   • clients - Datos de clientes');
    console.log('   • reservations - Reservas del sistema');
    console.log('   • notifications - Notificaciones en tiempo real');
    console.log('   • metrics - Métricas y estadísticas');
    
    console.log('\n🌐 Ahora puedes acceder a:');
    console.log('   • http://localhost:3001/ (Login Restaurante)');
    console.log('   • http://localhost:3001/admin-login (Login Admin)');
    console.log('   • http://localhost:3001/demo (Página de demostración)');

  } catch (error) {
    console.error('❌ Error configurando Firebase:', error);
  }
}

setupFirebaseCollections().catch(console.error);

