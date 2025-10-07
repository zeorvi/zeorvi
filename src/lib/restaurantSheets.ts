export const RESTAURANT_SHEETS = {
  rest_003: {
    name: "La Gaviota",
    spreadsheetId: "115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4",
  },
};

export function getSpreadsheetId(restaurantId: string) {
  const data = RESTAURANT_SHEETS[restaurantId as keyof typeof RESTAURANT_SHEETS];
  if (!data) throw new Error(`No se encontró hoja para ${restaurantId}`);
  return data.spreadsheetId;
}

export function getRestaurantName(restaurantId: string) {
  return RESTAURANT_SHEETS[restaurantId as keyof typeof RESTAURANT_SHEETS]?.name || "Restaurante";
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