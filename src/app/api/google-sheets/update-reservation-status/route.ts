import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, reservationId, newStatus, fecha } = body;
    
    console.log('📥 Datos recibidos en update-reservation-status:', body);

    if (!restaurantId || !reservationId || !newStatus || !fecha) {
      console.error('❌ Faltan parámetros:', { restaurantId, reservationId, newStatus, fecha });
      return NextResponse.json({ 
        success: false, 
        error: 'Faltan parámetros requeridos' 
      }, { status: 400 });
    }

    // Convertir estado a formato de Google Sheets
    const statusMapping: Record<string, string> = {
      'confirmed': 'confirmada', // Estado del dashboard
      'reserved': 'confirmada',  // Por compatibilidad
      'occupied': 'ocupada', 
      'completed': 'completada',
      'cancelled': 'cancelada'
    };

    const googleSheetsStatus = statusMapping[newStatus] || 'confirmada';
    
    console.log(`📋 Estado recibido: ${newStatus} -> Mapeado a Google Sheets: ${googleSheetsStatus}`);

    console.log(`🔄 Actualizando estado de reserva ${reservationId} a ${googleSheetsStatus} en Google Sheets`);

    // Actualizar en Google Sheets
    const updateResult = await GoogleSheetsService.updateReservationStatus(
      restaurantId,
      reservationId,
      googleSheetsStatus,
      fecha
    );

    if (updateResult.success) {
      console.log(`✅ Estado de reserva actualizado correctamente: ${googleSheetsStatus}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Estado actualizado correctamente',
        newStatus: googleSheetsStatus
      });
    } else {
      console.error('❌ Error actualizando estado en Google Sheets:', updateResult.error);
      return NextResponse.json({ 
        success: false, 
        error: updateResult.error || 'Error actualizando estado'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error en update-reservation-status:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}
