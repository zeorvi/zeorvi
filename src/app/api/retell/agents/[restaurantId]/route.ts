import { NextRequest, NextResponse } from 'next/server';
import { sqliteDb } from '@/lib/database/sqlite';
import { logger } from '@/lib/logger';

export interface RetellAgentConfig {
  agentId: string;
  apiKey: string;
  voiceId: string;
  language: string;
  restaurantId: string;
  restaurantName: string;
  webhookUrl: string;
  functions: string[];
  prompt: string;
  createdAt: string;
  updatedAt: string;
}

// GET - Obtener configuración del agente para un restaurante específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params;

    // Verificar que el restaurante existe
    const restaurantData = await sqliteDb.getRestaurant(restaurantId);
    if (!restaurantData) {
      return NextResponse.json({
        success: false,
        error: `Restaurante ${restaurantId} no encontrado`
      }, { status: 404 });
    }

    // Obtener configuración del agente desde la base de datos
    const agentConfig = await getRetellAgentConfig(restaurantId);
    
    if (!agentConfig) {
      return NextResponse.json({
        success: false,
        error: `Configuración de agente no encontrada para restaurante ${restaurantId}`
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      restaurant: {
        id: restaurantData.id,
        name: restaurantData.name
      },
      agent: agentConfig
    });

  } catch (error) {
    logger.error('Error getting Retell agent config', {
      error: error instanceof Error ? error.message : 'Unknown error',
      restaurantId: (await params).restaurantId
    });

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// POST - Crear o actualizar configuración del agente
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params;
    const body = await request.json();

    // Verificar que el restaurante existe
    const restaurantData = await sqliteDb.getRestaurant(restaurantId);
    if (!restaurantData) {
      return NextResponse.json({
        success: false,
        error: `Restaurante ${restaurantId} no encontrado`
      }, { status: 404 });
    }

    // Validar datos requeridos
    const { agentId, voiceId, language, functions, prompt } = body;
    
    if (!agentId || !voiceId || !language) {
      return NextResponse.json({
        success: false,
        error: 'Faltan campos requeridos: agentId, voiceId, language'
      }, { status: 400 });
    }

    // Generar webhook URL específico para este restaurante
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com';
    const webhookUrl = `${baseUrl}/api/retell/webhook/${restaurantId}`;

    // Crear configuración del agente
    const agentConfig: RetellAgentConfig = {
      agentId,
      apiKey: process.env.RETELL_API_KEY || '',
      voiceId,
      language,
      restaurantId,
      restaurantName: restaurantData.name,
      webhookUrl,
      functions: functions || ['verificar_disponibilidad', 'crear_reserva'],
      prompt: prompt || generateDefaultPrompt({ name: restaurantData.name, type: 'restaurante' }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Guardar configuración en la base de datos
    await saveRetellAgentConfig(agentConfig);

    logger.info('Retell agent config created/updated', {
      restaurantId,
      agentId,
      webhookUrl
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración del agente creada/actualizada exitosamente',
      agent: agentConfig
    });

  } catch (error) {
    logger.error('Error creating/updating Retell agent config', {
      error: error instanceof Error ? error.message : 'Unknown error',
      restaurantId: (await params).restaurantId
    });

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// DELETE - Eliminar configuración del agente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params;

    // Verificar que el restaurante existe
    const restaurantData = await sqliteDb.getRestaurant(restaurantId);
    if (!restaurantData) {
      return NextResponse.json({
        success: false,
        error: `Restaurante ${restaurantId} no encontrado`
      }, { status: 404 });
    }

    // Eliminar configuración del agente
    await deleteRetellAgentConfig(restaurantId);

    logger.info('Retell agent config deleted', { restaurantId });

    return NextResponse.json({
      success: true,
      message: 'Configuración del agente eliminada exitosamente'
    });

  } catch (error) {
    logger.error('Error deleting Retell agent config', {
      error: error instanceof Error ? error.message : 'Unknown error',
      restaurantId: (await params).restaurantId
    });

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// Función para obtener configuración del agente desde la base de datos
async function getRetellAgentConfig(restaurantId: string): Promise<RetellAgentConfig | null> {
  try {
    // En producción, esto vendría de tu base de datos PostgreSQL
    // Por ahora usamos un mapeo temporal
    const configs: Record<string, RetellAgentConfig> = {
      'rest_003': {
        agentId: 'agent_2082fc7a622cdbd22441b22060',
        apiKey: process.env.RETELL_API_KEY || '',
        voiceId: 'es-ES-ElviraNeural',
        language: 'es-ES',
        restaurantId: 'rest_003',
        restaurantName: 'La Gaviota',
        webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com'}/api/retell/webhook/rest_003`,
        functions: ['verificar_disponibilidad', 'crear_reserva'],
        prompt: generateDefaultPrompt({ name: 'La Gaviota', type: 'Marisquería' }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      'rest_004': {
        agentId: 'agent_elbuensabor_001',
        apiKey: process.env.RETELL_API_KEY || '',
        voiceId: 'es-ES-ElviraNeural',
        language: 'es-ES',
        restaurantId: 'rest_004',
        restaurantName: 'El Buen Sabor',
        webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com'}/api/retell/webhook/rest_004`,
        functions: ['verificar_disponibilidad', 'crear_reserva'],
        prompt: generateDefaultPrompt({ name: 'El Buen Sabor', type: 'Familiar' }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    return configs[restaurantId] || null;
  } catch (error) {
    logger.error('Error getting Retell agent config from database', { error });
    return null;
  }
}

// Función para guardar configuración del agente en la base de datos
async function saveRetellAgentConfig(config: RetellAgentConfig): Promise<void> {
  try {
    // En producción, esto guardaría en PostgreSQL
    // Por ahora solo loggeamos
    logger.info('Saving Retell agent config', {
      restaurantId: config.restaurantId,
      agentId: config.agentId,
      webhookUrl: config.webhookUrl
    });
    
    // TODO: Implementar guardado en base de datos PostgreSQL
    // await postgresDb.query(
    //   'INSERT INTO retell_agent_configs (...) VALUES (...) ON CONFLICT (...) DO UPDATE SET ...',
    //   [config.restaurantId, config.agentId, ...]
    // );
  } catch (error) {
    logger.error('Error saving Retell agent config to database', { error });
    throw error;
  }
}

// Función para eliminar configuración del agente de la base de datos
async function deleteRetellAgentConfig(restaurantId: string): Promise<void> {
  try {
    // En producción, esto eliminaría de PostgreSQL
    logger.info('Deleting Retell agent config', { restaurantId });
    
    // TODO: Implementar eliminación en base de datos PostgreSQL
    // await postgresDb.query('DELETE FROM retell_agent_configs WHERE restaurant_id = $1', [restaurantId]);
  } catch (error) {
    logger.error('Error deleting Retell agent config from database', { error });
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
