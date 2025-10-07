/**
 * Utilidades para trabajar con Retell AI
 */

import { getRestaurantName } from './restaurantSheets';

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
 * Usa la función centralizada de restaurantSheets.ts
 */
export function getRestaurantNameFromId(restaurantId: string): string {
  try {
    return getRestaurantName(restaurantId);
  } catch (error) {
    console.warn(`No se encontró nombre para ${restaurantId}:`, error);
    return `Restaurante ${restaurantId}`;
  }
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
