#!/usr/bin/env node

/**
 * Script para crear Google Sheets automáticamente para cada restaurante
 * 
 * Este script crea los Google Sheets necesarios y configura las hojas
 * con las columnas correctas para el sistema de reservas.
 */

import { google } from 'googleapis';
import fs from 'fs';

// Configuración de Google Sheets API
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_CREDENTIALS_PATH || 'google-credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Configuración de restaurantes
const restaurants = [
  {
    id: 'rest_003',
    name: 'La Gaviota',
    description: 'Restaurante de mariscos y pescados frescos',
    mesas: [
      { id: 'M1', zona: 'Comedor 1', capacidad: 2, turnos: 'Comida, Cena', estado: 'Libre', notas: '' },
      { id: 'M2', zona: 'Comedor 1', capacidad: 2, turnos: 'Comida, Cena', estado: 'Libre', notas: '' },
      { id: 'M3', zona: 'Comedor 1', capacidad: 4, turnos: 'Comida', estado: 'Libre', notas: '' },
      { id: 'M4', zona: 'Comedor 2', capacidad: 3, turnos: 'Comida, Cena', estado: 'Libre', notas: '' },
      { id: 'M5', zona: 'Comedor 2', capacidad: 3, turnos: 'Comida, Cena', estado: 'Libre', notas: '' },
      { id: 'M6', zona: 'Terraza', capacidad: 4, turnos: 'Cena', estado: 'Libre', notas: '' },
      { id: 'M7', zona: 'Terraza', capacidad: 6, turnos: 'Cena', estado: 'Libre', notas: '' },
      { id: 'M8', zona: 'Salón Privado', capacidad: 4, turnos: 'Cena', estado: 'Libre', notas: '' }
    ]
  },
  {
    id: 'rest_002', 
    name: 'La Terraza',
    description: 'Restaurante con terraza al aire libre',
    mesas: [
      { id: 'M1', zona: 'Terraza Principal', capacidad: 2, turnos: 'Cena', estado: 'Libre', notas: '' },
      { id: 'M2', zona: 'Terraza Principal', capacidad: 4, turnos: 'Cena', estado: 'Libre', notas: '' },
      { id: 'M3', zona: 'Terraza Principal', capacidad: 6, turnos: 'Cena', estado: 'Libre', notas: '' },
      { id: 'M4', zona: 'Comedor Interior', capacidad: 2, turnos: 'Comida, Cena', estado: 'Libre', notas: '' },
      { id: 'M5', zona: 'Comedor Interior', capacidad: 4, turnos: 'Comida, Cena', estado: 'Libre', notas: '' },
      { id: 'M6', zona: 'Zona VIP', capacidad: 8, turnos: 'Cena', estado: 'Libre', notas: '' }
    ]
  },
  {
    id: 'rest_003',
    name: 'El Puerto',
    description: 'Restaurante de pescados y mariscos',
    mesas: [
      { id: 'M1', zona: 'Comedor Principal', capacidad: 2, turnos: 'Comida, Cena', estado: 'Libre', notas: '' },
      { id: 'M2', zona: 'Comedor Principal', capacidad: 4, turnos: 'Comida, Cena', estado: 'Libre', notas: '' },
      { id: 'M3', zona: 'Comedor Principal', capacidad: 6, turnos: 'Comida, Cena', estado: 'Libre', notas: '' },
      { id: 'M4', zona: 'Barra', capacidad: 1, turnos: 'Comida, Cena', estado: 'Libre', notas: '' },
      { id: 'M5', zona: 'Barra', capacidad: 1, turnos: 'Comida, Cena', estado: 'Libre', notas: '' },
      { id: 'M6', zona: 'Terraza', capacidad: 4, turnos: 'Cena', estado: 'Libre', notas: '' }
    ]
  },
  {
    id: 'rest_004',
    name: 'El Buen Sabor',
    description: 'Restaurante familiar con ambiente acogedor',
    mesas: [
      { id: 'M1', zona: 'Comedor Principal', capacidad: 2, turnos: 'Comida, Cena', estado: 'Libre', notas: '' },
      { id: 'M2', zona: 'Comedor Principal', capacidad: 4, turnos: 'Comida, Cena', estado: 'Libre', notas: '' },
      { id: 'M3', zona: 'Comedor Principal', capacidad: 6, turnos: 'Comida, Cena', estado: 'Libre', notas: '' },
      { id: 'M4', zona: 'Terraza', capacidad: 2, turnos: 'Cena', estado: 'Libre', notas: '' },
      { id: 'M5', zona: 'Terraza', capacidad: 4, turnos: 'Cena', estado: 'Libre', notas: '' },
      { id: 'M6', zona: 'Zona Familiar', capacidad: 8, turnos: 'Comida, Cena', estado: 'Libre', notas: '' }
    ]
  }
];

