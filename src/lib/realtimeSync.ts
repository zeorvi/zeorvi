// Sistema de sincronización en tiempo real para Retell AI
import { toast } from 'sonner';

export interface ReservationData {
  id: string;
  clientName: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  people: number;
  tableId?: string;
  location?: string;
  status: 'pendiente' | 'confirmada' | 'ocupada' | 'completada' | 'cancelada';
  notes?: string;
  source: 'retell' | 'manual' | 'web';
  createdAt: string;
}

export interface TableData {
  id: string;
  name: string;
  capacity: number;
  location: string;
  status: 'libre' | 'ocupada' | 'reservada';
  currentClient?: string;
  reservationTime?: string;
}

// Clase para manejar sincronización en tiempo real
class RealtimeSyncManager {
  private listeners: Map<string, Function[]> = new Map();
  private reservations: ReservationData[] = [];
  private tables: TableData[] = [];

  constructor() {
    this.initializeMockData();
    this.setupRetellWebhookListener();
  }

  // Inicializar datos mock
  private initializeMockData() {
    this.reservations = [
      {
        id: 'res_001',
        clientName: 'Juan Pérez',
        phone: '+34 600 123 456',
        date: new Date().toISOString().split('T')[0],
        time: '20:00',
        people: 4,
        tableId: 'M5',
        location: 'Terraza',
        status: 'confirmada',
        source: 'manual',
        createdAt: new Date().toISOString()
      },
      {
        id: 'res_002',
        clientName: 'María García',
        phone: '+34 601 234 567',
        date: new Date().toISOString().split('T')[0],
        time: '19:30',
        people: 2,
        tableId: 'M3',
        location: 'Salón Principal',
        status: 'pendiente',
        source: 'manual',
        createdAt: new Date().toISOString()
      }
    ];

    this.tables = [
      { id: 'M1', name: 'Mesa 1', capacity: 2, location: 'Terraza', status: 'libre' },
      { id: 'M2', name: 'Mesa 2', capacity: 4, location: 'Salón Principal', status: 'libre' },
      { id: 'M3', name: 'Mesa 3', capacity: 6, location: 'Salón Principal', status: 'reservada', currentClient: 'María García', reservationTime: '19:30' },
      { id: 'M4', name: 'Mesa 4', capacity: 2, location: 'Terraza', status: 'libre' },
      { id: 'M5', name: 'Mesa 5', capacity: 8, location: 'Salón Privado', status: 'ocupada', currentClient: 'Juan Pérez' },
      { id: 'M6', name: 'Mesa 6', capacity: 6, location: 'Terraza', status: 'libre' }
    ];
  }

  // Configurar listener para webhooks de Retell
  private setupRetellWebhookListener() {
    // Simular recepción de webhooks de Retell
    if (typeof window !== 'undefined') {
      (window as any).handleRetellReservation = this.handleRetellReservation.bind(this);
    }
  }

  // Suscribirse a cambios
  subscribe(component: string, callback: Function) {
    if (!this.listeners.has(component)) {
      this.listeners.set(component, []);
    }
    this.listeners.get(component)!.push(callback);
  }

  // Desuscribirse
  unsubscribe(component: string, callback: Function) {
    const componentListeners = this.listeners.get(component);
    if (componentListeners) {
      const index = componentListeners.indexOf(callback);
      if (index > -1) {
        componentListeners.splice(index, 1);
      }
    }
  }

  // Notificar a todos los componentes
  private notifyListeners(component: string, data: any) {
    const componentListeners = this.listeners.get(component);
    if (componentListeners) {
      componentListeners.forEach(callback => callback(data));
    }
  }

  // Manejar nueva reserva desde Retell
  async handleRetellReservation(reservationData: Omit<ReservationData, 'id' | 'createdAt'>) {
    try {
      // 1. DETECTAR CONFLICTOS
      const conflicts = this.detectConflicts(reservationData);
      
      if (conflicts.length > 0) {
        // Alertar sobre conflictos
        this.handleConflicts(conflicts, reservationData);
      }

      // 2. ASIGNACIÓN INTELIGENTE DE MESA
      const assignmentResult = this.intelligentTableAssignment(reservationData);
      
      const newReservation: ReservationData = {
        ...reservationData,
        id: `res_retell_${Date.now()}`,
        tableId: assignmentResult.table?.id || 'auto-assign',
        location: assignmentResult.table?.location || reservationData.location || 'Salón Principal',
        createdAt: new Date().toISOString(),
        source: 'retell'
      };

      // 3. GUARDAR EN FIREBASE (simulado)
      await this.saveToFirebase(newReservation);

      // 4. ACTUALIZAR ESTADO DE MESA
      if (assignmentResult.table) {
        this.updateTableStatus(assignmentResult.table.id, 'reservada', reservationData.clientName, reservationData.time);
      }

      // 5. NOTIFICAR A TODOS LOS COMPONENTES
      this.notifyAllComponents(newReservation);

      // 6. ALERTAS AL STAFF
      this.notifyStaff(newReservation, assignmentResult);

      return { success: true, reservation: newReservation, assignment: assignmentResult };

    } catch (error) {
      console.error('Error handling Retell reservation:', error);
      toast.error('Error al procesar reserva desde Retell');
      return { success: false, error };
    }
  }

