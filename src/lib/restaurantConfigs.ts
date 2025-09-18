// Configuraciones específicas por restaurante
export interface RestaurantTableConfig {
  id: string;
  name: string;
  capacity: number;
  location: string;
  position?: {
    x: number;
    y: number;
  };
  notes?: string;
}

export interface RestaurantLayout {
  restaurantId: string;
  restaurantName: string;
  locations: string[];
  tables: RestaurantTableConfig[];
}

// Configuración de ejemplo (generada automáticamente)
export const exampleRestaurantConfig: RestaurantLayout = {
  restaurantId: 'rest_ejemplo_001',
  restaurantName: 'Restaurante de Ejemplo',
  locations: ['Comedor 1', 'Comedor 2', 'Terraza'],
  tables: [
    // Este es solo un ejemplo - usa el generador automático para crear tu configuración
    { id: 'C1-1', name: 'C1-1', capacity: 2, location: 'Comedor 1', position: { x: 1, y: 1 }, notes: 'Mesa romántica interior' },
    { id: 'C1-2', name: 'C1-2', capacity: 4, location: 'Comedor 1', position: { x: 2, y: 1 }, notes: 'Mesa familiar interior' },
    { id: 'T1', name: 'T1', capacity: 4, location: 'Terraza', position: { x: 1, y: 1 }, notes: 'Mesa familiar con vista' }
  ]
};

// Configuración para otro restaurante (ejemplo)
export const otroRestauranteConfig: RestaurantLayout = {
  restaurantId: 'rest_otro_002',
  restaurantName: 'Restaurante La Parrilla',
  locations: ['Comedor', 'Terraza', 'Barra'],
  tables: [
    // COMEDOR
    { id: 'C1', name: 'C1', capacity: 2, location: 'Comedor', position: { x: 1, y: 1 } },
    { id: 'C2', name: 'C2', capacity: 4, location: 'Comedor', position: { x: 2, y: 1 } },
    { id: 'C3', name: 'C3', capacity: 6, location: 'Comedor', position: { x: 3, y: 1 } },
    
    // TERRAZA
    { id: 'T1', name: 'T1', capacity: 2, location: 'Terraza', position: { x: 1, y: 1 } },
    { id: 'T2', name: 'T2', capacity: 4, location: 'Terraza', position: { x: 2, y: 1 } },
    
    // BARRA
    { id: 'B1', name: 'B1', capacity: 1, location: 'Barra', position: { x: 1, y: 1 } },
    { id: 'B2', name: 'B2', capacity: 1, location: 'Barra', position: { x: 2, y: 1 } },
    { id: 'B3', name: 'B3', capacity: 1, location: 'Barra', position: { x: 3, y: 1 } }
  ]
};

// Función para obtener la configuración de un restaurante
export function getRestaurantConfig(restaurantId: string): RestaurantLayout | null {
  const configs = {
    'rest_elbuensabor_001': elBuenSaborConfig,
    'rest_otro_002': otroRestauranteConfig
  };
  
  return configs[restaurantId as keyof typeof configs] || null;
}

// Función para crear mesas dinámicamente
export function createTablesFromConfig(config: RestaurantLayout) {
  return config.tables.map(table => ({
    id: table.id,
    name: table.name,
    capacity: table.capacity,
    status: 'libre' as const,
    location: table.location,
    lastUpdated: new Date()
  }));
}

// Tipos de restaurantes disponibles
export const restaurantTypes = {
  'Restaurante Tradicional': {
    description: 'Restaurante clásico con comedor principal y terraza',
    airtableViews: {
      today: 'viwReservasHoy',
      week: 'viwReservasSemana',
      month: 'viwReservasMes'
    },
    voiceSettings: {
      voiceId: 'es-ES-ElviraNeural',
      language: 'es-ES'
    }
  },
  'Restaurante de Lujo': {
    description: 'Restaurante de alta gama con salones privados',
    airtableViews: {
      today: 'viwReservasHoyLujo',
      week: 'viwReservasSemanaLujo',
      month: 'viwReservasMesLujo'
    },
    voiceSettings: {
      voiceId: 'es-ES-LauraNeural',
      language: 'es-ES'
    }
  },
  'Restaurante Casual': {
    description: 'Restaurante informal con barra y comedor abierto',
    airtableViews: {
      today: 'viwReservasHoyCasual',
      week: 'viwReservasSemanaCasual',
      month: 'viwReservasMesCasual'
    },
    voiceSettings: {
      voiceId: 'es-ES-PabloNeural',
      language: 'es-ES'
    }
  },
  'Cafetería': {
    description: 'Cafetería con mesas pequeñas y servicio rápido',
    airtableViews: {
      today: 'viwReservasHoyCafe',
      week: 'viwReservasSemanaCafe',
      month: 'viwReservasMesCafe'
    },
    voiceSettings: {
      voiceId: 'es-ES-ElviraNeural',
      language: 'es-ES'
    }
  }
};

// Función para obtener todos los tipos de restaurantes
export function getAllRestaurantTypes(): string[] {
  return Object.keys(restaurantTypes);
}

// Función para obtener la configuración de un tipo de restaurante
export function getRestaurantTypeConfig(type: string) {
  return restaurantTypes[type as keyof typeof restaurantTypes] || null;
}