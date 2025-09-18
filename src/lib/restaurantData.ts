// Sistema de datos para restaurantes - Reemplaza Airtable
// Gestiona mesas, reservas, clientes y estados en tiempo real

export interface Table {
  id: string;
  name: string;
  capacity: number;
  status: 'libre' | 'ocupada' | 'reservada';
  location: string;
  client?: Client;
  reservation?: Reservation;
  lastUpdated: Date;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  totalReservations: number;
  lastVisit?: Date;
  preferences?: string[];
}

export interface Reservation {
  id: string;
  clientId: string;
  tableId: string;
  date: Date;
  time: string;
  duration: number; // en minutos
  people: number;
  status: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
  source: 'llamada' | 'whatsapp' | 'web' | 'admin';
  notes?: string;
  createdAt: Date;
  confirmedAt?: Date;
}

export interface RestaurantMetrics {
  totalTables: number;
  occupiedTables: number;
  reservedTables: number;
  freeTables: number;
  todayReservations: number;
  weekReservations: number;
  monthReservations: number;
  averageOccupancy: number;
  peakHours: string[];
}

// Datos de ejemplo para demostración
export const mockTables: Table[] = [
  {
    id: 'M1',
    name: 'M1',
    capacity: 4,
    status: 'libre',
    location: 'Terraza',
    lastUpdated: new Date()
  },
  {
    id: 'M6',
    name: 'M6',
    capacity: 2,
    status: 'reservada',
    location: 'Interior',
    client: {
      id: 'C001',
      name: 'Luis Fernández',
      phone: '+34987654321',
      totalReservations: 3,
      lastVisit: new Date('2024-01-10')
    },
    reservation: {
      id: 'R001',
      clientId: 'C001',
      tableId: 'M6',
      date: new Date(),
      time: '20:00', // Primer turno de cena
      duration: 120,
      people: 2,
      status: 'confirmada',
      source: 'llamada',
      notes: 'Mesa romántica, sin ruido - Primer turno de cena',
      createdAt: new Date(),
      confirmedAt: new Date()
    },
    lastUpdated: new Date()
  },
  {
    id: 'M14',
    name: 'M14',
    capacity: 6,
    status: 'ocupada',
    location: 'Salón Principal',
    client: {
      id: 'C002',
      name: 'Ana Ruiz',
      phone: '+34666555444',
      totalReservations: 1,
      lastVisit: new Date()
    },
    reservation: {
      id: 'R002',
      clientId: 'C002',
      tableId: 'M14',
      date: new Date(),
      time: '22:00', // Segundo turno de cena
      duration: 90,
      people: 6,
      status: 'confirmada',
      source: 'whatsapp',
      notes: 'Celebración familiar',
      createdAt: new Date(),
      confirmedAt: new Date()
    },
    lastUpdated: new Date()
  },
  {
    id: 'M10',
    name: 'M10',
    capacity: 2,
    status: 'libre',
    location: 'Interior',
    lastUpdated: new Date()
  },
  {
    id: 'M18',
    name: 'M18',
    capacity: 6,
    status: 'reservada',
    location: 'Terraza',
    client: {
      id: 'C003',
      name: 'María Gómez',
      phone: '+34123456789',
      totalReservations: 5,
      lastVisit: new Date('2024-01-15')
    },
    reservation: {
      id: 'R003',
      clientId: 'C003',
      tableId: 'M18',
      date: new Date(),
      time: '21:00',
      duration: 150,
      people: 4,
      status: 'pendiente',
      source: 'llamada',
      notes: 'Cumpleaños, tarta incluida',
      createdAt: new Date()
    },
    lastUpdated: new Date()
  }
];

