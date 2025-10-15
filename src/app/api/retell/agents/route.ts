import { NextRequest, NextResponse } from 'next/server';
import { sqliteDb } from '@/lib/database/sqlite';
import { logger } from '@/lib/logger';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export interface RetellAgentSummary {
  restaurantId: string;
  restaurantName: string;
  agentId: string;
  webhookUrl: string;
  status: 'active' | 'inactive' | 'pending';
  lastCall?: string;
  totalCalls?: number;
}

// GET - Listar todos los agentes Retell configurados
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Obtener todos los restaurantes
    const restaurants = await sqliteDb.getAllRestaurants();
    
    // Generar resumen de agentes
    const agents: RetellAgentSummary[] = [];
    
    for (const restaurant of restaurants) {
      const agentConfig = await getRetellAgentConfig(restaurant.id);
      
      if (agentConfig) {
        agents.push({
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          agentId: agentConfig.agentId,
          webhookUrl: agentConfig.webhookUrl,
          status: 'active', // En producción esto vendría de la base de datos
          lastCall: undefined, // TODO: Implementar tracking de llamadas
          totalCalls: 0 // TODO: Implementar contador de llamadas
        });
      }
    }

    // Filtrar por estado si se especifica
    let filteredAgents = agents;
    if (status) {
      filteredAgents = agents.filter(agent => agent.status === status);
    }

    // Aplicar paginación
    const paginatedAgents = filteredAgents.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      agents: paginatedAgents,
      pagination: {
        total: filteredAgents.length,
        limit,
        offset,
        hasMore: offset + limit < filteredAgents.length
      },
      summary: {
        total: agents.length,
        active: agents.filter(a => a.status === 'active').length,
        inactive: agents.filter(a => a.status === 'inactive').length,
        pending: agents.filter(a => a.status === 'pending').length
      }
    });

  } catch (error) {
    logger.error('Error listing Retell agents', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// POST - Crear múltiples agentes en lote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurants } = body;

    if (!Array.isArray(restaurants)) {
      return NextResponse.json({
        success: false,
        error: 'Se esperaba un array de restaurantes'
      }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (const restaurantConfig of restaurants) {
      try {
        const { restaurantId, agentId, voiceId, language, functions, prompt } = restaurantConfig;

        // Verificar que el restaurante existe
        const restaurantData = await sqliteDb.getRestaurant(restaurantId);
        if (!restaurantData) {
          errors.push({
            restaurantId,
            error: 'Restaurante no encontrado'
          });
          continue;
        }

        // Generar webhook URL específico para este restaurante
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com';
        const webhookUrl = `${baseUrl}/api/retell/webhook/${restaurantId}`;

        // Crear configuración del agente
        const agentConfig = {
          agentId,
          apiKey: process.env.RETELL_API_KEY || '',
          voiceId: voiceId || 'es-ES-ElviraNeural',
          language: language || 'es-ES',
          restaurantId,
          restaurantName: restaurantData.name,
          webhookUrl,
          functions: functions || ['verificar_disponibilidad', 'crear_reserva'],
          prompt: prompt || generateDefaultPrompt({ name: restaurantData.name, type: 'restaurante' }),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Guardar configuración
        await saveRetellAgentConfig(agentConfig);

        results.push({
          restaurantId,
          agentId,
          webhookUrl,
          status: 'created'
        });

        logger.info('Retell agent created in batch', {
          restaurantId,
          agentId,
          webhookUrl
        });

      } catch (error) {
        errors.push({
          restaurantId: restaurantConfig.restaurantId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Procesados ${restaurants.length} restaurantes`,
      results,
      errors,
      summary: {
        successful: results.length,
        failed: errors.length
      }
    });

  } catch (error) {
    logger.error('Error creating Retell agents in batch', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// Función para obtener configuración del agente desde la base de datos
async function getRetellAgentConfig(restaurantId: string): Promise<any | null> {
  try {
    // En producción, esto vendría de tu base de datos PostgreSQL
    const configs: Record<string, any> = {
      'rest_003': {
        agentId: 'agent_2082fc7a622cdbd22441b22060',
        webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com'}/api/retell/webhook/rest_003`
      },
      'rest_004': {
        agentId: 'agent_elbuensabor_001',
        webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com'}/api/retell/webhook/rest_004`
      }
    };

    return configs[restaurantId] || null;
  } catch (error) {
    logger.error('Error getting Retell agent config from database', { error });
    return null;
  }
}

// Función para guardar configuración del agente en la base de datos
async function saveRetellAgentConfig(config: any): Promise<void> {
  try {
    // En producción, esto guardaría en PostgreSQL
    logger.info('Saving Retell agent config', {
      restaurantId: config.restaurantId,
      agentId: config.agentId,
      webhookUrl: config.webhookUrl
    });
    
    // TODO: Implementar guardado en base de datos PostgreSQL
  } catch (error) {
    logger.error('Error saving Retell agent config to database', { error });
    throw error;
  }
}

// Función para generar prompt por defecto basado en el restaurante
function generateDefaultPrompt(restaurant: { name: string; type: string }): string {
  return `Eres el asistente de voz de ${restaurant.name}, un restaurante de tipo ${restaurant.type}.

Tu función principal es:
1. Saludar amablemente a los clientes que llaman
2. Responder preguntas sobre el restaurante (horarios, ubicación, especialidades)
3. Tomar reservas cuando los clientes lo soliciten
4. Verificar disponibilidad antes de confirmar reservas

Instrucciones importantes:
- Siempre sé amable y profesional
- Si un cliente quiere hacer una reserva, pregunta por: fecha, hora, número de personas, nombre y teléfono
- Antes de confirmar una reserva, verifica la disponibilidad usando las funciones disponibles
- Si no hay disponibilidad, ofrece alternativas cercanas
- Mantén las conversaciones naturales y fluidas

Información del restaurante:
- Nombre: ${restaurant.name}
- Tipo: ${restaurant.type}
- Horarios: 13:00-16:00 y 20:00-23:30
- Teléfono: +34 912 345 678

Recuerda usar las funciones disponibles para verificar disponibilidad y crear reservas.`;
}
