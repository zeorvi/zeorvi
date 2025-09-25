import { NextRequest, NextResponse } from 'next/server';
import { getRestaurantConfig } from '@/lib/retellConfig';

// GET - Obtener información completa de La Gaviota para el agente
export async function GET() {
  try {
    const restaurantId = 'rest_003';
    const config = getRestaurantConfig(restaurantId);
    
    if (!config) {
      return NextResponse.json({
        success: false,
        error: 'Configuración de La Gaviota no encontrada'
      }, { status: 404 });
    }

    // Información completa del restaurante
    const restaurantInfo = {
      // Información básica
      id: config.restaurantId,
      name: config.restaurantName,
      type: config.restaurantType,
      specialty: config.restaurantSpecialty,
      ambiance: config.restaurantAmbiance,
      phone: config.phone,
      email: config.email,
      address: config.address,
      schedule: config.schedule,
      description: config.description,
      
      // Ubicaciones y mesas
      locations: config.locations,
      tables: config.tables,
      
      // Horarios disponibles
      availableTimes: config.availableTimes,
      
      // Especialidades
      specialties: config.specialties,
      
      // APIs disponibles para el agente
      availableAPIs: {
        reservations: {
          create: `POST /api/retell/reservations`,
          get: `GET /api/retell/reservations?restaurantId=${restaurantId}`,
          update: `PUT /api/retell/reservations/{id}`,
          cancel: `DELETE /api/retell/reservations/{id}`
        },
        tables: {
          get: `GET /api/retell/tables?restaurantId=${restaurantId}`,
          update: `PUT /api/retell/tables`
        },
        clients: {
          get: `GET /api/retell/clients?restaurantId=${restaurantId}`,
          create: `POST /api/retell/clients`
        },
        availability: {
          check: `GET /api/retell/check-availability?restaurantId=${restaurantId}`,
          smartBooking: `GET /api/retell/smart-booking?restaurantId=${restaurantId}`
        },
        dashboard: {
          info: `GET /api/retell/dashboard-info?restaurantId=${restaurantId}`,
          agenda: `GET /api/retell/agenda?restaurantId=${restaurantId}`
        }
      },
      
      // Instrucciones específicas para el agente
      agentInstructions: {
        greeting: `¡Hola! Bienvenido a ${config.restaurantName}. Soy su asistente virtual de reservas. ¿En qué puedo ayudarle?`,
        specialties: `Nuestras especialidades son: ${config.specialties.join(', ')}`,
        locations: `Tenemos las siguientes ubicaciones: ${config.locations.join(', ')}`,
        schedule: `Nuestros horarios son: ${config.schedule}`,
        phone: `Para confirmaciones, nuestro teléfono es: ${config.phone}`,
        address: `Estamos ubicados en: ${config.address}`
      }
    };

    return NextResponse.json({
      success: true,
      restaurant: restaurantInfo,
      timestamp: new Date().toISOString(),
      message: 'Información completa de La Gaviota disponible para el agente'
    });

  } catch (error) {
    console.error('Error getting La Gaviota info:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// POST - Procesar solicitud específica del agente de La Gaviota
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;
    
    const restaurantId = 'rest_003';
    
    switch (action) {
      case 'create_reservation':
        // Crear reserva usando la API de reservas
        const reservationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/retell/reservations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            restaurantId,
            source: 'retell-agent-la-gaviota'
          })
        });
        
        const reservationResult = await reservationResponse.json();
        return NextResponse.json({
          success: true,
          action: 'create_reservation',
          result: reservationResult,
          message: 'Reserva creada exitosamente'
        });
        
      case 'check_availability':
        // Verificar disponibilidad
        const availabilityResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/retell/check-availability?restaurantId=${restaurantId}&people=${data.people}&date=${data.date}&time=${data.time}`);
        const availabilityResult = await availabilityResponse.json();
        return NextResponse.json({
          success: true,
          action: 'check_availability',
          result: availabilityResult,
          message: 'Disponibilidad verificada'
        });
        
      case 'get_tables':
        // Obtener mesas disponibles
        const tablesResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/retell/tables?restaurantId=${restaurantId}&status=available`);
        const tablesResult = await tablesResponse.json();
        return NextResponse.json({
          success: true,
          action: 'get_tables',
          result: tablesResult,
          message: 'Mesas obtenidas'
        });
        
      case 'get_client_info':
        // Obtener información del cliente
        const clientResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/retell/clients?restaurantId=${restaurantId}&phone=${data.phone}`);
        const clientResult = await clientResponse.json();
        return NextResponse.json({
          success: true,
          action: 'get_client_info',
          result: clientResult,
          message: 'Información del cliente obtenida'
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Acción no reconocida'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error processing La Gaviota request:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
