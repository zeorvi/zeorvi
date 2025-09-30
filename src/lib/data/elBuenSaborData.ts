// Datos de ejemplo realistas para Restaurante El Buen Sabor
import { Restaurant, Employee, InventoryItem, Call, Client, Order } from '@/lib/types/restaurant';

export const elBuenSaborRestaurant: Restaurant = {
  id: 'rest_el_buen_sabor',
  name: 'Restaurante El Buen Sabor',
  type: 'restaurante',
  address: 'Av. Insurgentes Sur 1234, Col. Del Valle, CDMX 03100',
  phone: '+34655550100',
  email: 'contacto@elbuensabor.mx',
  website: 'https://www.elbuensabor.mx',
  
  operatingHours: {
    monday: { open: '12:00', close: '22:00', closed: false },
    tuesday: { open: '12:00', close: '22:00', closed: false },
    wednesday: { open: '12:00', close: '22:00', closed: false },
    thursday: { open: '12:00', close: '22:00', closed: false },
    friday: { open: '12:00', close: '23:00', closed: false },
    saturday: { open: '11:00', close: '23:00', closed: false },
    sunday: { open: '11:00', close: '22:00', closed: false }
  },
  
  aiAgent: {
    retellAgentId: 'agent_el_buen_sabor_001',
    phoneNumber: '+34655550101',
    voiceSettings: {
      voice: 'es-ES-Neural2-A',
      speed: 1.0,
      pitch: 0
    },
    language: 'es',
    personality: 'Cálido, familiar y acogedor. Siempre menciona que somos un restaurante familiar con tradición.',
    customInstructions: [
      'Siempre preguntar por alergias y preferencias dietéticas',
      'Mencionar nuestras especialidades: mole poblano y cochinita pibil',
      'Ofrecer mesa cerca de ventana para familias con niños',
      'Informar sobre descuentos para adultos mayores (10%)',
      'Confirmar si necesitan silla alta para bebés'
    ]
  },
  
  menu: {
    categories: [
      {
        id: 'entradas',
        name: 'Entradas',
        description: 'Deliciosos aperitivos tradicionales',
        displayOrder: 1,
        active: true,
        items: [
          {
            id: 'guacamole',
            name: 'Guacamole El Buen Sabor',
            description: 'Aguacate fresco con tomate, cebolla, chile serrano y limón',
            price: 85,
            category: 'entradas',
            allergens: [],
            dietary: ['vegetarian', 'vegan', 'gluten_free'],
            available: true,
            preparationTime: 8,
            ingredients: ['Aguacate', 'Tomate', 'Cebolla', 'Chile serrano', 'Limón', 'Cilantro']
          },
          {
            id: 'quesadillas',
            name: 'Quesadillas de Flor de Calabaza',
            description: 'Tortillas hechas a mano con queso Oaxaca y flor de calabaza',
            price: 120,
            category: 'entradas',
            allergens: ['lactosa', 'gluten'],
            dietary: ['vegetarian'],
            available: true,
            preparationTime: 12,
            ingredients: ['Tortilla de maíz', 'Queso Oaxaca', 'Flor de calabaza', 'Epazote']
          }
        ]
      },
      {
        id: 'especialidades',
        name: 'Especialidades de la Casa',
        description: 'Platillos tradicionales con receta familiar',
        displayOrder: 2,
        active: true,
        items: [
          {
            id: 'mole_poblano',
            name: 'Mole Poblano de la Abuela',
            description: 'Pollo en mole poblano con receta de 3 generaciones',
            price: 285,
            category: 'especialidades',
            allergens: ['nueces', 'ajonjolí'],
            dietary: [],
            available: true,
            preparationTime: 25,
            ingredients: ['Pollo', 'Chiles poblanos', 'Chocolate', 'Especias secretas', 'Ajonjolí']
          },
          {
            id: 'cochinita_pibil',
            name: 'Cochinita Pibil Yucateca',
            description: 'Cerdo marinado en achiote, cocido en hoja de plátano',
            price: 265,
            category: 'especialidades',
            allergens: [],
            dietary: ['gluten_free'],
            available: true,
            preparationTime: 20,
            ingredients: ['Cerdo', 'Achiote', 'Naranja agria', 'Hoja de plátano', 'Cebolla morada']
          }
        ]
      }
    ],
    specialOffers: [
      {
        id: 'domingo_familiar',
        name: 'Domingo Familiar',
        description: 'Descuento del 15% en mesas de 4 o más personas los domingos',
        type: 'discount',
        discount: 15,
        validFrom: '2025-01-01',
        validTo: '2025-12-31',
        conditions: ['Solo domingos', 'Mínimo 4 personas', 'No aplica con otras promociones'],
        active: true
      },
      {
        id: 'adultos_mayores',
        name: 'Respeto a Nuestros Mayores',
        description: 'Descuento del 10% para adultos mayores de 65 años',
        type: 'discount',
        discount: 10,
        validFrom: '2025-01-01',
        validTo: '2025-12-31',
        conditions: ['Presentar identificación', 'Válido todos los días', 'Máximo 2 personas por mesa'],
        active: true
      }
    ]
  },
  
  tables: [],
  staff: [],
  inventory: [],
  
  notifications: {
    whatsapp: true,
    email: true,
    sms: true,
    push: true,
    emailRecipients: ['gerente@elbuensabor.mx', 'chef@elbuensabor.mx']
  },
  
  settings: {
    timezone: 'America/Mexico_City',
    currency: 'MXN',
    taxRate: 16,
    serviceCharge: 10,
    reservationPolicy: 'Las reservas pueden cancelarse hasta 2 horas antes sin costo. Política familiar flexible.',
    cancellationPolicy: 'Cancelaciones tardías: 50% del costo estimado. Familias con emergencias exentas.',
    maxAdvanceBookingDays: 30,
    minAdvanceBookingHours: 2
  },
  
  createdAt: '2023-03-15T00:00:00Z',
  updatedAt: new Date().toISOString(),
  createdBy: 'admin_001',
  status: 'active'
};