// Columnas para la hoja de Mesas
const mesasColumns = [
  'ID',
  'Zona', 
  'Capacidad',
  'Turnos',
  'Estado',
  'Notas'
];

// Columnas para la hoja de Reservas
const reservasColumns = [
  'ID',
  'Fecha',
  'Hora', 
  'Turno',
  'Cliente',
  'Teléfono',
  'Personas',
  'Zona',
  'Mesa',
  'Estado',
  'Notas',
  'Creado'
];

// Columnas para la hoja de Turnos
const turnosColumns = [
  'Turno',
  'Inicio',
  'Fin'
];

// Datos de turnos por defecto
const turnosData = [
  ['Comida', '13:00', '16:00'],
  ['Cena', '20:00', '23:30']
];

async function createRestaurantSheet(restaurant) {
  try {
    console.log(`\n🏪 Creando Google Sheet para ${restaurant.name} (${restaurant.id})...`);
    
    // Crear el spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `${restaurant.name} - Gestión`,
        },
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;
    console.log(`✅ Sheet creado: ${spreadsheetId}`);
    console.log(`🔗 URL: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);

    // Obtener información de las hojas existentes
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });

    const existingSheets = spreadsheetInfo.data.sheets || [];
    const defaultSheetId = existingSheets[0]?.properties?.sheetId || 0;

    // Crear hojas adicionales
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: 'Mesas',
              },
            },
          },
          {
            addSheet: {
              properties: {
                title: 'Reservas',
              },
            },
          },
          {
            addSheet: {
              properties: {
                title: 'Turnos',
              },
            },
          }
        ],
      },
    });

    // Configurar hoja "Mesas"
    await configureMesasSheet(spreadsheetId, restaurant);
    
    // Configurar hoja "Reservas"
    await configureReservasSheet(spreadsheetId);
    
    // Configurar hoja "Turnos"
    await configureTurnosSheet(spreadsheetId);

    // Eliminar la hoja por defecto (Sheet1)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      requestBody: {
        requests: [{
          deleteSheet: {
            sheetId: defaultSheetId,
          },
        }],
      },
    });

    console.log(`✅ Hojas configuradas: Mesas, Reservas, Turnos`);
    console.log(`✅ Datos de ejemplo agregados`);

    return {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      spreadsheetId: spreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
    };

  } catch (error) {
    console.error(`❌ Error creando sheet para ${restaurant.name}:`, error.message);
    return null;
  }
}

async function configureMesasSheet(spreadsheetId, restaurant) {
  console.log(`📋 Configurando hoja "Mesas"...`);
  
  // Agregar encabezados
  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId,
    range: 'Mesas!A1:F1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [mesasColumns],
    },
  });

  // Agregar datos de mesas
  const mesasData = restaurant.mesas.map(mesa => [
    mesa.id,
    mesa.zona,
    mesa.capacidad,
    mesa.turnos,
    mesa.estado,
    mesa.notas
  ]);

  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId,
    range: `Mesas!A2:F${mesasData.length + 1}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: mesasData,
    },
  });

  // Formatear encabezados
  await formatHeaders(spreadsheetId, 'Mesas', mesasColumns.length);
  
  console.log(`✅ Hoja "Mesas" configurada con ${restaurant.mesas.length} mesas`);
}

async function configureReservasSheet(spreadsheetId) {
  console.log(`📋 Configurando hoja "Reservas"...`);
  
  // Agregar encabezados
  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId,
    range: 'Reservas!A1:L1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [reservasColumns],
    },
  });

  // Agregar datos de ejemplo
  const exampleReservas = [
    [
      'R001',
      '2024-01-20',
      '21:00',
      'Cena',
      'María García',
      '+34 666 123 456',
      '4',
      'Terraza',
      'M6',
      'Confirmada',
      'Mesa cerca de la ventana',
      new Date().toISOString()
    ],
    [
      'R002',
      '2024-01-21',
      '13:30',
      'Comida',
      'Juan López',
      '+34 666 789 012',
      '2',
      'Comedor 1',
      'M1',
      'Pendiente',
      'Aniversario',
      new Date().toISOString()
    ]
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId,
    range: 'Reservas!A2:L3',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: exampleReservas,
    },
  });

  // Formatear encabezados
  await formatHeaders(spreadsheetId, 'Reservas', reservasColumns.length);
  
  console.log(`✅ Hoja "Reservas" configurada con datos de ejemplo`);
}

