import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Restaurant, Reservation, Call, InventoryItem, Employee, Client, Order, Incident } from '@/lib/types/restaurant';
import { logger } from '@/lib/logger';

// Colecciones Firebase
export const COLLECTIONS = {
  RESTAURANTS: 'restaurants',
  RESERVATIONS: 'reservations',
  CALLS: 'calls',
  INVENTORY: 'inventory',
  EMPLOYEES: 'employees',
  CLIENTS: 'clients',
  ORDERS: 'orders',
  INCIDENTS: 'incidents',
  TABLES: 'tables',
  METRICS: 'metrics'
} as const;

// Servicios para Restaurantes
export class RestaurantService {
  static async create(restaurant: Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.RESTAURANTS), {
        ...restaurant,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      logger.info('Restaurant created in Firebase', { restaurantId: docRef.id });
      return docRef.id;
    } catch (error) {
      logger.error('Error creating restaurant', { error });
      throw error;
    }
  }

  static async get(id: string): Promise<Restaurant | null> {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.RESTAURANTS, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Restaurant;
      }
      return null;
    } catch (error) {
      logger.error('Error getting restaurant', { id, error });
      throw error;
    }
  }

  static async update(id: string, updates: Partial<Restaurant>): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.RESTAURANTS, id), {
        ...updates,
        updatedAt: Timestamp.now()
      });
      
      logger.info('Restaurant updated in Firebase', { restaurantId: id });
    } catch (error) {
      logger.error('Error updating restaurant', { id, error });
      throw error;
    }
  }

  static async getAll(): Promise<Restaurant[]> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.RESTAURANTS));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Restaurant[];
    } catch (error) {
      logger.error('Error getting all restaurants', { error });
      throw error;
    }
  }

  static onSnapshot(callback: (restaurants: Restaurant[]) => void) {
    return onSnapshot(collection(db, COLLECTIONS.RESTAURANTS), (snapshot) => {
      const restaurants = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Restaurant[];
      callback(restaurants);
    });
  }
}

// Servicios para Reservas
export class ReservationService {
  static async create(reservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.RESERVATIONS), {
        ...reservation,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      logger.info('Reservation created in Firebase', { reservationId: docRef.id });
      return docRef.id;
    } catch (error) {
      logger.error('Error creating reservation', { error });
      throw error;
    }
  }

  static async getByRestaurant(restaurantId: string): Promise<Reservation[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.RESERVATIONS),
        where('restaurantId', '==', restaurantId),
        orderBy('dateTime', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reservation[];
    } catch (error) {
      logger.error('Error getting reservations', { restaurantId, error });
      throw error;
    }
  }

  static async update(id: string, updates: Partial<Reservation>): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.RESERVATIONS, id), {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      logger.error('Error updating reservation', { id, error });
      throw error;
    }
  }

  static onSnapshotByRestaurant(restaurantId: string, callback: (reservations: Reservation[]) => void) {
    const q = query(
      collection(db, COLLECTIONS.RESERVATIONS),
      where('restaurantId', '==', restaurantId),
      orderBy('dateTime', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const reservations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reservation[];
      callback(reservations);
    });
  }
}

// Servicios para Llamadas
export class CallService {
  static async create(call: Omit<Call, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.CALLS), {
        ...call,
        createdAt: Timestamp.now()
      });
      
      logger.info('Call logged in Firebase', { callId: docRef.id });
      return docRef.id;
    } catch (error) {
      logger.error('Error creating call', { error });
      throw error;
    }
  }

  static async getByRestaurant(restaurantId: string, limitCount: number = 50): Promise<Call[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.CALLS),
        where('restaurantId', '==', restaurantId),
        orderBy('startTime', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Call[];
    } catch (error) {
      logger.error('Error getting calls', { restaurantId, error });
      throw error;
    }
  }

  static async update(id: string, updates: Partial<Call>): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.CALLS, id), updates);
    } catch (error) {
      logger.error('Error updating call', { id, error });
      throw error;
    }
  }

  static onSnapshotByRestaurant(restaurantId: string, callback: (calls: Call[]) => void) {
    const q = query(
      collection(db, COLLECTIONS.CALLS),
      where('restaurantId', '==', restaurantId),
      orderBy('startTime', 'desc'),
      limit(50)
    );
    
    return onSnapshot(q, (snapshot) => {
      const calls = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Call[];
      callback(calls);
    });
  }
}

