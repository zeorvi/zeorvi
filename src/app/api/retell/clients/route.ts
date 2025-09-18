import { NextRequest, NextResponse } from 'next/server';
import { verifyRetellWebhook } from '@/lib/webhookValidator';
import { logger } from '@/lib/logger';

// GET - Buscar cliente por teléfono o consultar todos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID required' }, { status: 400 });
    }

    // Mock data de clientes
    const allClients = [
      {
        id: 'cli_001',
        nombre: 'Juan Pérez',
        telefono: '+34 600 123 456',
        email: 'juan@email.com',
        fechaRegistro: '2024-01-01',
        ultimaVisita: '2024-01-15',
        totalReservas: 8,
        mesaPreferida: 'Terraza',
        notasEspeciales: 'Alérgico a mariscos',
        historialReservas: [
          { fecha: '2024-01-15', hora: '20:00', personas: 4, mesa: 'M5' },
          { fecha: '2024-01-10', hora: '19:30', personas: 2, mesa: 'M3' }
        ]
      },
      {
        id: 'cli_002',
        nombre: 'María García',
        telefono: '+34 601 234 567',
        email: 'maria@email.com',
        fechaRegistro: '2024-01-05',
        ultimaVisita: '2024-01-12',
        totalReservas: 3,
        mesaPreferida: 'Salón Principal',
        notasEspeciales: 'Prefiere mesa cerca de la ventana',
        historialReservas: [
          { fecha: '2024-01-12', hora: '21:00', personas: 6, mesa: 'M8' },
          { fecha: '2024-01-08', hora: '19:00', personas: 2, mesa: 'M2' }
        ]
      },
      {
        id: 'cli_003',
        nombre: 'Carlos López',
        telefono: '+34 602 345 678',
        email: 'carlos@email.com',
        fechaRegistro: '2024-01-03',
        ultimaVisita: '2024-01-14',
        totalReservas: 5,
        mesaPreferida: 'Salón Privado',
        notasEspeciales: 'Cliente VIP - Celebraciones familiares',
        historialReservas: [
          { fecha: '2024-01-14', hora: '20:30', personas: 8, mesa: 'M7' },
          { fecha: '2024-01-07', hora: '19:30', personas: 4, mesa: 'M4' }
        ]
      }
    ];

    // Si se busca por teléfono específico
    if (phone) {
      const client = allClients.find(c => c.telefono === phone);
      if (!client) {
        return NextResponse.json({
          success: false,
          message: 'Cliente no encontrado',
          data: null
        });
      }

      return NextResponse.json({
        success: true,
        data: client,
        message: `Información de ${client.nombre} encontrada`
      });
    }

    // Si no se especifica teléfono, devolver todos los clientes
    return NextResponse.json({
      success: true,
      data: {
        clientes: allClients,
        total: allClients.length,
        clientesVIP: allClients.filter(c => c.totalReservas >= 5),
        nuevosClientes: allClients.filter(c => c.totalReservas <= 2)
      }
    });

  } catch (error) {
    logger.error('Error fetching client data for Retell', { error });
    return NextResponse.json({ 
      error: 'Error al obtener información de clientes' 
    }, { status: 500 });
  }
}

// POST - Registrar nuevo cliente desde Retell
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar webhook de Retell
    const isValid = await verifyRetellWebhook(request, body);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const { nombre, telefono, email, notasEspeciales, restaurantId } = body;

    const newClient = {
      id: `cli_${Date.now()}`,
      nombre,
      telefono,
      email: email || '',
      fechaRegistro: new Date().toISOString(),
      ultimaVisita: new Date().toISOString(),
      totalReservas: 0,
      mesaPreferida: '',
      notasEspeciales: notasEspeciales || '',
      historialReservas: []
    };

    logger.info('New client registered via Retell', { 
      clientId: newClient.id,
      nombre,
      restaurantId 
    });

    return NextResponse.json({
      success: true,
      client: newClient,
      message: `Cliente ${nombre} registrado exitosamente`
    });

  } catch (error) {
    logger.error('Error registering client via Retell', { error });
    return NextResponse.json({ 
      error: 'Error al registrar cliente' 
    }, { status: 500 });
  }
}

