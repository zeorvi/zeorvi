import { NextRequest, NextResponse } from 'next/server';
import { RestaurantSheetsManager, RestaurantConfig } from '@/lib/restaurantSheetsManager';
import { RetellAgentManager } from '@/lib/retellAgentManager';

// POST - Crear nuevo restaurante con configuración automática
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address, phone, email, capacity, features } = body;

    // Validar campos requeridos
    if (!name || !address || !phone || !email || !capacity) {
      return NextResponse.json({
        success: false,
        error: 'Faltan campos requeridos: name, address, phone, email, capacity'
      }, { status: 400 });
    }

    // Generar ID único para el restaurante
    const restaurantId = `rest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Crear configuración del restaurante
    const restaurantConfig: RestaurantConfig = {
      id: restaurantId,
      name: name,
      address: address,
      phone: phone,
      email: email,
      capacity: parseInt(capacity),
      features: features || [],
      tables: generateTables(parseInt(capacity)),
      schedules: generateDefaultSchedules()
    };

    // 1. Crear Google Sheets independiente para el restaurante
    const sheetsResult = await RestaurantSheetsManager.createRestaurantSheets(restaurantConfig);

    if (!sheetsResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Error creando Google Sheets independiente del restaurante'
      }, { status: 500 });
    }

    // 2. Crear agente de Retell AI para el restaurante
    const retellResult = await RetellAgentManager.createRestaurantAgent({
      restaurantId: restaurantId,
      restaurantName: name,
      phoneNumber: phone,
      spreadsheetId: sheetsResult.spreadsheetId,
      webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/retell/webhook`,
      language: 'es',
      voice: 'alloy',
      model: 'gpt-4o-mini'
    });

    if (!retellResult.success) {
      console.warn(`⚠️ Google Sheets creado pero Retell AI falló: ${retellResult.error}`);
    }

    return NextResponse.json({
      success: true,
      restaurant: {
        id: restaurantId,
        name: name,
        address: address,
        phone: phone,
        email: email,
        capacity: parseInt(capacity),
        features: features || [],
        tables: restaurantConfig.tables,
        schedules: restaurantConfig.schedules,
        googleSheets: {
          spreadsheetId: sheetsResult.spreadsheetId,
          spreadsheetUrl: sheetsResult.spreadsheetUrl,
          created: true
        },
        retellAI: {
          agentId: retellResult.agentId,
          webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/retell/webhook`,
          configured: retellResult.success,
          error: retellResult.error
        },
        dashboard: {
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/${restaurantId}`,
          available: true
        }
      },
      message: 'Restaurante creado exitosamente con Google Sheets independiente y Retell AI configurado'
    });

  } catch (error) {
    console.error('Error creando restaurante:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// Función para generar mesas automáticamente
function generateTables(capacity: number) {
  const tables = [];
  let tableNumber = 1;
  let remainingCapacity = capacity;

  // Generar mesas de diferentes tamaños
  const tableTypes = [
    { size: 2, count: Math.floor(capacity * 0.4) / 2 }, // 40% mesas de 2
    { size: 4, count: Math.floor(capacity * 0.4) / 4 }, // 40% mesas de 4
    { size: 6, count: Math.floor(capacity * 0.15) / 6 }, // 15% mesas de 6
    { size: 8, count: Math.floor(capacity * 0.05) / 8 }  // 5% mesas de 8
  ];

  for (const tableType of tableTypes) {
    for (let i = 0; i < tableType.count; i++) {
      tables.push({
        id: `table_${tableNumber}`,
        number: `Mesa ${tableNumber}`,
        capacity: tableType.size,
        location: getTableLocation(tableNumber, capacity),
        type: getTableType(tableNumber, capacity)
      });
      tableNumber++;
      remainingCapacity -= tableType.size;
    }
  }

  // Agregar mesas restantes si es necesario
  while (remainingCapacity > 0) {
    const tableSize = Math.min(4, remainingCapacity);
    tables.push({
      id: `table_${tableNumber}`,
      number: `Mesa ${tableNumber}`,
      capacity: tableSize,
      location: getTableLocation(tableNumber, capacity),
      type: getTableType(tableNumber, capacity)
    });
    tableNumber++;
    remainingCapacity -= tableSize;
  }

  return tables;
}

// Función para determinar la ubicación de la mesa
function getTableLocation(tableNumber: number, capacity: number): string {
  const totalTables = Math.ceil(capacity / 4);
  const section = Math.ceil((tableNumber / totalTables) * 4);
  
  switch (section) {
    case 1: return 'Salón Principal';
    case 2: return 'Terraza';
    case 3: return 'Salón Privado';
    case 4: return 'Barra';
    default: return 'Salón Principal';
  }
}

// Función para determinar el tipo de mesa
function getTableType(tableNumber: number, capacity: number): 'indoor' | 'outdoor' | 'private' {
  const totalTables = Math.ceil(capacity / 4);
  const section = Math.ceil((tableNumber / totalTables) * 3);
  
  switch (section) {
    case 1: return 'indoor';
    case 2: return 'outdoor';
    case 3: return 'private';
    default: return 'indoor';
  }
}

// Función para generar horarios por defecto
function generateDefaultSchedules() {
  return [
    { day: 'Lunes', openTime: '12:00', closeTime: '23:00', isOpen: true },
    { day: 'Martes', openTime: '12:00', closeTime: '23:00', isOpen: true },
    { day: 'Miércoles', openTime: '12:00', closeTime: '23:00', isOpen: true },
    { day: 'Jueves', openTime: '12:00', closeTime: '23:00', isOpen: true },
    { day: 'Viernes', openTime: '12:00', closeTime: '24:00', isOpen: true },
    { day: 'Sábado', openTime: '12:00', closeTime: '24:00', isOpen: true },
    { day: 'Domingo', openTime: '12:00', closeTime: '22:00', isOpen: true }
  ];
}
