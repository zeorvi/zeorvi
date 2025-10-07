/**
 * Utilidades para trabajar con Retell AI
 */

/**
 * Extrae el restaurantId del cuerpo de la petición de Retell
 * Prioriza metadata.restaurantId, luego usa regex como fallback
 */
export function getRestaurantId(body: any): string | null {
  // Primero intenta obtener desde metadata
  const meta = body?.metadata?.restaurantId || body?.data?.metadata?.restaurantId;
  if (meta) {
    console.log(`📍 RestaurantId desde metadata: ${meta}`);
    return meta;
  }

  // Fallback: usar regex en agent_id
  const agentId = body?.agent_id || '';
  const match = String(agentId).match(/rest_([a-zA-Z0-9_]+)_agent/);
  if (match) {
    const restaurantId = `rest_${match[1]}`;
    console.log(`📍 RestaurantId desde agent_id: ${restaurantId}`);
    return restaurantId;
  }

  console.warn('❌ No se pudo extraer restaurantId de:', { 
    agent_id: body?.agent_id, 
    metadata: body?.metadata 
  });
  return null;
}

/**
 * Obtiene el nombre del restaurante desde su ID
 */
export function getRestaurantNameFromId(restaurantId: string): string {
  const names: Record<string, string> = {
    'rest_003': 'La Gaviota',
    'rest_001': 'Restaurante El Buen Sabor',
    'rest_002': 'La Parrilla del Chef',
    'rest_004': 'Restaurante El Buen Sabor'
  };
  
  return names[restaurantId] || `Restaurante ${restaurantId}`;
}

/**
 * Valida que el restaurantId sea válido
 */
export function isValidRestaurantId(restaurantId: string | null): restaurantId is string {
  return !!restaurantId && restaurantId.startsWith('rest_');
}

/**
 * Extrae información del agente desde el agent_id
 */
export function parseAgentId(agentId: string): { restaurantId: string | null; type: string } {
  const match = String(agentId).match(/rest_([a-zA-Z0-9_]+)_agent/);
  if (match) {
    return {
      restaurantId: `rest_${match[1]}`,
      type: 'restaurant'
    };
  }
  
  return {
    restaurantId: null,
    type: 'unknown'
  };
}