export const mockClients: Client[] = [
  {
    id: 'C001',
    name: 'Luis Fernández',
    phone: '+34987654321',
    totalReservations: 3,
    lastVisit: new Date('2024-01-10'),
    preferences: ['Terraza', 'Sin ruido']
  },
  {
    id: 'C002',
    name: 'Ana Ruiz',
    phone: '+34666555444',
    totalReservations: 1,
    lastVisit: new Date(),
    preferences: ['Salón Principal']
  },
  {
    id: 'C003',
    name: 'María Gómez',
    phone: '+34123456789',
    totalReservations: 5,
    lastVisit: new Date('2024-01-15'),
    preferences: ['Terraza', 'Cumpleaños']
  }
];

// Reservas históricas y futuras adicionales
export const mockReservations: Reservation[] = [
  // Reservas de días pasados
  {
    id: 'R_HIST_001',
    clientId: 'C001',
    tableId: 'M2',
    date: new Date(2024, 8, 16), // 16 septiembre (martes pasado)
    time: '20:00', // Primer turno de cena
    duration: 120,
    people: 2,
    status: 'completada',
    source: 'llamada',
    notes: 'Cena romántica - Primer turno',
    createdAt: new Date(2024, 8, 15),
    confirmedAt: new Date(2024, 8, 15)
  },
  {
    id: 'R_HIST_002',
    clientId: 'C002',
    tableId: 'M8',
    date: new Date(2024, 8, 16), // 16 septiembre (martes pasado)
    time: '22:00', // Segundo turno de cena
    duration: 90,
    people: 4,
    status: 'completada',
    source: 'web',
    notes: 'Cena familiar',
    createdAt: new Date(2024, 8, 15),
    confirmedAt: new Date(2024, 8, 15)
  },
  {
    id: 'R_HIST_003',
    clientId: 'C003',
    tableId: 'M12',
    date: new Date(2024, 8, 15), // 15 septiembre (lunes pasado)
    time: '13:00', // Primer turno de almuerzo
    duration: 120,
    people: 6,
    status: 'completada',
    source: 'whatsapp',
    notes: 'Celebración de aniversario - Almuerzo',
    createdAt: new Date(2024, 8, 14),
    confirmedAt: new Date(2024, 8, 14)
  },
  {
    id: 'R_HIST_004',
    clientId: 'C001',
    tableId: 'M5',
    date: new Date(2024, 8, 15), // 15 septiembre (lunes pasado)
    time: '14:00', // Segundo turno de almuerzo
    duration: 120,
    people: 2,
    status: 'completada',
    source: 'llamada',
    notes: 'Mesa tranquila',
    createdAt: new Date(2024, 8, 14),
    confirmedAt: new Date(2024, 8, 14)
  },
  {
    id: 'R_HIST_005',
    clientId: 'C002',
    tableId: 'M15',
    date: new Date(2024, 8, 14), // 14 septiembre (domingo pasado)
    time: '13:00', // Primer turno de almuerzo
    duration: 90,
    people: 8,
    status: 'completada',
    source: 'web',
    notes: 'Almuerzo dominical',
    createdAt: new Date(2024, 8, 13),
    confirmedAt: new Date(2024, 8, 13)
  },
  // Reservas futuras
  {
    id: 'R_FUT_001',
    clientId: 'C003',
    tableId: 'M10',
    date: new Date(2024, 8, 19), // 19 septiembre (jueves futuro)
    time: '20:00',
    duration: 120,
    people: 4,
    status: 'confirmada',
    source: 'llamada',
    notes: 'Cena de negocios',
    createdAt: new Date(),
    confirmedAt: new Date()
  },
  {
    id: 'R_FUT_002',
    clientId: 'C001',
    tableId: 'M7',
    date: new Date(2024, 8, 20), // 20 septiembre (viernes futuro)
    time: '21:00',
    duration: 150,
    people: 2,
    status: 'confirmada',
    source: 'web',
    notes: 'Cena especial',
    createdAt: new Date(),
    confirmedAt: new Date()
  },
  // Reservas para HOY con diferentes estados
  {
    id: 'R_TODAY_001',
    clientId: 'C001',
    tableId: 'M2',
    date: new Date(), // HOY
    time: '13:00',
    duration: 120,
    people: 2,
    status: 'pendiente',
    source: 'llamada',
    notes: 'Almuerzo de trabajo',
    createdAt: new Date()
  },
  {
    id: 'R_TODAY_002',
    clientId: 'C002',
    tableId: 'M4',
    date: new Date(), // HOY
    time: '14:30',
    duration: 90,
    people: 4,
    status: 'confirmada',
    source: 'web',
    notes: 'Familia con niños',
    createdAt: new Date(),
    confirmedAt: new Date()
  },
  {
    id: 'R_TODAY_003',
    clientId: 'C003',
    tableId: 'M8',
    date: new Date(), // HOY
    time: '20:00',
    duration: 120,
    people: 6,
    status: 'cancelada',
    source: 'whatsapp',
    notes: 'Cliente canceló por enfermedad',
    createdAt: new Date()
  }
];