export const elBuenSaborEmployees: Employee[] = [
  {
    id: 'emp_001',
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria.vasquez@elbuensabor.mx',
    phone: '+34611110001',
    role: 'manager',
    status: 'active',
    schedule: {
      monday: { start: '11:00', end: '21:00', break: '16:00-17:00', off: false },
      tuesday: { start: '11:00', end: '21:00', break: '16:00-17:00', off: false },
      wednesday: { start: '11:00', end: '21:00', break: '16:00-17:00', off: false },
      thursday: { start: '11:00', end: '21:00', break: '16:00-17:00', off: false },
      friday: { start: '11:00', end: '22:00', break: '16:00-17:00', off: false },
      saturday: { start: '10:00', end: '22:00', break: '15:00-16:00', off: false },
      sunday: { start: '10:00', end: '21:00', break: '15:00-16:00', off: false }
    },
    salary: { type: 'monthly', amount: 18000, currency: 'MXN' },
    performance: {
      rating: 4.9,
      reviews: ['Excelente liderazgo', 'Muy organizada', 'Gran atención al cliente'],
      attendance: 98
    },
    hiredDate: '2023-03-15',
    emergencyContact: {
      name: 'Roberto Vásquez',
      phone: '+34611110002',
      relationship: 'Esposo'
    }
  },
  {
    id: 'emp_002',
    firstName: 'Pedro',
    lastName: 'Martinez',
    email: 'jose.hernandez@elbuensabor.mx',
    phone: '+34622220001',
    role: 'chef',
    status: 'active',
    schedule: {
      monday: { start: '10:00', end: '20:00', break: '15:00-16:00', off: false },
      tuesday: { start: '10:00', end: '20:00', break: '15:00-16:00', off: false },
      wednesday: { start: '10:00', end: '20:00', break: '15:00-16:00', off: false },
      thursday: { start: '10:00', end: '20:00', break: '15:00-16:00', off: false },
      friday: { start: '10:00', end: '21:00', break: '15:00-16:00', off: false },
      saturday: { start: '09:00', end: '21:00', break: '14:00-15:00', off: false },
      sunday: { off: true }
    },
    salary: { type: 'monthly', amount: 16000, currency: 'MXN' },
    performance: {
      rating: 4.8,
      reviews: ['Especialista en mole', 'Muy creativo', 'Mantiene cocina impecable'],
      attendance: 96
    },
    hiredDate: '2023-04-01',
    emergencyContact: {
      name: 'Carmen Hernández',
      phone: '+34622220002',
      relationship: 'Madre'
    }
  },
  {
    id: 'emp_003',
    firstName: 'Ana',
    lastName: 'Ruiz',
    email: 'ana.morales@elbuensabor.mx',
    phone: '+34633330001',
    role: 'waiter',
    status: 'active',
    schedule: {
      monday: { start: '11:30', end: '21:30', off: false },
      tuesday: { start: '11:30', end: '21:30', off: false },
      wednesday: { start: '11:30', end: '21:30', off: false },
      thursday: { start: '11:30', end: '21:30', off: false },
      friday: { start: '11:30', end: '22:30', off: false },
      saturday: { start: '10:30', end: '22:30', off: false },
      sunday: { start: '10:30', end: '21:30', off: false }
    },
    salary: { type: 'hourly', amount: 75, currency: 'MXN' },
    performance: {
      rating: 4.7,
      reviews: ['Muy amable con familias', 'Excelente con niños', 'Conoce bien el menú'],
      attendance: 94
    },
    hiredDate: '2023-05-10',
    emergencyContact: {
      name: 'Patricia Morales',
      phone: '+34633330002',
      relationship: 'Hermana'
    }
  },
  {
    id: 'emp_004',
    firstName: 'Luis',
    lastName: 'Garcia',
    email: 'roberto.garcia@elbuensabor.mx',
    phone: '+34644440001',
    role: 'waiter',
    status: 'active',
    schedule: {
      monday: { start: '11:30', end: '21:30', off: false },
      tuesday: { start: '11:30', end: '21:30', off: false },
      wednesday: { off: true },
      thursday: { start: '11:30', end: '21:30', off: false },
      friday: { start: '11:30', end: '22:30', off: false },
      saturday: { start: '10:30', end: '22:30', off: false },
      sunday: { start: '10:30', end: '21:30', off: false }
    },
    salary: { type: 'hourly', amount: 75, currency: 'MXN' },
    performance: {
      rating: 4.5,
      reviews: ['Muy puntual', 'Buena memoria para órdenes', 'Servicio eficiente'],
      attendance: 92
    },
    hiredDate: '2023-06-20',
    emergencyContact: {
      name: 'Lucía García',
      phone: '+34644440002',
      relationship: 'Esposa'
    }
  },
  {
    id: 'emp_005',
    firstName: 'Carmen',
    lastName: 'Perez',
    email: 'carmen.jimenez@elbuensabor.mx',
    phone: '+34655550001',
    role: 'host',
    status: 'active',
    schedule: {
      monday: { start: '11:00', end: '20:00', off: false },
      tuesday: { start: '11:00', end: '20:00', off: false },
      wednesday: { start: '11:00', end: '20:00', off: false },
      thursday: { start: '11:00', end: '20:00', off: false },
      friday: { start: '11:00', end: '21:00', off: false },
      saturday: { start: '10:00', end: '21:00', off: false },
      sunday: { off: true }
    },
    salary: { type: 'hourly', amount: 70, currency: 'MXN' },
    performance: {
      rating: 4.8,
      reviews: ['Excelente trato con familias', 'Muy organizada', 'Siempre sonriente'],
      attendance: 97
    },
    hiredDate: '2023-07-01',
    emergencyContact: {
      name: 'Miguel Jiménez',
      phone: '+34655550002',
      relationship: 'Hermano'
    }
  }
];

