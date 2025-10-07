// Mapa de IDs reales de Google Sheets por restaurante
export const RESTAURANT_SHEETS: Record<string, { name: string; spreadsheetId: string }> = {
  'rest_003': { 
    name: 'La Gaviota', 
    spreadsheetId: '115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4' 
  },
  'rest_001': { 
    name: 'Restaurante El Buen Sabor', 
    spreadsheetId: '115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4' 
  },
  'rest_002': { 
    name: 'La Parrilla del Chef', 
    spreadsheetId: '115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4' 
  },
  'rest_004': { 
    name: 'Restaurante El Buen Sabor', 
    spreadsheetId: '115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4' 
  }
};

/**
 * Obtiene el ID del spreadsheet de Google Sheets para un restaurante
 */
export function getSpreadsheetId(restaurantId: string): string {
  const item = RESTAURANT_SHEETS[restaurantId];
  if (!item) {
    throw new Error(`No se encontró spreadsheetId para ${restaurantId}`);
  }
  return item.spreadsheetId;
}

/**
 * Obtiene el nombre del restaurante por su ID
 */
export function getRestaurantName(restaurantId: string): string {
  const item = RESTAURANT_SHEETS[restaurantId];
  if (!item) {
    throw new Error(`No se encontró nombre para ${restaurantId}`);
  }
  return item.name;
}

/**
 * Obtiene todos los restaurantes configurados
 */
export function getAllRestaurants(): Array<{ id: string; name: string; spreadsheetId: string }> {
  return Object.entries(RESTAURANT_SHEETS).map(([id, data]) => ({
    id,
    name: data.name,
    spreadsheetId: data.spreadsheetId
  }));
}

// Función de compatibilidad (mantener por si se usa en otros archivos)
export function getRestaurantSheetId(restaurantId: string): string {
  return getSpreadsheetId(restaurantId);
}