import { NextRequest, NextResponse } from 'next/server';
import { aiAgentService } from '@/lib/services/aiAgentService';
import { verifyRetellWebhook } from '@/lib/webhookValidator';
import { logger } from '@/lib/logger';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener insights y reportes generados por IA
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const type = searchParams.get('type'); // 'insights' | 'reports' | 'calls' | 'incidents'
    const dateRange = {
      from: searchParams.get('from') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      to: searchParams.get('to') || new Date().toISOString()
    };

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID required' }, { status: 400 });
    }

    let data;

    switch (type) {
      case 'insights':
        data = await aiAgentService.generateInsights(restaurantId, dateRange);
        break;
      case 'reports':
        const reportType = searchParams.get('reportType') as 'daily' | 'weekly' | 'monthly' || 'weekly';
        data = await aiAgentService.generateReport(restaurantId, reportType);
        break;
      default:
        // Retornar todo
        const [insights, report] = await Promise.all([
          aiAgentService.generateInsights(restaurantId, dateRange),
          aiAgentService.generateReport(restaurantId, 'weekly')
        ]);
        data = { insights, report };
    }

    return NextResponse.json({
      success: true,
      data,
      restaurantId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in AI Manager API', { 
      error: (error as Error).message,
      action: 'GET_ai_manager'
    });
    return NextResponse.json({ 
      error: 'Error al obtener datos del gestor IA' 
    }, { status: 500 });
  }
}

// POST - Ejecutar acciones del gestor IA (generar reportes, implementar insights, etc.)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar webhook de Retell si viene de la IA
    if (body.source === 'retell') {
      const signature = request.headers.get('x-retell-signature') || '';
      const validation = verifyRetellWebhook(signature, JSON.stringify(body));
      if (!validation.valid) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    const { action, restaurantId, data } = body;

    if (!restaurantId || !action) {
      return NextResponse.json({ 
        error: 'Restaurant ID y action son requeridos' 
      }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'generate_report':
        const reportType = data?.type || 'weekly';
        const period = data?.period;
        result = await aiAgentService.generateReport(restaurantId, reportType, period);
        break;

      case 'make_outbound_call':
        const { agentId, toNumber, purpose, metadata } = data;
        result = await aiAgentService.makeOutboundCall(
          restaurantId, 
          agentId, 
          toNumber, 
          purpose, 
          metadata
        );
        break;

      case 'process_webhook':
        result = await aiAgentService.processWebhook(data);
        break;

      case 'generate_insights':
        const dateRange = data?.dateRange || {
          from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString()
        };
        result = await aiAgentService.generateInsights(restaurantId, dateRange);
        break;

      case 'create_agent':
        // Crear nuevo agente para restaurante
        result = await aiAgentService.createAgentForRestaurant(data.restaurant);
        break;

      default:
        return NextResponse.json({ 
          error: `Acción no reconocida: ${action}` 
        }, { status: 400 });
    }

    logger.info('AI Manager action executed', { 
      action, 
      restaurantId,
      success: true
    });

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error executing AI Manager action', { 
      error: (error as Error).message,
      action: 'POST_ai_manager'
    });
    return NextResponse.json({ 
      error: 'Error al ejecutar acción del gestor IA' 
    }, { status: 500 });
  }
}

// PUT - Actualizar configuración del gestor IA
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, config } = body;

    if (!restaurantId) {
      return NextResponse.json({ 
        error: 'Restaurant ID required' 
      }, { status: 400 });
    }

    // Mock implementation - en producción actualizaría la configuración en Firebase
    const updatedConfig = {
      ...config,
      updatedAt: new Date().toISOString(),
      updatedBy: 'ai_manager'
    };

    logger.info('AI Manager configuration updated', { 
      restaurantId,
      config: updatedConfig
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración del gestor IA actualizada',
      config: updatedConfig,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error updating AI Manager config', { 
      error: (error as Error).message,
      action: 'PUT_ai_manager'
    });
    return NextResponse.json({ 
      error: 'Error al actualizar configuración del gestor IA' 
    }, { status: 500 });
  }
}
