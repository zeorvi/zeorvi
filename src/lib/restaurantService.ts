import { doc, updateDoc, getDoc, collection, getDocs, query, orderBy, setDoc, deleteDoc } from 'firebase/firestore';
import { updatePassword, signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from './firebase';
import { toast } from 'sonner';

export interface TableState {
  id: string;
  name: string;
  capacity: number;
  location: string;
  status: 'libre' | 'ocupada' | 'reservada';
  client?: {
    name: string;
    phone: string;
    partySize: number;
    notes?: string;
  };
  lastUpdated: string;
  updatedBy: 'gerente' | 'retell' | 'system';
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
  phone: string;
  address: string;
  type: string;
  status: 'active' | 'inactive';
  credentials: RestaurantCredentials;
  tables?: Array<{
    id: string;
    name: string;
    capacity: number;
    location: string;
    notes?: string;
  }>;
  ownerInfo?: {
    ownerName: string;
    personalPhone: string;
    position: string;
    notes: string;
  };
  createdAt: string;
}

/**
 * Actualiza las credenciales de un restaurante en Firebase
 */
export async function updateRestaurantCredentials(
  restaurantId: string, 
  credentials: RestaurantCredentials
): Promise<boolean> {
  try {
    console.log('🔄 Updating credentials for restaurant:', restaurantId);
    console.log('📝 New credentials:', credentials);

    // Primero obtener los datos del restaurante para conseguir el email
    const restaurantData = await getRestaurantData(restaurantId);
    if (!restaurantData) {
      console.error('❌ Restaurant not found for credential update');
      toast.error('Restaurante no encontrado');
      return false;
    }

    // Actualizar en Firestore
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    await updateDoc(restaurantRef, {
      credentials: {
        username: credentials.username,
        password: credentials.password,
        lastLogin: credentials.lastLogin || new Date().toISOString()
      },
      lastUpdated: new Date().toISOString()
    });

    // Actualizar en Firebase Auth
    try {
      console.log('🔐 Updating Firebase Auth password for:', restaurantData.email);
      
      // Necesitamos autenticar primero con la contraseña actual para poder cambiarla
      // Esto es una limitación de Firebase Auth - necesitas estar autenticado para cambiar la contraseña
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.email === restaurantData.email) {
        await updatePassword(currentUser, credentials.password);
        console.log('✅ Firebase Auth password updated successfully');
      } else {
        console.log('⚠️ Cannot update Firebase Auth password - user not authenticated or different user');
        console.log('🔄 The new password will work for login validation through Firestore');
      }
    } catch (authError) {
      console.error('⚠️ Error updating Firebase Auth password:', authError);
      console.log('🔄 Credentials updated in Firestore, Firebase Auth will sync on next login');
    }

    console.log('✅ Credentials updated successfully in Firestore');
    toast.success('✅ Credenciales actualizadas. El nuevo usuario y contraseña estarán disponibles inmediatamente.');
    return true;
  } catch (error) {
    console.error('❌ Error updating credentials:', error);
    toast.error('Error al actualizar las credenciales');
    return false;
  }
}

/**
 * Obtiene los datos de un restaurante desde Firebase
 */
