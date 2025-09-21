import { NextRequest, NextResponse } from 'next/server';
import { getMesasParaLiberarAutomaticamente, completeReservationAutomatically, getTableStatusForRetell, updateTableStatus } from '@/lib/restaurantData';
import { logger } from '@/lib/logger';

// GET - Estado completo de mesas para Retell con limpieza automática
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId') || 'default';
    const includeCleanup = searchParams.get('includeCleanup') === 'true';
    
    // Ejecutar limpieza automática si se solicita
    if (includeCleanup) {
      // Verificar mesas que deben liberarse automáticamente
      const mesasParaLiberar = getMesasParaLiberarAutomaticamente();
      
      if (mesasParaLiberar.length > 0) {
        logger.info(`Liberando ${mesasParaLiberar.length} mesa(s) automáticamente`, {
          mesas: mesasParaLiberar.map(m => ({ 
            id: m.tableId, 
            cliente: m.clientName, 
            tiempoOcupada: `${m.timeOccupied} minutos` 
          }))
        });
        
        // Liberar cada mesa automáticamente
        mesasParaLiberar.forEach(mesa => {
          const resultado = completeReservationAutomatically(mesa.tableId);
          if (resultado.success) {
            logger.info(`Mesa ${mesa.tableId} liberada: ${resultado.message}`);
          }
        });
      }
    }
    
    // Obtener estado actualizado de las mesas
    const estadoMesas = getTableStatusForRetell();
    
    // Información específica para el agente de Retell
    const respuestaParaRetell = {
      restaurante_id: restaurantId,
      timestamp: new Date().toISOString(),
      
      resumen_ejecutivo: {
        mesas_disponibles_ahora: estadoMesas.libres,
        mesas_ocupadas_actualmente: estadoMesas.ocupadas,
        mesas_con_reserva_pendiente: estadoMesas.reservadas,
        total_mesas_restaurante: estadoMesas.total,
        porcentaje_ocupacion: Math.round(((estadoMesas.ocupadas + estadoMesas.reservadas) / estadoMesas.total) * 100)
      },
      
      disponibilidad_inmediata: {
        puede_recibir_clientes: estadoMesas.libres > 0,
        mesas_por_capacidad: estadoMesas.detalles_libres.reduce((acc, mesa) => {
          const cap = mesa.capacidad;
          acc[`${cap}_personas`] = (acc[`${cap}_personas`] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        
        ubicaciones_disponibles: estadoMesas.detalles_libres.reduce((acc, mesa) => {
          acc[mesa.ubicacion] = (acc[mesa.ubicacion] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      
      mesas_ocupadas_info: estadoMesas.detalles_ocupadas.map(mesa => ({
        mesa_id: mesa.tableId,
        cliente: mesa.clientName,
        tiempo_ocupada_minutos: mesa.timeOccupied,
        tiempo_restante_minutos: mesa.timeRemaining,
        estado_limpieza: mesa.status,
        se_liberara_automaticamente: mesa.shouldCleanup,
        mensaje_para_agente: mesa.status === 'overdue' 
          ? `Mesa ${mesa.tableId} está retrasada, se liberará automáticamente pronto`
          : mesa.status === 'warning'
          ? `Mesa ${mesa.tableId} está por terminar su tiempo (${mesa.timeRemaining} min restantes)`
          : `Mesa ${mesa.tableId} ocupada normalmente (${mesa.timeRemaining} min restantes)`
      })),
      
      mesas_reservadas_info: estadoMesas.detalles_reservadas.map(reserva => ({
        mesa_id: reserva.mesa,
        cliente: reserva.cliente,
        hora_reserva: reserva.hora,
        personas: reserva.personas,
        estado_reserva: reserva.estado,
        mensaje_para_agente: reserva.estado === 'pendiente'
          ? `Mesa ${reserva.mesa} reservada para ${reserva.cliente} a las ${reserva.hora} - Cliente aún no ha llegado`
          : `Mesa ${reserva.mesa} confirmada para ${reserva.cliente} a las ${reserva.hora}`
      })),
      
      instrucciones_para_retell: {
        como_ofrecer_mesas: estadoMesas.libres > 0 
          ? `Tienes ${estadoMesas.libres} mesa(s) disponible(s) ahora mismo. Puedes confirmar reserva inmediatamente.`
          : 'No hay mesas libres en este momento. Ofrece turnos futuros o lista de espera.',
          
        turnos_recomendados: estadoMesas.libres === 0 
          ? 'Como no hay mesas libres, consulta /api/retell/smart-booking para ver próximos turnos disponibles'
          : 'Hay mesas disponibles para reserva inmediata',
          
        manejo_de_espera: estadoMesas.detalles_ocupadas.length > 0
          ? `${estadoMesas.detalles_ocupadas.filter(m => m.timeRemaining <= 30).length} mesa(s) se liberarán en los próximos 30 minutos`
          : 'No hay mesas próximas a liberarse'
      }
    };
    
    return NextResponse.json(respuestaParaRetell);
    
  } catch (error) {
    logger.error('Error al obtener estado de mesas para Retell', { error });
    return NextResponse.json(
      { error: 'Error al consultar estado de mesas' },
      { status: 500 }
    );
  }
}

// POST - Forzar limpieza de mesa específica
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableId, reason = 'Limpieza manual desde Retell' } = body;
    
    if (!tableId) {
      return NextResponse.json(
        { error: 'tableId es requerido' },
        { status: 400 }
      );
    }
    
    // Liberar la mesa específica
    updateTableStatus(tableId, 'libre');
    
    logger.info('Mesa liberada manualmente desde Retell', {
      tableId,
      reason,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: true,
      message: `Mesa ${tableId} liberada correctamente`,
      nuevo_estado: getTableStatusForRetell()
    });
    
  } catch (error) {
    logger.error('Error al liberar mesa desde Retell', { error });
    return NextResponse.json(
      { error: 'Error al liberar mesa' },
      { status: 500 }
    );
  }
}
