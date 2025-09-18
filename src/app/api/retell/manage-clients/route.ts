import { NextRequest, NextResponse } from 'next/server';
import { getClientById, mockClients } from '@/lib/restaurantData';
import { logger } from '@/lib/logger';

// GET - Buscar y consultar clientes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const name = searchParams.get('name');
    const clientId = searchParams.get('clientId');
    const action = searchParams.get('action') || 'search';
    
    let resultado: any = {};
    
    switch (action) {
      case 'search':
        // Buscar cliente por teléfono o nombre
        let clientesEncontrados = mockClients;
        
        if (phone) {
          clientesEncontrados = clientesEncontrados.filter(client => 
            client.phone.includes(phone.replace(/\s/g, ''))
          );
        }
        
        if (name) {
          clientesEncontrados = clientesEncontrados.filter(client => 
            client.name.toLowerCase().includes(name.toLowerCase())
          );
        }
        
        resultado = {
          accion: 'busqueda_cliente',
          criterios: { phone, name },
          clientes_encontrados: clientesEncontrados.map(client => ({
            id: client.id,
            nombre: client.name,
            telefono: client.phone,
            total_reservas: client.totalReservations,
            ultima_visita: client.lastVisit?.toLocaleDateString('es-ES'),
            preferencias: client.preferences || [],
            es_cliente_frecuente: client.totalReservations >= 5,
            es_cliente_vip: client.totalReservations >= 10
          })),
          total_encontrados: clientesEncontrados.length,
          mensaje_para_agente: clientesEncontrados.length > 0
            ? `Encontré ${clientesEncontrados.length} cliente(s). ${clientesEncontrados[0].name} es ${clientesEncontrados[0].totalReservations >= 5 ? 'cliente frecuente' : 'cliente nuevo'}.`
            : 'No encontré ningún cliente con esos datos. Será un cliente nuevo.'
        };
        break;
        
      case 'profile':
        // Perfil completo de cliente específico
        if (!clientId && !phone) {
          return NextResponse.json(
            { error: 'clientId o phone requerido para consultar perfil' },
            { status: 400 }
          );
        }
        
        let cliente = null;
        if (clientId) {
          cliente = getClientById(clientId);
        } else if (phone) {
          cliente = mockClients.find(c => c.phone.includes(phone.replace(/\s/g, '')));
        }
        
        if (!cliente) {
          resultado = {
            accion: 'perfil_cliente',
            encontrado: false,
            mensaje_para_agente: 'Cliente no encontrado en la base de datos. Es un cliente nuevo.'
          };
        } else {
          resultado = {
            accion: 'perfil_cliente',
            encontrado: true,
            cliente: {
              id: cliente.id,
              nombre: cliente.name,
              telefono: cliente.phone,
              total_reservas: cliente.totalReservations,
              ultima_visita: cliente.lastVisit?.toLocaleDateString('es-ES'),
              preferencias: cliente.preferences || [],
              categoria: cliente.totalReservations >= 10 ? 'VIP' :
                        cliente.totalReservations >= 5 ? 'Frecuente' : 'Regular',
              historial_reciente: `${cliente.totalReservations} reservas realizadas`
            },
            mensaje_para_agente: `${cliente.name} es cliente ${cliente.totalReservations >= 5 ? 'frecuente' : 'regular'} con ${cliente.totalReservations} reservas. ${cliente.preferences?.length ? `Prefiere: ${cliente.preferences.join(', ')}.` : ''}`
          };
        }
        break;
        
      case 'all':
        // Todos los clientes con estadísticas
        resultado = {
          accion: 'todos_los_clientes',
          total_clientes: mockClients.length,
          clientes_vip: mockClients.filter(c => c.totalReservations >= 10).length,
          clientes_frecuentes: mockClients.filter(c => c.totalReservations >= 5).length,
          clientes_nuevos: mockClients.filter(c => c.totalReservations < 5).length,
          
          lista_clientes: mockClients.map(client => ({
            nombre: client.name,
            telefono: client.phone,
            categoria: client.totalReservations >= 10 ? 'VIP' :
                      client.totalReservations >= 5 ? 'Frecuente' : 'Regular',
            total_reservas: client.totalReservations
          })),
          
          mensaje_para_agente: `Base de datos: ${mockClients.length} clientes registrados. ${mockClients.filter(c => c.totalReservations >= 10).length} VIP, ${mockClients.filter(c => c.totalReservations >= 5).length} frecuentes.`
        };
        break;
        
      default:
        return NextResponse.json(
          { error: `Acción '${action}' no reconocida` },
          { status: 400 }
        );
    }
    
    return NextResponse.json(resultado);
    
  } catch (error) {
    logger.error('Error en consulta de clientes desde Retell', { error });
    return NextResponse.json(
      { error: 'Error al consultar clientes' },
      { status: 500 }
    );
  }
}

// POST - Crear o actualizar cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action = 'create',
      clientName,
      clientPhone,
      preferences,
      notes,
      clientId
    } = body;
    
    if (action === 'create') {
      if (!clientName || !clientPhone) {
        return NextResponse.json(
          { error: 'clientName y clientPhone son requeridos' },
          { status: 400 }
        );
      }
      
      // Verificar si el cliente ya existe
      const clienteExistente = mockClients.find(c => 
        c.phone.includes(clientPhone.replace(/\s/g, ''))
      );
      
      if (clienteExistente) {
        return NextResponse.json({
          accion: 'cliente_existente',
          cliente: {
            id: clienteExistente.id,
            nombre: clienteExistente.name,
            telefono: clienteExistente.phone,
            total_reservas: clienteExistente.totalReservations
          },
          mensaje_para_agente: `${clienteExistente.name} ya está en nuestra base de datos con ${clienteExistente.totalReservations} reservas anteriores.`
        });
      }
      
      // Crear nuevo cliente
      const nuevoCliente = {
        id: `C${Date.now()}`,
        name: clientName,
        phone: clientPhone,
        totalReservations: 0,
        lastVisit: new Date(),
        preferences: preferences || []
      };
      
      mockClients.push(nuevoCliente);
      
      return NextResponse.json({
        accion: 'cliente_creado',
        cliente: {
          id: nuevoCliente.id,
          nombre: nuevoCliente.name,
          telefono: nuevoCliente.phone
        },
        mensaje_para_agente: `Cliente nuevo ${clientName} registrado correctamente en la base de datos.`
      });
      
    } else if (action === 'update') {
      // Actualizar cliente existente
      if (!clientId) {
        return NextResponse.json(
          { error: 'clientId requerido para actualizar' },
          { status: 400 }
        );
      }
      
      const clientIndex = mockClients.findIndex(c => c.id === clientId);
      if (clientIndex === -1) {
        return NextResponse.json(
          { error: 'Cliente no encontrado' },
          { status: 404 }
        );
      }
      
      // Actualizar datos
      if (clientName) mockClients[clientIndex].name = clientName;
      if (clientPhone) mockClients[clientIndex].phone = clientPhone;
      if (preferences) mockClients[clientIndex].preferences = preferences;
      
      return NextResponse.json({
        accion: 'cliente_actualizado',
        cliente: mockClients[clientIndex],
        mensaje_para_agente: `Información de ${mockClients[clientIndex].name} actualizada correctamente.`
      });
    }
    
  } catch (error) {
    logger.error('Error en gestión de cliente desde Retell', { error });
    return NextResponse.json(
      { error: 'Error al gestionar cliente' },
      { status: 500 }
    );
  }
}