export async function getRestaurantData(restaurantId: string): Promise<RestaurantData | null> {
  try {
    console.log('🔍 Fetching restaurant data for:', restaurantId);
    
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    const restaurantSnap = await getDoc(restaurantRef);
    
    if (restaurantSnap.exists()) {
      const data = restaurantSnap.data() as RestaurantData;
      console.log('📊 Restaurant data retrieved:', data);
      console.log('🪑 Tables found:', data.tables ? data.tables.length : 0, data.tables);
      return data;
    } else {
      console.log('❌ Restaurant not found:', restaurantId);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching restaurant data:', error);
    toast.error('Error al obtener los datos del restaurante');
    return null;
  }
}

/**
 * Actualiza la información del propietario de un restaurante
 */
export async function updateRestaurantOwnerInfo(
  restaurantId: string,
  ownerInfo: {
    ownerName: string;
    personalPhone: string;
    position: string;
    notes: string;
  }
): Promise<boolean> {
  try {
    console.log('🔄 Updating owner info for restaurant:', restaurantId);
    console.log('📝 New owner info:', ownerInfo);

    const restaurantRef = doc(db, 'restaurants', restaurantId);
    
    await updateDoc(restaurantRef, {
      ownerInfo: ownerInfo,
      lastUpdated: new Date().toISOString()
    });

    console.log('✅ Owner info updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error updating owner info:', error);
    toast.error('Error al actualizar la información del propietario');
    return false;
  }
}

/**
 * Obtiene todos los restaurantes desde Firebase
 */
export async function getAllRestaurants(): Promise<RestaurantData[]> {
  try {
    console.log('🔍 Fetching all restaurants from Firebase...');
    
    const restaurantsRef = collection(db, 'restaurants');
    const q = query(restaurantsRef, orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    const restaurants: RestaurantData[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      restaurants.push({
        id: doc.id,
        name: data.name || 'Sin nombre',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        type: data.type || '',
        status: data.status || 'active',
        credentials: data.credentials || { username: '', password: '' },
        ownerInfo: data.ownerInfo,
        createdAt: data.createdAt || new Date().toISOString()
      });
    });
    
    console.log(`📊 Found ${restaurants.length} restaurants:`, restaurants);
    return restaurants;
  } catch (error) {
    console.error('❌ Error fetching restaurants:', error);
    toast.error('Error al cargar los restaurantes');
    return [];
  }
}

/**
 * Crea un nuevo restaurante en Firebase
 */
export async function createRestaurant(restaurantData: {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  twilioNumber: string;
  credentials: RestaurantCredentials;
  tables?: any[];
  retellConfig?: any;
  twilioConfig?: any;
}): Promise<boolean> {
  try {
    console.log('🔄 Creating restaurant in Firebase:', restaurantData.id);
    console.log('📝 Restaurant data:', restaurantData);

    const restaurantRef = doc(db, 'restaurants', restaurantData.id);
    
    const newRestaurant = {
      id: restaurantData.id,
      name: restaurantData.name,
      email: restaurantData.email,
      phone: restaurantData.phone,
      address: restaurantData.address,
      type: 'Restaurante Tradicional',
      status: 'active',
      credentials: restaurantData.credentials,
      tables: restaurantData.tables || [],
      retellConfig: restaurantData.retellConfig || {},
      twilioConfig: restaurantData.twilioConfig || {},
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    await setDoc(restaurantRef, newRestaurant);

    console.log('✅ Restaurant created successfully in Firebase');
    return true;
  } catch (error) {
    console.error('❌ Error creating restaurant:', error);
    toast.error('Error al crear el restaurante en la base de datos');
    return false;
  }
}

/**
 * Elimina un restaurante de Firebase
 */
export async function deleteRestaurant(restaurantId: string): Promise<boolean> {
  try {
    console.log('🗑️ Deleting restaurant from Firebase:', restaurantId);

    const restaurantRef = doc(db, 'restaurants', restaurantId);
    await deleteDoc(restaurantRef);

    console.log('✅ Restaurant deleted successfully from Firebase');
    return true;
  } catch (error) {
    console.error('❌ Error deleting restaurant:', error);
    toast.error('Error al eliminar el restaurante');
    return false;
  }
}

/**
 * Actualiza el estado de un restaurante (activo/inactivo)
 */
export async function updateRestaurantStatus(
  restaurantId: string, 
  status: 'active' | 'inactive'
): Promise<boolean> {
  try {
    console.log('🔄 Updating restaurant status:', restaurantId, 'to', status);

    const restaurantRef = doc(db, 'restaurants', restaurantId);
    
    await updateDoc(restaurantRef, {
      status: status,
      lastUpdated: new Date().toISOString()
    });

    console.log('✅ Restaurant status updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error updating restaurant status:', error);
    toast.error('Error al actualizar el estado del restaurante');
    return false;
  }
}

/**
 * Actualiza el estado de una mesa en Firebase
 */
export async function updateTableStateInFirebase(
  restaurantId: string,
  tableId: string,
  tableState: Omit<TableState, 'id' | 'name' | 'capacity' | 'location'>
): Promise<boolean> {
  try {
    console.log('🔄 Updating table state in Firebase:', { restaurantId, tableId, tableState });

    const tableRef = doc(db, 'restaurants', restaurantId, 'tableStates', tableId);
    
    await setDoc(tableRef, {
      ...tableState,
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    console.log('✅ Table state updated in Firebase');
    return true;
  } catch (error) {
    console.error('❌ Error updating table state:', error);
    return false;
  }
}

/**
 * Obtiene los estados de las mesas desde Firebase
 */
export async function getTableStatesFromFirebase(restaurantId: string): Promise<TableState[]> {
  try {
    console.log('🔍 Fetching table states from Firebase for restaurant:', restaurantId);
    
    const tableStatesRef = collection(db, 'restaurants', restaurantId, 'tableStates');
    const querySnapshot = await getDocs(tableStatesRef);
    
    const tableStates: TableState[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      tableStates.push({
        id: doc.id,
        ...data
      } as TableState);
    });
    
    console.log(`📊 Found ${tableStates.length} table states in Firebase`);
    return tableStates;
  } catch (error) {
    console.error('❌ Error fetching table states:', error);
    return [];
  }
}

/**
 * Sincroniza estados de mesas entre datos locales y Firebase
 */
export async function syncTableStates(
  restaurantId: string,
  localTables: TableState[]
): Promise<TableState[]> {
  try {
    console.log('🔄 Syncing table states with Firebase...');
    
    // Obtener estados desde Firebase
    const firebaseStates = await getTableStatesFromFirebase(restaurantId);
    
    // Combinar estados locales con Firebase (Firebase tiene prioridad para cambios de Retell)
    const syncedTables = localTables.map(localTable => {
      const firebaseState = firebaseStates.find(fs => fs.id === localTable.id);
      
      if (firebaseState) {
        // Si Firebase tiene un estado más reciente, usarlo
        const firebaseTime = new Date(firebaseState.lastUpdated);
        const localTime = new Date(localTable.lastUpdated);
        
        if (firebaseTime > localTime) {
          console.log(`🔄 Using Firebase state for table ${localTable.id} (newer)`);
          return firebaseState;
        }
      }
      
      return localTable;
    });
    
    console.log('✅ Table states synchronized');
    return syncedTables;
  } catch (error) {
    console.error('❌ Error syncing table states:', error);
    return localTables; // Fallback a estados locales
  }
}

/**
 * Valida credenciales de restaurante desde Firebase
 */
export async function validateRestaurantCredentials(
  username: string, 
  password: string
): Promise<{ valid: boolean; restaurantData?: RestaurantData; email?: string } | null> {
  try {
    console.log('🔍 Validating credentials for username:', username);
    
    const restaurantsRef = collection(db, 'restaurants');
    const querySnapshot = await getDocs(restaurantsRef);
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data() as RestaurantData;
      
      // Verificar si las credenciales coinciden (tanto usuario como contraseña)
      if (data.credentials && 
          data.credentials.username === username && 
          data.credentials.password === password) {
        
        console.log('✅ Username and password match for restaurant:', data.name);
        console.log('🔑 Validated credentials:', { username, restaurantName: data.name });
        
        // Verificar que el restaurante esté activo
        if (data.status === 'inactive') {
          console.log('❌ Restaurant is inactive');
          return { valid: false };
        }
        
        return { 
          valid: true, 
          restaurantData: data,
          email: data.email 
        };
      }
    }
    
    console.log('❌ No matching username/password combination found');
    return { valid: false };
  } catch (error) {
    console.error('❌ Error validating credentials:', error);
    return null;
  }
}
