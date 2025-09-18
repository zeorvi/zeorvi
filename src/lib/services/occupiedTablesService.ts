// Servicio para gestionar mesas ocupadas y limpieza automática
import { Reservation, Client } from '@/lib/restaurantData';

export interface OccupiedTable {
  id: string;
  tableId: string;
  reservation: Reservation;
  client: Client;
  occupiedAt: Date;
  estimatedEndTime: Date;
  autoCleanupTime: Date; // Cuando se limpiará automáticamente
  status: 'occupied' | 'cleaning' | 'ready';
}

// Clase para gestionar mesas ocupadas
export class OccupiedTablesService {
  private static instance: OccupiedTablesService;
  private occupiedTables: Map<string, OccupiedTable> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  static getInstance(): OccupiedTablesService {
    if (!OccupiedTablesService.instance) {
      OccupiedTablesService.instance = new OccupiedTablesService();
    }
    return OccupiedTablesService.instance;
  }

  constructor() {
    // Cargar datos del localStorage si existen
    this.loadFromStorage();
    
    // Iniciar el sistema de limpieza automática
    this.startAutoCleanup();
  }

  // Mover una reserva completada a mesa ocupada
  moveReservationToOccupied(reservation: Reservation, client: Client): OccupiedTable {
    const now = new Date();
    const estimatedEndTime = new Date(now.getTime() + reservation.duration * 60 * 1000);
    const autoCleanupTime = new Date(estimatedEndTime.getTime() + 30 * 60 * 1000); // +30 min buffer

    const occupiedTable: OccupiedTable = {
      id: `occupied_${reservation.id}`,
      tableId: reservation.tableId,
      reservation,
      client,
      occupiedAt: now,
      estimatedEndTime,
      autoCleanupTime,
      status: 'occupied'
    };

    this.occupiedTables.set(occupiedTable.id, occupiedTable);
    this.saveToStorage();

    console.log(`Mesa ${reservation.tableId} marcada como ocupada hasta ${estimatedEndTime.toLocaleTimeString()}`);
    
    return occupiedTable;
  }

  // Obtener todas las mesas ocupadas
  getOccupiedTables(): OccupiedTable[] {
    return Array.from(this.occupiedTables.values());
  }

  // Obtener mesa ocupada por ID de mesa
  getOccupiedTableByTableId(tableId: string): OccupiedTable | null {
    return Array.from(this.occupiedTables.values()).find(ot => ot.tableId === tableId) || null;
  }

  // Limpiar mesa manualmente
  cleanTable(occupiedTableId: string): boolean {
    const occupiedTable = this.occupiedTables.get(occupiedTableId);
    if (occupiedTable) {
      this.occupiedTables.delete(occupiedTableId);
      this.saveToStorage();
      
      console.log(`Mesa ${occupiedTable.tableId} limpiada manualmente`);
      
      // Disparar evento de limpieza
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('table:cleaned', {
          detail: {
            tableId: occupiedTable.tableId,
            cleanedAt: new Date().toISOString(),
            method: 'manual'
          }
        }));
      }
      
      return true;
    }
    return false;
  }

  // Sistema de limpieza automática
  private startAutoCleanup(): void {
    // Ejecutar cada minuto
    this.cleanupInterval = setInterval(() => {
      this.performAutoCleanup();
    }, 60 * 1000);

    // Ejecutar inmediatamente también
    this.performAutoCleanup();
  }

  private performAutoCleanup(): void {
    const now = new Date();
    const tablesToClean: string[] = [];

    this.occupiedTables.forEach((occupiedTable, id) => {
      if (now >= occupiedTable.autoCleanupTime) {
        tablesToClean.push(id);
      }
    });

    if (tablesToClean.length > 0) {
      tablesToClean.forEach(id => {
        const occupiedTable = this.occupiedTables.get(id);
        if (occupiedTable) {
          console.log(`🧹 Limpieza automática: Mesa ${occupiedTable.tableId} liberada`);
          
          // Disparar evento de limpieza automática
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('table:auto_cleaned', {
              detail: {
                tableId: occupiedTable.tableId,
                cleanedAt: now.toISOString(),
                method: 'automatic',
                occupiedDuration: now.getTime() - occupiedTable.occupiedAt.getTime()
              }
            }));
          }

          this.occupiedTables.delete(id);
        }
      });

      this.saveToStorage();
      
      // Mostrar notificación si hay interfaz disponible
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('tables:auto_cleaned', {
          detail: {
            count: tablesToClean.length,
            cleanedAt: now.toISOString()
          }
        }));
      }
    }
  }

  // Obtener estadísticas de mesas ocupadas
  getOccupiedStats(): {
    totalOccupied: number;
    nearingCleanup: number; // Mesas que se limpiarán en próximos 30 min
    overdue: number; // Mesas que deberían haberse limpiado
  } {
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    
    let nearingCleanup = 0;
    let overdue = 0;

    this.occupiedTables.forEach(table => {
      if (table.autoCleanupTime <= now) {
        overdue++;
      } else if (table.autoCleanupTime <= thirtyMinutesFromNow) {
        nearingCleanup++;
      }
    });

    return {
      totalOccupied: this.occupiedTables.size,
      nearingCleanup,
      overdue
    };
  }

  // Obtener tiempo restante para una mesa
  getTimeRemaining(tableId: string): { minutes: number; isOverdue: boolean } | null {
    const occupiedTable = this.getOccupiedTableByTableId(tableId);
    if (!occupiedTable) return null;

    const now = new Date();
    const diffMs = occupiedTable.autoCleanupTime.getTime() - now.getTime();
    const minutes = Math.ceil(diffMs / (60 * 1000));

    return {
      minutes: Math.abs(minutes),
      isOverdue: minutes < 0
    };
  }

  // Guardar en localStorage
  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      const data = Array.from(this.occupiedTables.entries()).map(([id, table]) => ({
        id,
        ...table,
        occupiedAt: table.occupiedAt.toISOString(),
        estimatedEndTime: table.estimatedEndTime.toISOString(),
        autoCleanupTime: table.autoCleanupTime.toISOString()
      }));
      
      localStorage.setItem('occupied_tables', JSON.stringify(data));
    }
  }

  // Cargar desde localStorage
  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('occupied_tables');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          data.forEach((item: any) => {
            const occupiedTable: OccupiedTable = {
              ...item,
              occupiedAt: new Date(item.occupiedAt),
              estimatedEndTime: new Date(item.estimatedEndTime),
              autoCleanupTime: new Date(item.autoCleanupTime)
            };
            this.occupiedTables.set(item.id, occupiedTable);
          });
        } catch (error) {
          console.error('Error cargando mesas ocupadas:', error);
        }
      }
    }
  }

  // Limpiar todos los datos (para testing)
  clearAll(): void {
    this.occupiedTables.clear();
    this.saveToStorage();
  }

  // Destructor
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Instancia singleton
export const occupiedTablesService = OccupiedTablesService.getInstance();

// Hook para usar en componentes React
export function useOccupiedTables() {
  const service = OccupiedTablesService.getInstance();
  
  return {
    moveToOccupied: (reservation: Reservation, client: Client) => 
      service.moveReservationToOccupied(reservation, client),
    getOccupiedTables: () => service.getOccupiedTables(),
    getStats: () => service.getOccupiedStats(),
    getTimeRemaining: (tableId: string) => service.getTimeRemaining(tableId),
    cleanTable: (occupiedTableId: string) => service.cleanTable(occupiedTableId)
  };
}