  // Encontrar la mejor mesa disponible
  private findBestTable(people: number, preferredLocation?: string): TableData | null {
    const availableTables = this.tables.filter(table => 
      table.status === 'libre' && table.capacity >= people
    );

    // Priorizar ubicación preferida
    if (preferredLocation) {
      const preferredTable = availableTables.find(table => 
        table.location.toLowerCase().includes(preferredLocation.toLowerCase())
      );
      if (preferredTable) return preferredTable;
    }

    // Buscar mesa con capacidad exacta o la más pequeña que sirva
    return availableTables.sort((a, b) => a.capacity - b.capacity)[0] || null;
  }

  // Actualizar estado de mesa
  private updateTableStatus(tableId: string, status: TableData['status'], clientName?: string, time?: string) {
    const tableIndex = this.tables.findIndex(table => table.id === tableId);
    if (tableIndex !== -1) {
      this.tables[tableIndex] = {
        ...this.tables[tableIndex],
        status,
        currentClient: status !== 'libre' ? clientName : undefined,
        reservationTime: status === 'reservada' ? time : undefined
      };
    }
  }

  // Notificar a todos los componentes del dashboard
  private notifyAllComponents(reservation: ReservationData) {
    // Notificar a Agenda Diaria
    this.notifyListeners('agenda-diaria', {
      type: 'new-reservation',
      data: reservation
    });

    // Notificar a Gestión de Reservas
    this.notifyListeners('gestion-reservas', {
      type: 'new-reservation',
      data: reservation
    });

    // Notificar a Mesas Reservadas
    this.notifyListeners('mesas-reservadas', {
      type: 'new-reservation',
      data: reservation
    });

    // Notificar a Plano de Mesas
    this.notifyListeners('plano-mesas', {
      type: 'table-updated',
      data: { tableId: reservation.tableId, status: 'reservada' }
    });

    // Notificar a estadísticas
    this.notifyListeners('estadisticas', {
      type: 'stats-updated',
      data: this.getUpdatedStats()
    });
  }

  // 1. DETECTAR CONFLICTOS
  private detectConflicts(newReservation: Omit<ReservationData, 'id' | 'createdAt'>) {
    const conflicts = [];
    
    // Conflicto de horario en la misma mesa
    const timeConflicts = this.reservations.filter(res => 
      res.date === newReservation.date &&
      res.tableId === newReservation.tableId &&
      Math.abs(this.timeToMinutes(res.time) - this.timeToMinutes(newReservation.time)) < 120 // 2 horas
    );
    
    if (timeConflicts.length > 0) {
      conflicts.push({
        type: 'time_conflict',
        message: `Conflicto de horario en mesa ${newReservation.tableId}`,
        conflictingReservations: timeConflicts
      });
    }

    // Conflicto de capacidad
    const availableTables = this.tables.filter(t => t.status === 'libre' && t.capacity >= newReservation.people);
    if (availableTables.length === 0) {
      conflicts.push({
        type: 'capacity_conflict',
        message: `No hay mesas disponibles para ${newReservation.people} personas`,
        suggestedAlternatives: this.getSuggestedAlternatives(newReservation)
      });
    }

    return conflicts;
  }

  // 2. MANEJAR CONFLICTOS
  private handleConflicts(conflicts: any[], reservationData: any) {
    conflicts.forEach(conflict => {
      if (conflict.type === 'time_conflict') {
        toast.error('⚠️ Conflicto de horario detectado');
        toast.info('Retell sugerirá horario alternativo al cliente');
      } else if (conflict.type === 'capacity_conflict') {
        toast.error('⚠️ Sin mesas disponibles');
        toast.info('Retell ofrecerá alternativas al cliente');
      }
    });
  }

  // 3. ASIGNACIÓN INTELIGENTE DE MESAS
  private intelligentTableAssignment(reservationData: Omit<ReservationData, 'id' | 'createdAt'>) {
    const availableTables = this.tables.filter(table => 
      table.status === 'libre' && table.capacity >= reservationData.people
    );

    if (availableTables.length === 0) {
      return { table: null, reason: 'no_availability', alternatives: this.getSuggestedAlternatives(reservationData) };
    }

    // Algoritmo de asignación inteligente
    let bestTable = null;
    let score = -1;

    availableTables.forEach(table => {
      let tableScore = 0;
      
      // Preferir capacidad exacta (evitar desperdiciar mesas grandes)
      if (table.capacity === reservationData.people) {
        tableScore += 50;
      } else if (table.capacity === reservationData.people + 1) {
        tableScore += 30;
      } else {
        tableScore += Math.max(0, 20 - (table.capacity - reservationData.people) * 5);
      }

      // Preferir ubicación solicitada
      if (reservationData.location && table.location.toLowerCase().includes(reservationData.location.toLowerCase())) {
        tableScore += 25;
      }

      // Preferir mesas menos populares para balancear uso
      const tableUsage = this.getTableUsageHistory(table.id);
      tableScore += Math.max(0, 15 - tableUsage);

      if (tableScore > score) {
        score = tableScore;
        bestTable = table;
      }
    });

    return { 
      table: bestTable, 
      reason: 'optimal_assignment', 
      score,
      alternatives: availableTables.filter(t => t.id !== bestTable?.id).slice(0, 2)
    };
  }

