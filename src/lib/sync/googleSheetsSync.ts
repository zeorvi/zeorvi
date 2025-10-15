/**
 * Servicio de Sincronización Google Sheets ↔ Base de Datos
 * 
 * Este servicio sincroniza datos desde Google Sheets a la base de datos local
 * para hacer el dashboard 300x más rápido
 */

import { GoogleSheetsService } from '../googleSheetsService';
import { sqliteDb } from '../database/sqlite';

export class GoogleSheetsSyncService {
  
  /**
   * Sincronizar reservas de Google Sheets a DB
   */
  static async syncReservations(restaurantId: string): Promise<{
    success: boolean;
    synced: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      console.log(`🔄 [Sync] Iniciando sincronización de reservas para ${restaurantId}...`);
      
      // Obtener reservas de Google Sheets
      const reservations = await GoogleSheetsService.getReservas(restaurantId);
      
      // Guardar en base de datos
      await sqliteDb.syncReservations(restaurantId, reservations);
      
      const duration = Date.now() - startTime;
      console.log(`✅ [Sync] Reservas sincronizadas en ${duration}ms (${reservations.length} reservas)`);
      
      return {
        success: true,
        synced: reservations.length
      };
    } catch (error) {
      console.error(`❌ [Sync] Error sincronizando reservas para ${restaurantId}:`, error);
      return {
        success: false,
        synced: 0,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Sincronizar mesas de Google Sheets a DB
   */
  static async syncTables(restaurantId: string): Promise<{
    success: boolean;
    synced: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      console.log(`🔄 [Sync] Iniciando sincronización de mesas para ${restaurantId}...`);
      
      // Obtener mesas de Google Sheets
      const tables = await GoogleSheetsService.getMesas(restaurantId);
      
      // Guardar en base de datos
      await sqliteDb.syncTables(restaurantId, tables);
      
      const duration = Date.now() - startTime;
      console.log(`✅ [Sync] Mesas sincronizadas en ${duration}ms (${tables.length} mesas)`);
      
      return {
        success: true,
        synced: tables.length
      };
    } catch (error) {
      console.error(`❌ [Sync] Error sincronizando mesas para ${restaurantId}:`, error);
      return {
        success: false,
        synced: 0,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Sincronización completa (reservas + mesas)
   */
  static async syncAll(restaurantId: string): Promise<{
    success: boolean;
    reservations: { success: boolean; synced: number };
    tables: { success: boolean; synced: number };
    duration: number;
  }> {
    const startTime = Date.now();
    console.log(`🚀 [Sync] Sincronización completa iniciada para ${restaurantId}`);
    
    // Sincronizar en paralelo para máxima velocidad
    const [reservationsResult, tablesResult] = await Promise.all([
      this.syncReservations(restaurantId),
      this.syncTables(restaurantId)
    ]);
    
    const duration = Date.now() - startTime;
    const success = reservationsResult.success && tablesResult.success;
    
    console.log(`${success ? '✅' : '⚠️'} [Sync] Sincronización completa terminada en ${duration}ms`);
    
    return {
      success,
      reservations: {
        success: reservationsResult.success,
        synced: reservationsResult.synced
      },
      tables: {
        success: tablesResult.success,
        synced: tablesResult.synced
      },
      duration
    };
  }

  /**
   * Verificar si necesita sincronización (más de 3 minutos desde última sync)
   */
  static async needsSync(restaurantId: string, type: 'reservations' | 'tables'): Promise<boolean> {
    const lastSync = await sqliteDb.getLastSyncTime(restaurantId, type);
    
    if (!lastSync) {
      console.log(`⚠️ [Sync] No hay sincronización previa para ${type} de ${restaurantId}`);
      return true; // Primera sincronización
    }
    
    const timeSinceSync = Date.now() - lastSync.getTime();
    const threeMinutes = 3 * 60 * 1000;
    
    const needs = timeSinceSync > threeMinutes;
    
    if (needs) {
      console.log(`⏰ [Sync] ${type} de ${restaurantId} necesita sincronización (última: ${Math.round(timeSinceSync / 1000)}s)`);
    }
    
    return needs;
  }

  /**
   * Sincronizar solo si es necesario (inteligente)
   */
  static async syncIfNeeded(restaurantId: string): Promise<{
    synced: boolean;
    reservations?: { success: boolean; synced: number };
    tables?: { success: boolean; synced: number };
  }> {
    const needsReservationsSync = await this.needsSync(restaurantId, 'reservations');
    const needsTablesSync = await this.needsSync(restaurantId, 'tables');
    
    if (!needsReservationsSync && !needsTablesSync) {
      console.log(`✅ [Sync] Cache actual para ${restaurantId}, sin necesidad de sincronizar`);
      return { synced: false };
    }
    
    // Sincronizar solo lo necesario
    const results: any = { synced: true };
    
    if (needsReservationsSync) {
      results.reservations = await this.syncReservations(restaurantId);
    }
    
    if (needsTablesSync) {
      results.tables = await this.syncTables(restaurantId);
    }
    
    return results;
  }
}