export const elBuenSaborInventory: InventoryItem[] = [
  {
    id: 'inv_001',
    name: 'Chiles Poblanos',
    category: 'ingredients',
    currentStock: 8,
    minStock: 5,
    maxStock: 20,
    unit: 'kg',
    costPerUnit: 45,
    supplier: 'Mercado San Juan',
    supplierContact: '+34612345678',
    expirationDate: '2025-09-25',
    location: 'Refrigerador Principal',
    lastRestocked: '2025-09-20',
    autoReorder: true,
    reorderPoint: 5,
    status: 'in_stock'
  },
  {
    id: 'inv_002',
    name: 'Chocolate para Mole',
    category: 'ingredients',
    currentStock: 2,
    minStock: 3,
    maxStock: 10,
    unit: 'kg',
    costPerUnit: 180,
    supplier: 'Chocolates Tradicionales',
    supplierContact: '+34623456789',
    location: 'Despensa Seca',
    lastRestocked: '2025-09-15',
    autoReorder: true,
    reorderPoint: 3,
    status: 'low_stock'
  },
  {
    id: 'inv_003',
    name: 'Tortillas de Maíz',
    category: 'ingredients',
    currentStock: 0,
    minStock: 10,
    maxStock: 50,
    unit: 'kg',
    costPerUnit: 25,
    supplier: 'Tortillería La Guadalupana',
    supplierContact: '+34634567890',
    location: 'Área de Tortillas',
    lastRestocked: '2025-09-20',
    autoReorder: true,
    reorderPoint: 10,
    status: 'out_of_stock'
  },
  {
    id: 'inv_004',
    name: 'Queso Oaxaca',
    category: 'ingredients',
    currentStock: 12,
    minStock: 5,
    maxStock: 25,
    unit: 'kg',
    costPerUnit: 120,
    supplier: 'Lácteos Oaxaqueños',
    supplierContact: '+34645678901',
    expirationDate: '2025-09-28',
    location: 'Refrigerador Principal',
    lastRestocked: '2025-09-19',
    autoReorder: true,
    reorderPoint: 5,
    status: 'in_stock'
  },
  {
    id: 'inv_005',
    name: 'Cerveza Corona',
    category: 'beverages',
    currentStock: 48,
    minStock: 24,
    maxStock: 120,
    unit: 'botellas',
    costPerUnit: 18,
    supplier: 'Distribuidora de Bebidas',
    supplierContact: '+34656789012',
    location: 'Refrigerador de Bebidas',
    lastRestocked: '2025-09-18',
    autoReorder: true,
    reorderPoint: 24,
    status: 'in_stock'
  }
];

