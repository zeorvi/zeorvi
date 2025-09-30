/**
 * Servicio simplificado para restaurantes
 * Implementación básica sin Firebase
 */

import { toast } from 'sonner';

export interface TableState {
  id: string;
  name: string;
  capacity: number;
  location: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  lastUpdated: string;
  updatedBy: string;
}

export interface RestaurantCredentials {
  username: string;
  password: string;
  lastLogin?: string;
}

export interface RestaurantData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  credentials?: RestaurantCredentials;
  tables?: TableState[];
  settings?: any;
  createdAt: string;
  updatedAt: string;
}

// Cache simple en memoria
const restaurantCache = new Map<string, RestaurantData>();
const tableCache = new Map<string, TableState[]>();

export class RestaurantService {
  /**
   * Actualizar credenciales de un restaurante
   */
  async updateRestaurantCredentials(restaurantId: string, credentials: RestaurantCredentials): Promise<boolean> {
    try {
      console.log('✅ Actualizando credenciales para restaurante:', restaurantId);
      
      // Simular actualización
      const restaurant = restaurantCache.get(restaurantId);
      if (restaurant) {
        restaurant.credentials = credentials;
        restaurant.updatedAt = new Date().toISOString();
        restaurantCache.set(restaurantId, restaurant);
      }
      
      toast.success('✅ Credenciales actualizadas exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error actualizando credenciales:', error);
      toast.error('Error actualizando credenciales');
      return false;
    }
  }

  /**
   * Obtener restaurante por ID
   */
  async getRestaurantById(restaurantId: string): Promise<RestaurantData | null> {
    try {
      // Simular obtención de restaurante
      const restaurant = restaurantCache.get(restaurantId);
      if (restaurant) {
        return restaurant;
      }
      
      // Crear restaurante de ejemplo si no existe
      const newRestaurant: RestaurantData = {
        id: restaurantId,
        name: 'Restaurante de Ejemplo',
        email: 'ejemplo@restaurante.com',
        phone: '+1234567890',
        address: 'Dirección de ejemplo',
        credentials: {
          username: 'admin',
          password: 'password123'
        },
        tables: [],
        settings: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      restaurantCache.set(restaurantId, newRestaurant);
      return newRestaurant;
    } catch (error) {
      console.error('❌ Error obteniendo restaurante:', error);
      return null;
    }
  }

  /**
   * Obtener todos los restaurantes
   */
  async getAllRestaurants(): Promise<RestaurantData[]> {
    try {
      const restaurants = Array.from(restaurantCache.values());
      return restaurants;
    } catch (error) {
      console.error('❌ Error obteniendo restaurantes:', error);
      return [];
    }
  }

  /**
   * Crear nuevo restaurante
   */
  async createRestaurant(restaurantData: Partial<RestaurantData>): Promise<RestaurantData | null> {
    try {
      const newRestaurant: RestaurantData = {
        id: restaurantData.id || `restaurant_${Date.now()}`,
        name: restaurantData.name || 'Nuevo Restaurante',
        email: restaurantData.email || '',
        phone: restaurantData.phone || '',
        address: restaurantData.address || '',
        credentials: restaurantData.credentials || {
          username: 'admin',
          password: 'password123'
        },
        tables: restaurantData.tables || [],
        settings: restaurantData.settings || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      restaurantCache.set(newRestaurant.id, newRestaurant);
      toast.success('✅ Restaurante creado exitosamente');
      return newRestaurant;
    } catch (error) {
      console.error('❌ Error creando restaurante:', error);
      toast.error('Error creando restaurante');
      return null;
    }
  }

  /**
   * Eliminar restaurante
   */
  async deleteRestaurant(restaurantId: string): Promise<boolean> {
    try {
      restaurantCache.delete(restaurantId);
      tableCache.delete(restaurantId);
      toast.success('✅ Restaurante eliminado exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error eliminando restaurante:', error);
      toast.error('Error eliminando restaurante');
      return false;
    }
  }

  /**
   * Actualizar restaurante
   */
  async updateRestaurant(restaurantId: string, updates: Partial<RestaurantData>): Promise<boolean> {
    try {
      const restaurant = restaurantCache.get(restaurantId);
      if (restaurant) {
        const updatedRestaurant = {
          ...restaurant,
          ...updates,
          updatedAt: new Date().toISOString()
        };
        restaurantCache.set(restaurantId, updatedRestaurant);
        toast.success('✅ Restaurante actualizado exitosamente');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error actualizando restaurante:', error);
      toast.error('Error actualizando restaurante');
      return false;
    }
  }

  /**
   * Actualizar estado de mesa
   */
  async updateTableState(restaurantId: string, tableId: string, state: Partial<TableState>): Promise<boolean> {
    try {
      const tables = tableCache.get(restaurantId) || [];
      const tableIndex = tables.findIndex(table => table.id === tableId);
      
      if (tableIndex !== -1) {
        tables[tableIndex] = {
          ...tables[tableIndex],
          ...state,
          lastUpdated: new Date().toISOString(),
          updatedBy: 'system'
        };
        tableCache.set(restaurantId, tables);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error actualizando estado de mesa:', error);
      return false;
    }
  }

  /**
   * Obtener estados de mesas
   */
  async getTableStates(restaurantId: string): Promise<TableState[]> {
    try {
      const tables = tableCache.get(restaurantId) || [];
      return tables;
    } catch (error) {
      console.error('❌ Error obteniendo estados de mesas:', error);
      return [];
    }
  }

  /**
   * Obtener restaurantes por usuario
   */
  async getRestaurantsByUser(userId: string): Promise<RestaurantData[]> {
    try {
      // Simular obtención por usuario
      const restaurants = Array.from(restaurantCache.values());
      return restaurants;
    } catch (error) {
      console.error('❌ Error obteniendo restaurantes por usuario:', error);
      return [];
    }
  }
}

// Instancia singleton
export const restaurantService = new RestaurantService();
export default restaurantService;