// Servicios para Inventario
export class InventoryService {
  static async create(item: Omit<InventoryItem, 'id' | 'lastRestocked'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.INVENTORY), {
        ...item,
        lastRestocked: Timestamp.now().toDate().toISOString()
      });
      
      return docRef.id;
    } catch (error) {
      logger.error('Error creating inventory item', { error });
      throw error;
    }
  }

  static async getByRestaurant(restaurantId: string): Promise<InventoryItem[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.INVENTORY),
        where('restaurantId', '==', restaurantId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InventoryItem[];
    } catch (error) {
      logger.error('Error getting inventory', { restaurantId, error });
      throw error;
    }
  }

  static async update(id: string, updates: Partial<InventoryItem>): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.INVENTORY, id), updates);
    } catch (error) {
      logger.error('Error updating inventory item', { id, error });
      throw error;
    }
  }

  static onSnapshotByRestaurant(restaurantId: string, callback: (items: InventoryItem[]) => void) {
    const q = query(
      collection(db, COLLECTIONS.INVENTORY),
      where('restaurantId', '==', restaurantId)
    );
    
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InventoryItem[];
      callback(items);
    });
  }
}

// Servicios para Empleados
export class EmployeeService {
  static async create(employee: Omit<Employee, 'id' | 'hiredDate'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.EMPLOYEES), {
        ...employee,
        hiredDate: new Date().toISOString()
      });
      
      return docRef.id;
    } catch (error) {
      logger.error('Error creating employee', { error });
      throw error;
    }
  }

  static async getByRestaurant(restaurantId: string): Promise<Employee[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.EMPLOYEES),
        where('restaurantId', '==', restaurantId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];
    } catch (error) {
      logger.error('Error getting employees', { restaurantId, error });
      throw error;
    }
  }

  static async update(id: string, updates: Partial<Employee>): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.EMPLOYEES, id), updates);
    } catch (error) {
      logger.error('Error updating employee', { id, error });
      throw error;
    }
  }

  static onSnapshotByRestaurant(restaurantId: string, callback: (employees: Employee[]) => void) {
    const q = query(
      collection(db, COLLECTIONS.EMPLOYEES),
      where('restaurantId', '==', restaurantId)
    );
    
    return onSnapshot(q, (snapshot) => {
      const employees = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];
      callback(employees);
    });
  }
}

// Servicio para Métricas en Tiempo Real
export class MetricsService {
  static async updateRealTimeMetrics(restaurantId: string, metrics: any): Promise<void> {
    try {
      const metricsRef = doc(db, COLLECTIONS.METRICS, restaurantId);
      await updateDoc(metricsRef, {
        ...metrics,
        lastUpdated: Timestamp.now()
      });
    } catch (error) {
      // Si el documento no existe, lo creamos
      try {
        await addDoc(collection(db, COLLECTIONS.METRICS), {
          restaurantId,
          ...metrics,
          lastUpdated: Timestamp.now()
        });
      } catch (createError) {
        logger.error('Error creating metrics', { restaurantId, error: createError });
        throw createError;
      }
    }
  }

  static onSnapshotByRestaurant(restaurantId: string, callback: (metrics: any) => void) {
    const metricsRef = doc(db, COLLECTIONS.METRICS, restaurantId);
    
    return onSnapshot(metricsRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      }
    });
  }
}

// Servicio de Batch Operations para operaciones múltiples
export class BatchService {
  static async createBatch() {
    return writeBatch(db);
  }

  static async executeBatch(batch: any) {
    try {
      await batch.commit();
      logger.info('Batch operation completed successfully');
    } catch (error) {
      logger.error('Error executing batch operation', { error });
      throw error;
    }
  }
}

// Inicialización de colecciones para un nuevo restaurante
export async function initializeRestaurantCollections(restaurantId: string, restaurant: Restaurant) {
  try {
    const batch = writeBatch(db);

    // Crear documento del restaurante
    const restaurantRef = doc(db, COLLECTIONS.RESTAURANTS, restaurantId);
    batch.set(restaurantRef, {
      ...restaurant,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // Crear métricas iniciales
    const metricsRef = doc(db, COLLECTIONS.METRICS, restaurantId);
    batch.set(metricsRef, {
      restaurantId,
      realTime: {
        currentOccupancy: 0,
        activeReservations: 0,
        waitingList: 0,
        averageWaitTime: 0,
        staffOnDuty: 0,
        currentOrders: 0,
        kitchenBacklog: 0
      },
      today: {
        revenue: 0,
        orders: 0,
        customers: 0,
        averageOrderValue: 0,
        tableOccupancy: 0,
        callsReceived: 0,
        callsAnswered: 0,
        reservations: 0
      },
      alerts: [],
      lastUpdated: Timestamp.now()
    });

    await batch.commit();
    logger.info('Restaurant collections initialized', { restaurantId });
  } catch (error) {
    logger.error('Error initializing restaurant collections', { restaurantId, error });
    throw error;
  }
}
