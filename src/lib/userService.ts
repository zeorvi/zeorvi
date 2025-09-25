// import { 
//   collection, 
//   doc, 
//   getDoc, 
//   getDocs, 
//   setDoc, 
//   updateDoc, 
//   query, 
//   where, 
//   orderBy 
// } from 'firebase/firestore';
// import { db } from './firebase';
import { logger } from './logger';
import { NotFoundError, ConflictError } from './errorHandler';

// Interfaces
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'restaurant';
  restaurantId?: string;
  restaurantName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  mustChangePassword: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
  };
}

export interface CreateUserData {
  username: string;
  email: string;
  role: 'admin' | 'restaurant';
  restaurantId?: string;
  restaurantName?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  restaurantName?: string;
  isActive?: boolean;
  mustChangePassword?: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
  };
}

// const USERS_COLLECTION = 'users'; // TODO: Implementar sin Firebase

// Crear nuevo usuario
export const createUser = async (userData: CreateUserData): Promise<User> => {
  try {
    // Verificar que el username no existe
    const existingByUsername = await getUserByUsername(userData.username);
    if (existingByUsername) {
      throw new ConflictError(`El usuario '${userData.username}' ya existe`);
    }

    // Verificar que el email no existe
    const existingByEmail = await getUserByEmail(userData.email);
    if (existingByEmail) {
      throw new ConflictError(`El email '${userData.email}' ya está en uso`);
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const newUser: User = {
      id: userId,
      username: userData.username,
      email: userData.email,
      role: userData.role,
      restaurantId: userData.restaurantId,
      restaurantName: userData.restaurantName,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      mustChangePassword: true, // Forzar cambio de contraseña en primer login
      profile: userData.profile || {}
    };

    // await setDoc(doc(db, USERS_COLLECTION, userId), {
    //   ...newUser,
    //   createdAt: now.toISOString(),
    //   updatedAt: now.toISOString()
    // }); // TODO: Implementar sin Firebase

    logger.info('User created successfully', { 
      userId, 
      username: userData.username, 
      role: userData.role 
    });

    return newUser;
  } catch (error) {
    logger.error('Error creating user', { error, userData });
    throw error;
  }
};

// Obtener usuario por ID
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    // const userDoc = // await getDoc(doc(db, USERS_COLLECTION, userId)) // TODO: Implementar sin Firebase;
    // 
    // if (!userDoc.exists()) {
    //   return null;
    // }
    // 
    // const userData = userDoc.data();
    // return {
    //   ...userData,
    //   createdAt: new Date(userData.createdAt),
    //   updatedAt: new Date(userData.updatedAt),
    //   lastLogin: userData.lastLogin ? new Date(userData.lastLogin) : undefined
    // } as User;
    
    // TODO: Implementar sin Firebase
    return null;
  } catch (error) {
    logger.error('Error getting user by ID', { error, userId });
    throw error;
  }
};

// Obtener usuario por username
export const getUserByUsername = async (username: string): Promise<User | null> => {
  try {
    // const usersQuery = query(
    //   collection(db, USERS_COLLECTION),
    //   where('username', '==', username),
    //   where('isActive', '==', true)
    // );
    // 
    // const querySnapshot = // await getDocs(usersQuery) // TODO: Implementar sin Firebase;
    // 
    // if (querySnapshot.empty) {
    //   return null;
    // }
    // 
    // const userDoc = querySnapshot.docs[0];
    // const userData = userDoc.data();
    
    // TODO: Implementar sin Firebase
    return null;
  } catch (error) {
    logger.error('Error getting user by username', { error, username });
    throw error;
  }
};

// Obtener usuario por email
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    // const usersQuery = query(
    //   collection(db, USERS_COLLECTION),
    //   where('email', '==', email),
    //   where('isActive', '==', true)
    // ); // TODO: Implementar sin Firebase
    
    // const querySnapshot = await getDocs(usersQuery); // TODO: Implementar sin Firebase
    
    // if (querySnapshot.empty) {
    //   return null;
    // }
    // 
    // const userDoc = querySnapshot.docs[0];
    // const userData = userDoc.data();
    
    // TODO: Implementar sin Firebase
    return null;
  } catch (error) {
    logger.error('Error getting user by email', { error, email });
    throw error;
  }
};

// Actualizar usuario
export const updateUser = async (userId: string, updateData: UpdateUserData): Promise<User> => {
  try {
    const user = await getUserById(userId);
    if (!user) {
      throw new NotFoundError(`Usuario con ID ${userId} no encontrado`);
    }

    // Verificar username único si se está actualizando
    if (updateData.username && updateData.username !== user.username) {
      const existingUser = await getUserByUsername(updateData.username);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictError(`El usuario '${updateData.username}' ya existe`);
      }
    }

    // Verificar email único si se está actualizando
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await getUserByEmail(updateData.email);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictError(`El email '${updateData.email}' ya está en uso`);
      }
    }

    // const now = new Date();
    // const updatedData = {
    //   ...updateData,
    //   updatedAt: now.toISOString()
    // };

    // await updateDoc(doc(db, USERS_COLLECTION, userId) // TODO: Implementar sin Firebase, updatedData);

    const updatedUser = await getUserById(userId);
    if (!updatedUser) {
      throw new Error('Error al obtener usuario actualizado');
    }

    logger.info('User updated successfully', { userId, updateData });
    return updatedUser;
  } catch (error) {
    logger.error('Error updating user', { error, userId, updateData });
    throw error;
  }
};