export const elBuenSaborCalls: Call[] = [
  {
    id: 'call_001',
    restaurantId: 'rest_el_buen_sabor',
    retellCallId: 'retell_001',
    direction: 'inbound',
    fromNumber: '+34612345678',
    toNumber: '+34655550101',
    status: 'completed',
    duration: 195,
    startTime: '2025-09-21T11:30:00Z',
    endTime: '2025-09-21T11:33:15Z',
    purpose: 'reservation',
    outcome: 'successful',
    transcript: 'Cliente: Buenos días, quisiera hacer una reserva para hoy... IA: ¡Buenos días! Claro que sí, será un placer atenderle en El Buen Sabor...',
    summary: 'Reserva exitosa para familia Rodríguez, 5 personas, 12:30 PM, mesa grande cerca de ventana solicitada.',
    actionItems: ['Preparar mesa M12 cerca de ventana', 'Tener sillas altas disponibles', 'Informar a Ana Sofía sobre la familia'],
    clientId: 'client_001',
    reservationId: 'res_001',
    rating: 5,
    cost: 3.25,
    createdAt: '2025-09-21T11:30:00Z',
    tags: ['familia', 'domingo', 'ventana', 'niños']
  },
  {
    id: 'call_002',
    restaurantId: 'rest_el_buen_sabor',
    retellCallId: 'retell_002',
    direction: 'inbound',
    fromNumber: '+34623456789',
    toNumber: '+34655550101',
    status: 'completed',
    duration: 142,
    startTime: '2025-09-21T12:15:00Z',
    endTime: '2025-09-21T12:17:22Z',
    purpose: 'reservation',
    outcome: 'successful',
    summary: 'Reserva especial para aniversario de bodas, Carlos y Elena Martínez, mesa romántica solicitada.',
    actionItems: ['Preparar mesa M5 con velas', 'Sugerir vino tinto de la casa', 'Informar al chef sobre ocasión especial'],
    clientId: 'client_002',
    reservationId: 'res_002',
    rating: 5,
    cost: 2.37,
    createdAt: '2025-09-21T12:15:00Z',
    tags: ['aniversario', 'romántico', 'vino', 'especial']
  },
  {
    id: 'call_003',
    restaurantId: 'rest_el_buen_sabor',
    retellCallId: 'retell_003',
    direction: 'outbound',
    fromNumber: '+34655550101',
    toNumber: '+34634567890',
    status: 'completed',
    duration: 89,
    startTime: '2025-09-21T13:45:00Z',
    endTime: '2025-09-21T13:46:29Z',
    purpose: 'inquiry',
    outcome: 'successful',
    summary: 'Confirmación de reserva empresarial para 8 personas, mesa privada confirmada.',
    actionItems: ['Preparar mesa M15 en área privada', 'Verificar WiFi en esa zona', 'Menú ejecutivo disponible'],
    reservationId: 'res_003',
    rating: 4,
    cost: 1.48,
    createdAt: '2025-09-21T13:45:00Z',
    tags: ['empresarial', 'confirmación', 'privacidad', 'wifi']
  }
];

