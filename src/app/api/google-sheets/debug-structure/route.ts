import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const RESTAURANT_SHEETS: { [key: string]: string } = {
  'rest_003': '1u9PaKvpvmz_eHTI_y5Sn8BKXnJgKb98AJrbh8_Dj7Zg',
};

async function getGoogleSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}');
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId') || 'rest_003';
    
    const sheets = await getGoogleSheetsClient();
    const sheetId = RESTAURANT_SHEETS[restaurantId];
    
    if (!sheetId) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    
    // 1. Leer encabezados
    console.log('📋 Leyendo encabezados de Reservas...');
    const headersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Reservas!A1:Z1', // Leer hasta Z para ver si hay encabezados extra
    });
    
    const headers = headersResponse.data.values?.[0] || [];
    
    // 2. Leer las últimas 5 filas
    console.log('📊 Leyendo últimas filas de Reservas...');
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Reservas!A2:Z', // Leer todo para ver dónde están los datos
    });
    
    const rows = dataResponse.data.values || [];
    const ultimas = rows.slice(-5);
    
    // 3. Analizar estructura de las últimas filas
    const analisis = ultimas.map((row, idx) => {
      const filaNum = rows.length - ultimas.length + idx + 2;
      const estructura: any = {};
      
      row.forEach((value, colIdx) => {
        const column = String.fromCharCode(65 + colIdx);
        const headerName = headers[colIdx] || `Sin encabezado (${column})`;
        estructura[column] = {
          header: headerName,
          value: value,
          isEmpty: !value || value.trim() === ''
        };
      });
      
      return {
        fila: filaNum,
        totalColumnas: row.length,
        primeraColumnaConDatos: row.findIndex(v => v && v.trim() !== ''),
        estructura
      };
    });
    
    // 4. Detectar problemas
    const problemas = [];
    
    // Verificar si los encabezados están correctos
    const encabezadosEsperados = ['ID', 'Fecha', 'Hora', 'Turno', 'Cliente', 'Telefono', 'Personas', 'Zona', 'Mesa', 'Estado', 'Notas', 'Creado'];
    
    if (headers.length !== encabezadosEsperados.length) {
      problemas.push(`❌ Número incorrecto de encabezados. Esperados: ${encabezadosEsperados.length}, Encontrados: ${headers.length}`);
    }
    
    encabezadosEsperados.forEach((esperado, idx) => {
      if (headers[idx] !== esperado) {
        const column = String.fromCharCode(65 + idx);
        problemas.push(`❌ Columna ${column}: Esperado "${esperado}", Encontrado "${headers[idx] || 'vacío'}"`);
      }
    });
    
    // Verificar si las filas tienen datos en columnas incorrectas
    analisis.forEach(fila => {
      if (fila.primeraColumnaConDatos !== 0) {
        const column = String.fromCharCode(65 + fila.primeraColumnaConDatos);
        problemas.push(`⚠️  Fila ${fila.fila}: Los datos empiezan en columna ${column} en lugar de A`);
      }
    });
    
    return NextResponse.json({
      success: true,
      restaurantId,
      sheetId,
      encabezados: {
        total: headers.length,
        valores: headers,
        esperados: encabezadosEsperados,
        mapeo: headers.map((h, idx) => ({
          columna: String.fromCharCode(65 + idx),
          actual: h,
          esperado: encabezadosEsperados[idx],
          correcto: h === encabezadosEsperados[idx]
        }))
      },
      ultimasFilas: {
        total: rows.length,
        analizadas: analisis
      },
      problemas,
      diagnostico: problemas.length === 0 
        ? '✅ La estructura parece correcta' 
        : `⚠️  Se encontraron ${problemas.length} problema(s)`
    });
    
  } catch (error: any) {
    console.error('❌ Error en debug-structure:', error);
    return NextResponse.json({ 
      error: 'Error al verificar estructura', 
      details: error.message 
    }, { status: 500 });
  }
}