  // 4. GUARDAR EN FIREBASE
  private async saveToFirebase(reservation: ReservationData) {
    try {
      // Simular guardado en Firebase
      console.log('💾 Guardando en Firebase:', reservation.id);
      
      // En producción, aquí iría:
      // await addDoc(collection(db, 'reservations'), reservation);
      
      toast.success('💾 Reserva guardada en Firebase');
      return true;
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      toast.error('Error al guardar en Firebase');
      return false;
    }
  }

  // 5. ALERTAS AL STAFF
  private notifyStaff(reservation: ReservationData, assignment: any) {
    // Alerta principal
    toast.success(`🔔 NUEVA RESERVA - ${reservation.clientName}`);
    toast.info(`📅 ${reservation.date} ${reservation.time} - ${reservation.people} personas`);
    
    if (assignment.table) {
      toast.success(`🪑 Mesa asignada: ${assignment.table.name} (${assignment.table.location})`);
    }

    // Alertas especiales
    if (assignment.reason === 'no_availability') {
      toast.error('🚨 SIN MESAS DISPONIBLES - Revisar alternativas');
    }

    if (reservation.people >= 6) {
      toast.info('👥 GRUPO GRANDE - Preparar mesa especial');
    }

    if (reservation.notes?.includes('cumpleaños') || reservation.notes?.includes('aniversario')) {
      toast.info('🎉 CELEBRACIÓN - Preparar decoración especial');
    }
  }

  // Funciones auxiliares
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private getTableUsageHistory(tableId: string): number {
    // Simular historial de uso (en producción vendría de Firebase)
    const usage = this.reservations.filter(res => res.tableId === tableId).length;
    return Math.min(usage, 10); // Máximo 10 para el cálculo
  }

  private getSuggestedAlternatives(reservationData: any) {
    const nextHour = this.addHoursToTime(reservationData.time, 1);
    const prevHour = this.addHoursToTime(reservationData.time, -1);
    
    return [
      { time: nextHour, reason: 'Una hora más tarde' },
      { time: prevHour, reason: 'Una hora más temprano' },
      { people: reservationData.people - 1, reason: 'Mesa para menos personas' }
    ];
  }

  private addHoursToTime(time: string, hours: number): string {
    const [h, m] = time.split(':').map(Number);
    const newHour = (h + hours + 24) % 24;
    return `${newHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  // Obtener estadísticas actualizadas
  private getUpdatedStats() {
    return {
      totalReservas: this.reservations.length,
      mesasLibres: this.tables.filter(t => t.status === 'libre').length,
      mesasOcupadas: this.tables.filter(t => t.status === 'ocupada').length,
      mesasReservadas: this.tables.filter(t => t.status === 'reservada').length,
      ocupacionPorcentaje: Math.round((this.tables.filter(t => t.status !== 'libre').length / this.tables.length) * 100),
      conflictosPotenciales: this.detectPotentialConflicts(),
      eficienciaAsignacion: this.calculateAssignmentEfficiency()
    };
  }

  // Detectar conflictos potenciales
  private detectPotentialConflicts() {
    const today = new Date().toISOString().split('T')[0];
    const todayReservations = this.reservations.filter(res => res.date === today);
    
    let conflicts = 0;
    todayReservations.forEach(res1 => {
      todayReservations.forEach(res2 => {
        if (res1.id !== res2.id && res1.tableId === res2.tableId) {
          const timeDiff = Math.abs(this.timeToMinutes(res1.time) - this.timeToMinutes(res2.time));
          if (timeDiff < 120) conflicts++;
        }
      });
    });
    
    return Math.floor(conflicts / 2); // Dividir por 2 porque cada conflicto se cuenta dos veces
  }

  // Calcular eficiencia de asignación
  private calculateAssignmentEfficiency() {
    const totalCapacity = this.tables.reduce((sum, table) => sum + table.capacity, 0);
    const usedCapacity = this.reservations.reduce((sum, res) => sum + res.people, 0);
    return Math.round((usedCapacity / totalCapacity) * 100);
  }

  // Métodos públicos para componentes
  getReservations() {
    return this.reservations;
  }

  getTables() {
    return this.tables;
  }

  getStats() {
    return this.getUpdatedStats();
  }
}

// Instancia global del manager
export const realtimeSync = new RealtimeSyncManager();

// Hook para componentes React
export function useRealtimeSync(componentName: string) {
  const subscribe = (callback: Function) => {
    realtimeSync.subscribe(componentName, callback);
  };

  const unsubscribe = (callback: Function) => {
    realtimeSync.unsubscribe(componentName, callback);
  };

  return { subscribe, unsubscribe };
}