async function configureTurnosSheet(spreadsheetId) {
  console.log(`📋 Configurando hoja "Turnos"...`);
  
  // Agregar encabezados
  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId,
    range: 'Turnos!A1:C1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [turnosColumns],
    },
  });

  // Agregar datos de turnos
  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId,
    range: 'Turnos!A2:C3',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: turnosData,
    },
  });

  // Formatear encabezados
  await formatHeaders(spreadsheetId, 'Turnos', turnosColumns.length);
  
  console.log(`✅ Hoja "Turnos" configurada`);
}

async function formatHeaders(spreadsheetId, sheetName, columnCount) {
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      requestBody: {
        requests: [{
          repeatCell: {
            range: {
              sheetId: await getSheetId(spreadsheetId, sheetName),
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: columnCount,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: {
                  red: 0.2,
                  green: 0.6,
                  blue: 0.8,
                },
                textFormat: {
                  foregroundColor: {
                    red: 1.0,
                    green: 1.0,
                    blue: 1.0,
                  },
                  bold: true,
                },
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)',
          },
        }],
      },
    });
  } catch (error) {
    console.warn(`⚠️ No se pudo formatear encabezados para ${sheetName}:`, error.message);
  }
}

async function getSheetId(spreadsheetId, sheetName) {
  const spreadsheetInfo = await sheets.spreadsheets.get({
    spreadsheetId: spreadsheetId,
  });
  
  const sheet = spreadsheetInfo.data.sheets?.find(s => s.properties?.title === sheetName);
  return sheet?.properties?.sheetId || 0;
}

async function generateEnvFile(results) {
  console.log(`\n📝 Generando archivo .env con los IDs de los sheets...`);
  
  const envContent = `# Google Sheets IDs para cada restaurante
# Generado automáticamente el ${new Date().toISOString()}

# La Gaviota
LA_GAVIOTA_SHEET_ID=${results.find(r => r?.restaurantId === 'rest_003')?.spreadsheetId || 'REPLACE_WITH_REAL_ID'}

# La Terraza
LA_TERRAZA_SHEET_ID=${results.find(r => r?.restaurantId === 'rest_002')?.spreadsheetId || 'REPLACE_WITH_REAL_ID'}

# El Puerto
EL_PUERTO_SHEET_ID=${results.find(r => r?.restaurantId === 'rest_001')?.spreadsheetId || 'REPLACE_WITH_REAL_ID'}

# El Buen Sabor  
EL_BUEN_SABOR_SHEET_ID=${results.find(r => r?.restaurantId === 'rest_004')?.spreadsheetId || 'REPLACE_WITH_REAL_ID'}

# Fallback (opcional)
GOOGLE_SHEETS_ID=${results[0]?.spreadsheetId || 'REPLACE_WITH_REAL_ID'}
`;

  fs.writeFileSync('.env.sheets', envContent);
  console.log(`✅ Archivo .env.sheets creado`);
  
  return envContent;
}

async function main() {
  console.log('🚀 Iniciando creación de Google Sheets para restaurantes...');
  console.log(`📊 Creando ${restaurants.length} sheets...`);
  
  const results = [];
  
  for (const restaurant of restaurants) {
    const result = await createRestaurantSheet(restaurant);
    if (result) {
      results.push(result);
    }
    // Pausa entre creaciones para evitar rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n📋 Resumen de creación:`);
  console.log(`✅ Sheets creados: ${results.length}/${restaurants.length}`);
  
  results.forEach(result => {
    console.log(`\n🏪 ${result.restaurantName} (${result.restaurantId}):`);
    console.log(`   ID: ${result.spreadsheetId}`);
    console.log(`   URL: ${result.url}`);
  });
  
  // Generar archivo .env
  const envContent = await generateEnvFile(results);
  
  console.log(`\n📋 Variables de entorno generadas:`);
  console.log(envContent);
  
  console.log(`\n🎉 ¡Proceso completado!`);
  console.log(`\n📝 Próximos pasos:`);
  console.log(`1. Copia las variables de entorno a tu archivo .env`);
  console.log(`2. Configura las variables en Vercel`);
  console.log(`3. Prueba el sistema con: node scripts/test-global-webhook-system.js`);
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  createRestaurantSheet,
  generateEnvFile
};
