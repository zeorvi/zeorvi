import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const RESTAURANT_SHEETS: { [key: string]: string } = {
  'rest_003': '115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4',
};

async function getGoogleSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}');
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId') || 'rest_003';
    const dryRun = searchParams.get('dryRun') === 'true';
    
    const sheets = await getGoogleSheetsClient();
    const sheetId = RESTAURANT_SHEETS[restaurantId];
    
    if (!sheetId) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    
    console.log('🔍 Analizando filas desalineadas...');
    
    // Leer todas las filas
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Reservas!A2:Z',
    });
    
    const rows = dataResponse.data.values || [];
    const misalignedRows: Array<{ rowNumber: number; data: any[] }> = [];
    
    // Identificar filas desalineadas (donde A está vacío pero hay datos más adelante)
    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 porque empezamos en A2
      
      // Si la columna A (ID) está vacía pero la columna I (que sería Mesa) tiene datos que parecen un ID
      if (!row[0] && row[8] && String(row[8]).startsWith('R')) {
        misalignedRows.push({ rowNumber, data: row });
      }
    });
    
    console.log(`📊 Encontradas ${misalignedRows.length} filas desalineadas`);
    
    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        misalignedRows: misalignedRows.map(r => ({
          row: r.rowNumber,
          currentFirstValue: r.data[8], // Lo que está en columna I
          preview: r.data.slice(8, 20) // Mostrar lo que hay de I en adelante
        }))
      });
    }
    
    // Corregir cada fila
    const corrections = [];
    
    for (const misalignedRow of misalignedRows) {
      const rowNumber = misalignedRow.rowNumber;
      const rowData = misalignedRow.data;
      
      // Extraer los datos que están en las columnas I-T (índices 8-19)
      const correctData = [
        rowData[8],  // ID (estaba en I)
        rowData[9],  // Fecha (estaba en J)
        rowData[10], // Hora (estaba en K)
        rowData[11], // Turno (estaba en L)
        rowData[12], // Cliente (estaba en M)
        rowData[13], // Telefono (estaba en N)
        rowData[14], // Personas (estaba en O)
        rowData[15], // Zona (estaba en P)
        rowData[16], // Mesa (estaba en Q)
        rowData[17], // Estado (estaba en R)
        rowData[18], // Notas (estaba en S)
        rowData[19], // Creado (estaba en T)
      ];
      
      console.log(`🔧 Corrigiendo fila ${rowNumber}...`);
      console.log(`   ID: ${correctData[0]}, Cliente: ${correctData[4]}`);
      
      // Actualizar la fila con los datos en la posición correcta
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `Reservas!A${rowNumber}:L${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [correctData]
        }
      });
      
      // Limpiar las columnas M-T de esta fila (donde estaban los datos duplicados)
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `Reservas!M${rowNumber}:T${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['', '', '', '', '', '', '', '']]
        }
      });
      
      corrections.push({
        row: rowNumber,
        id: correctData[0],
        cliente: correctData[4]
      });
      
      // Pequeña pausa entre correcciones
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    return NextResponse.json({
      success: true,
      corrected: corrections.length,
      details: corrections
    });
    
  } catch (error: any) {
    console.error('❌ Error en fix-alignment:', error);
    return NextResponse.json({ 
      error: 'Error al corregir alineación', 
      details: error.message 
    }, { status: 500 });
  }
}