export const elBuenSaborClients: Client[] = [
  {
    id: 'client_001',
    restaurantId: 'rest_el_buen_sabor',
    firstName: 'Pedro',
    lastName: 'Garcia',
    phone: '+34612345678',
    email: 'pedro.rodriguez@email.com',
    birthday: '1978-05-15',
    preferences: {
      dietary: ['Sin picante para los niños'],
      allergies: [],
      favoriteTable: 'M12',
      preferredTime: '12:30',
      notes: 'Familia regular, vienen todos los domingos. Tienen 3 niños pequeños.'
    },
    visitHistory: [
      { date: '2025-09-14', partySize: 5, totalSpent: 850, tableId: 'M12', rating: 5, feedback: 'Excelente como siempre' },
      { date: '2025-09-07', partySize: 5, totalSpent: 920, tableId: 'M12', rating: 5 },
      { date: '2025-08-31', partySize: 6, totalSpent: 1050, tableId: 'M15', rating: 5, feedback: 'Trajimos a la abuela, le encantó' }
    ],
    loyalty: {
      points: 285,
      tier: 'gold',
      totalSpent: 12450,
      totalVisits: 18
    },
    marketing: {
      allowSMS: true,
      allowEmail: true,
      allowWhatsApp: true,
      segments: ['familia_regular', 'domingo_familiar']
    },
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2025-09-21T11:33:00Z',
    status: 'active'
  },
  {
    id: 'client_002',
    restaurantId: 'rest_el_buen_sabor',
    firstName: 'Jose',
    lastName: 'Lopez',
    phone: '+34623456789',
    email: 'jose.lopez@email.com',
    birthday: '1985-11-20',
    preferences: {
      dietary: ['Vegetariano ocasional'],
      allergies: [],
      favoriteTable: 'M5',
      preferredTime: '20:00',
      notes: 'Pareja joven, celebran fechas especiales aquí. Les gusta el vino.'
    },
    visitHistory: [
      { date: '2025-08-20', partySize: 2, totalSpent: 650, tableId: 'M5', rating: 5, feedback: 'Perfecto para nuestro aniversario' },
      { date: '2025-07-15', partySize: 2, totalSpent: 580, tableId: 'M1', rating: 4 },
      { date: '2025-06-10', partySize: 2, totalSpent: 720, tableId: 'M5', rating: 5 }
    ],
    loyalty: {
      points: 195,
      tier: 'silver',
      totalSpent: 3890,
      totalVisits: 8
    },
    marketing: {
      allowSMS: true,
      allowEmail: true,
      allowWhatsApp: false,
      segments: ['pareja_joven', 'ocasiones_especiales']
    },
    createdAt: '2023-08-15T00:00:00Z',
    updatedAt: '2025-09-21T12:17:00Z',
    status: 'active'
  }
];

export const todayMetrics = {
  revenue: 12450,
  orders: 15,
  customers: 32,
  calls: {
    received: 8,
    answered: 8,
    effectiveness: 100
  },
  tables: {
    total: 18,
    occupied: 12,
    available: 6,
    reserved: 7
  },
  staff: {
    total: 8,
    onDuty: 6,
    attendance: 95
  }
};
