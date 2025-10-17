import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST - Limpiar filas mal formateadas en Google Sheets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId } = body;

    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId es requerido'
      }, { status: 400 });
    }

    console.log(`🧹 Iniciando limpieza de filas mal formateadas para ${restaurantId}...`);

    const sheets = await GoogleSheetsService.getClient();
    const sheetId = GoogleSheetsService.getSheetId(restaurantId);

    // Leer todas las filas de la hoja Reservas
    console.log('📖 Leyendo datos de Google Sheets...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Reservas!A:L",
    });

    const values = response.data.values || [];
    console.log(`📊 Total filas encontradas: ${values.length}`);

    // Identificar filas mal formateadas
    const malformedRowNumbers = [];
    
    values.forEach((row, index) => {
      const rowNumber = index + 1; // +1 porque las filas empiezan en 1
      const id = row[0] || '';
      
      // Una fila está mal formateada si:
      // 1. No tiene ID en la columna A
      // 2. El ID no empieza con 'R'
      // 3. La fila tiene datos pero están en columnas incorrectas
      if (rowNumber > 1) { // Saltar encabezado
        if (!id || id === '' || !id.startsWith('R')) {
          // Verificar si la fila tiene datos pero mal ubicados
          const hasData = row.some(cell => cell && cell.trim() !== '');
          if (hasData) {
            malformedRowNumbers.push(rowNumber);
            console.log(`🔍 Fila ${rowNumber} mal formateada: ID="${id}", Datos: [${row.slice(0, 5).join(', ')}...]`);
          }
        }
      }
    });

    console.log(`🗑️ Filas mal formateadas a eliminar: ${malformedRowNumbers.length}`);

    if (malformedRowNumbers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay filas mal formateadas que limpiar',
        cleanedRows: 0
      });
    }

    // Obtener información de la hoja para encontrar el sheetId correcto
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });
    
    const reservasSheet = spreadsheetInfo.data.sheets?.find(sheet => 
      sheet.properties?.title === 'Reservas'
    );
    
    if (!reservasSheet?.properties?.sheetId) {
      throw new Error('No se pudo encontrar la hoja "Reservas"');
    }
    
    const reservasSheetId = reservasSheet.properties.sheetId;
    console.log(`📋 ID de la hoja Reservas: ${reservasSheetId}`);

    // Eliminar filas de abajo hacia arriba (para no afectar los números de fila)
    malformedRowNumbers.sort((a, b) => b - a);
    let cleanedCount = 0;

    for (const rowNumber of malformedRowNumbers) {
      try {
        console.log(`🗑️ Eliminando fila ${rowNumber}...`);
        
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId: reservasSheetId, // Usar el ID correcto de la hoja Reservas
                  dimension: 'ROWS',
                  startIndex: rowNumber - 1, // -1 porque el índice empieza en 0
                  endIndex: rowNumber
                }
              }
            }]
          }
        });
        
        console.log(`✅ Fila ${rowNumber} eliminada exitosamente`);
        cleanedCount++;
        
        // Pequeña pausa entre eliminaciones
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`❌ Error eliminando fila ${rowNumber}: ${error.message}`);
      }
    }

    // Verificar el resultado final
    console.log('🔍 Verificando resultado final...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const finalResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Reservas!A:L",
    });
    
    const finalValues = finalResponse.data.values || [];
    console.log(`📊 Filas después de la limpieza: ${finalValues.length}`);

    return NextResponse.json({
      success: true,
      message: `Limpieza completada exitosamente`,
      cleanedRows: cleanedCount,
      totalRowsBefore: values.length,
      totalRowsAfter: finalValues.length,
      malformedRowsFound: malformedRowNumbers.length
    });

  } catch (error) {
    console.error('❌ Error en la limpieza:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