// Función para obtener un cliente por ID
export function getClientById(clientId: string): Client | null {
  return mockClients.find(client => client.id === clientId) || null;
}

// Funciones para gestionar los datos
export function getTablesByStatus(status: 'libre' | 'ocupada' | 'reservada' | 'all'): Table[] {
  if (status === 'all') return mockTables;
  return mockTables.filter(table => table.status === status);
}

export function getTableById(id: string): Table | undefined {
  return mockTables.find(table => table.id === id);
}

export function updateTableStatus(tableId: string, status: Table['status'], client?: Client, reservation?: Reservation): void {
  const tableIndex = mockTables.findIndex(table => table.id === tableId);
  if (tableIndex !== -1) {
    mockTables[tableIndex].status = status;
    mockTables[tableIndex].client = client;
    mockTables[tableIndex].reservation = reservation;
    mockTables[tableIndex].lastUpdated = new Date();
  }
}

export function getReservationsByDate(date: Date): Reservation[] {
  // Usar fechas locales para evitar problemas de zona horaria
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  // Obtener reservas de las mesas
  const tableReservations = mockTables
    .filter(table => table.reservation)
    .map(table => table.reservation!)
    .filter(reservation => {
      const resDate = new Date(reservation.date);
      return resDate.getFullYear() === year && 
             resDate.getMonth() === month && 
             resDate.getDate() === day;
    });
  
  // Obtener reservas adicionales (históricas y futuras)
  const additionalReservations = mockReservations
    .filter(reservation => {
      const resDate = new Date(reservation.date);
      return resDate.getFullYear() === year && 
             resDate.getMonth() === month && 
             resDate.getDate() === day;
    });
  
  // Combinar todas las reservas y eliminar duplicados por ID
  const allReservations = [...tableReservations, ...additionalReservations];
  const uniqueReservations = allReservations.filter((reservation, index, self) => 
    index === self.findIndex(r => r.id === reservation.id)
  );
  
  return uniqueReservations;
}

export function getRestaurantMetrics(): RestaurantMetrics {
  const totalTables = mockTables.length;
  const occupiedTables = mockTables.filter(t => t.status === 'ocupada').length;
  const reservedTables = mockTables.filter(t => t.status === 'reservada').length;
  const freeTables = mockTables.filter(t => t.status === 'libre').length;
  
  const today = new Date();
  const todayReservations = getReservationsByDate(today).length;
  
  return {
    totalTables,
    occupiedTables,
    reservedTables,
    freeTables,
    todayReservations,
    weekReservations: 45, // Mock data
    monthReservations: 180, // Mock data
    averageOccupancy: Math.round(((occupiedTables + reservedTables) / totalTables) * 100),
    peakHours: ['20:00', '21:00', '22:00']
  };
}