// Actualizar último login
export const updateLastLogin = async (userId: string): Promise<void> => {
  try {
    // const now = new Date();
    // await updateDoc(doc(db, USERS_COLLECTION, userId), {
    //   lastLogin: now.toISOString(),
    //   updatedAt: now.toISOString()
    // }); // TODO: Implementar sin Firebase

    logger.info('User last login updated', { userId });
  } catch (error) {
    logger.error('Error updating last login', { error, userId });
    throw error;
  }
};

// Desactivar usuario (soft delete)
export const deactivateUser = async (userId: string): Promise<void> => {
  try {
    // const now = new Date();
    // await updateDoc(doc(db, USERS_COLLECTION, userId), {
    //   isActive: false,
    //   updatedAt: now.toISOString()
    // }); // TODO: Implementar sin Firebase

    logger.info('User deactivated', { userId });
  } catch (error) {
    logger.error('Error deactivating user', { error, userId });
    throw error;
  }
};

// Activar usuario
export const activateUser = async (userId: string): Promise<void> => {
  try {
    // const now = new Date();
    // await updateDoc(doc(db, USERS_COLLECTION, userId), {
    //   isActive: true,
    //   updatedAt: now.toISOString()
    // }); // TODO: Implementar sin Firebase

    logger.info('User activated', { userId });
  } catch (error) {
    logger.error('Error activating user', { error, userId });
    throw error;
  }
};

// Obtener todos los usuarios (para admin)
export const getAllUsers = async (): Promise<User[]> => {
  try {
    // let usersQuery = query(
    //   collection(db, USERS_COLLECTION),
    //   orderBy('createdAt', 'desc')
    // ); // TODO: Implementar sin Firebase

    // if (activeOnly) {
    //   usersQuery = query(
    //     collection(db, USERS_COLLECTION),
    //     where('isActive', '==', true),
    //     orderBy('createdAt', 'desc')
    //   );
    // } // TODO: Implementar sin Firebase

    // const querySnapshot = await getDocs(usersQuery); // TODO: Implementar sin Firebase
    
    // return querySnapshot.docs.map(doc => {
    //   const userData = doc.data();
    //   return {
    //     ...userData,
    //     createdAt: new Date(userData.createdAt),
    //     updatedAt: new Date(userData.updatedAt),
    //     lastLogin: userData.lastLogin ? new Date(userData.lastLogin) : undefined
    //   } as User;
    // });
    
    // TODO: Implementar sin Firebase
    return [];
  } catch (error) {
    logger.error('Error getting all users', { error });
    throw error;
  }
};

// Obtener usuarios por restaurante
export const getUsersByRestaurant = async (restaurantId: string): Promise<User[]> => {
  try {
    // const usersQuery = query(
    //   collection(db, USERS_COLLECTION),
    //   where('restaurantId', '==', restaurantId),
    //   where('isActive', '==', true),
    //   orderBy('createdAt', 'desc')
    // ); // TODO: Implementar sin Firebase

    // const querySnapshot = await getDocs(usersQuery); // TODO: Implementar sin Firebase
    
    // return querySnapshot.docs.map(doc => {
    //   const userData = doc.data();
    //   return {
    //     ...userData,
    //     createdAt: new Date(userData.createdAt),
    //     updatedAt: new Date(userData.updatedAt),
    //     lastLogin: userData.lastLogin ? new Date(userData.lastLogin) : undefined
    //   } as User;
    // });
    
    // TODO: Implementar sin Firebase
    return [];
  } catch (error) {
    logger.error('Error getting users by restaurant', { error, restaurantId });
    throw error;
  }
};

// Cambiar contraseña (marcar como no necesaria)
export const markPasswordChanged = async (userId: string): Promise<void> => {
  try {
    // const now = new Date();
    // await updateDoc(doc(db, USERS_COLLECTION, userId), {
    //   mustChangePassword: false,
    //   updatedAt: now.toISOString()
    // }); // TODO: Implementar sin Firebase

    logger.info('Password change requirement removed', { userId });
  } catch (error) {
    logger.error('Error marking password as changed', { error, userId });
    throw error;
  }
};

// Migrar datos del userMapping existente (helper para migración)
export const migrateExistingUsers = async (): Promise<void> => {
  try {
    // Importar el mapping existente
    // const { userMappings } = await import('./userMapping'); // Property doesn't exist
    const userMappings: Record<string, unknown>[] = []; // Mock empty array
    
    for (const mapping of userMappings) {
      const mappingData = mapping as Record<string, unknown>;
      const username = typeof mappingData.username === 'string' ? mappingData.username : '';
      const email = typeof mappingData.email === 'string' ? mappingData.email : '';
      const role = mappingData.role === 'admin' || mappingData.role === 'restaurant' ? mappingData.role : 'restaurant';
      const restaurantId = typeof mappingData.restaurantId === 'string' ? mappingData.restaurantId : undefined;
      const restaurantName = typeof mappingData.restaurantName === 'string' ? mappingData.restaurantName : undefined;
      
      const existingUser = await getUserByUsername(username);
      if (!existingUser) {
        await createUser({
          username,
          email,
          role,
          restaurantId,
          restaurantName
        });
        logger.info('Migrated user from mapping', { username });
      }
    }

    logger.info('User migration completed');
  } catch (error) {
    logger.error('Error migrating users', { error });
    throw error;
  }
};

const userService = {
  createUser,
  getUserById,
  getUserByUsername,
  getUserByEmail,
  updateUser,
  updateLastLogin,
  deactivateUser,
  activateUser,
  getAllUsers,
  getUsersByRestaurant,
  markPasswordChanged,
  migrateExistingUsers
};

export default userService;
