/**
 * Mapeo de Agent IDs de Retell AI a Restaurant IDs internos
 */

export const AGENT_TO_RESTAURANT_MAP: Record<string, string> = {
  // La Gaviota
  'agent_2082fc7a622cdbd22441b22060': 'rest_003',
  
  // Agregar más restaurantes aquí:
  // 'agent_XXXXXXXXXXXXXXXXXXXXXXXX': 'rest_004',
  // 'agent_YYYYYYYYYYYYYYYYYYYYYYYY': 'rest_005',
};

/**
 * Obtiene el restaurantId desde el agent_id de Retell AI
 */
export function getRestaurantFromAgentId(agentId: string): string | null {
  // Primero busca en el mapa directo
  const mappedRestaurant = AGENT_TO_RESTAURANT_MAP[agentId];
  if (mappedRestaurant) {
    console.log(`✅ Agente mapeado: ${agentId} → ${mappedRestaurant}`);
    return mappedRestaurant;
  }

  // Fallback: intentar extraer si sigue el patrón rest_XXX_agent
  const match = String(agentId).match(/rest_([a-zA-Z0-9_]+)_agent/);
  if (match) {
    const restaurantId = `rest_${match[1]}`;
    console.log(`✅ Agente extraído por patrón: ${agentId} → ${restaurantId}`);
    return restaurantId;
  }

  console.warn(`❌ No se encontró mapeo para agent_id: ${agentId}`);
  return null;
}

/**
 * Agrega un nuevo mapeo de agente a restaurante
 */
export function addAgentMapping(agentId: string, restaurantId: string): void {
  AGENT_TO_RESTAURANT_MAP[agentId] = restaurantId;
  console.log(`✅ Nuevo mapeo agregado: ${agentId} → ${restaurantId}`);
}

/**
 * Obtiene todos los mapeos
 */
export function getAllMappings(): Record<string, string> {
  return { ...AGENT_TO_RESTAURANT_MAP };
}