// Función para simular actualización desde Retell AI
export function simulateRetellAIReservation(clientData: {
  name: string;
  phone: string;
  people: number;
  date: string;
  time: string;
  notes?: string;
}): { success: boolean; tableId?: string; reservationId?: string } {
  // Buscar mesa libre con capacidad suficiente
  const availableTable = mockTables.find(
    table => table.status === 'libre' && table.capacity >= clientData.people
  );
  
  if (!availableTable) {
    return { success: false };
  }
  
  // Crear cliente
  const newClient: Client = {
    id: `C${Date.now()}`,
    name: clientData.name,
    phone: clientData.phone,
    totalReservations: 1,
    lastVisit: new Date()
  };
  
  // Crear reserva
  const newReservation: Reservation = {
    id: `R${Date.now()}`,
    clientId: newClient.id,
    tableId: availableTable.id,
    date: new Date(clientData.date),
    time: clientData.time,
    duration: 120,
    people: clientData.people,
    status: 'pendiente', // Nueva reserva comienza como pendiente
    source: 'llamada',
    notes: clientData.notes,
    createdAt: new Date()
    // No se incluye confirmedAt hasta que se confirme
  };
  
  // Actualizar mesa
  updateTableStatus(availableTable.id, 'reservada', newClient, newReservation);
  
  return {
    success: true,
    tableId: availableTable.id,
    reservationId: newReservation.id
  };
}

// Función de compatibilidad para importaciones existentes
export const createReservation = simulateRetellAIReservation;

// Función para completar una reserva automáticamente
export function completeReservationAutomatically(tableId: string): { success: boolean; reservationId?: string; message: string } {
  try {
    // Buscar la mesa ocupada
    const mesa = mockTables.find(table => table.id === tableId && table.status === 'ocupada');
    
    if (!mesa || !mesa.reservation) {
      return {
        success: false,
        message: `Mesa ${tableId} no encontrada o no tiene reserva activa`
      };
    }
    
    const reservationId = mesa.reservation.id;
    const clientName = mesa.client?.name || 'Cliente';
    
    // Actualizar la reserva en mockReservations si existe
    const reservationIndex = mockReservations.findIndex(r => r.id === reservationId);
    if (reservationIndex !== -1) {
      mockReservations[reservationIndex].status = 'completada';
    }
    
    // Liberar la mesa
    updateTableStatus(tableId, 'libre');
    
    return {
      success: true,
      reservationId,
      message: `Reserva de ${clientName} completada automáticamente. Mesa ${tableId} ahora disponible.`
    };
    
  } catch (error) {
    console.error('Error al completar reserva automáticamente:', error);
    return {
      success: false,
      message: 'Error al completar la reserva automáticamente'
    };
  }
}

// Función para obtener mesas que deberían liberarse automáticamente
export function getMesasParaLiberarAutomaticamente(): Array<{
  tableId: string;
  clientName: string;
  timeOccupied: number;
  shouldRelease: boolean;
}> {
  const mesasOcupadas = getTablesByStatus('ocupada');
  const ahora = new Date();
  
  return mesasOcupadas.map(mesa => {
    if (!mesa.reservation) {
      return {
        tableId: mesa.id,
        clientName: mesa.client?.name || 'Cliente',
        timeOccupied: 0,
        shouldRelease: false
      };
    }
    
    // Calcular tiempo transcurrido desde la reserva
    const horaReserva = mesa.reservation.time;
    const fechaReserva = new Date(mesa.reservation.date);
    const [horas, minutos] = horaReserva.split(':').map(Number);
    const tiempoLlegada = new Date(fechaReserva);
    tiempoLlegada.setHours(horas, minutos, 0, 0);
    
    const tiempoTranscurrido = ahora.getTime() - tiempoLlegada.getTime();
    const tiempoEnMinutos = Math.floor(tiempoTranscurrido / (60 * 1000));
    
    // 2.5 horas = 150 minutos
    const shouldRelease = tiempoEnMinutos >= 150;
    
    return {
      tableId: mesa.id,
      clientName: mesa.client?.name || 'Cliente',
      timeOccupied: tiempoEnMinutos,
      shouldRelease
    };
  }).filter(mesa => mesa.shouldRelease);
}

