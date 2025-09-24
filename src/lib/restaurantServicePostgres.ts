/**
 * Servicio de Restaurantes para PostgreSQL
 * Reemplaza el servicio de Firebase
 */

export interface RestaurantData {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  status: 'active' | 'inactive';
  plan: 'basic' | 'premium' | 'enterprise';
  owner_email: string;
  owner_name?: string;
  config: Record<string, any>;
  retell_config: Record<string, any>;
  twilio_config: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_count: number;
}

/**
 * Obtiene todos los restaurantes desde la API
 */
export async function getAllRestaurants(): Promise<RestaurantData[]> {
  try {
    console.log('🔍 Fetching all restaurants from API...');
    
    // Obtener token de las cookies o localStorage como respaldo
    const getToken = () => {
      if (typeof document === 'undefined') return null;
      
      // Intentar obtener de cookies primero
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'auth-token') {
          return value;
        }
      }
      
      // Respaldo: obtener de localStorage
      return localStorage.getItem('auth-token');
    };

    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Agregar token al header Authorization si está disponible
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔑 Token encontrado, enviando en header Authorization');
    } else {
      console.log('⚠️ No se encontró token, usando solo cookies');
    }
    
    const response = await fetch('/api/restaurants', {
      method: 'GET',
      credentials: 'include', // Incluir cookies de autenticación
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error('❌ Unauthorized - user not authenticated');
        throw new Error('No autorizado');
      }
      if (response.status === 403) {
        console.error('❌ Forbidden - user not admin');
        throw new Error('No tienes permisos para listar restaurantes');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al obtener restaurantes');
    }

    console.log(`📊 Found ${data.restaurants.length} restaurants:`, data.restaurants);
    return data.restaurants;
  } catch (error) {
    console.error('❌ Error fetching restaurants:', error);
    throw error;
  }
}

/**
 * Obtiene un restaurante específico por ID
 */
export async function getRestaurantById(restaurantId: string): Promise<RestaurantData | null> {
  try {
    console.log('🔍 Fetching restaurant by ID:', restaurantId);
    
    const response = await fetch(`/api/restaurants/${restaurantId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      if (response.status === 401) {
        console.error('❌ Unauthorized - user not authenticated');
        throw new Error('HTTP error! status: 401');
      }
      if (response.status === 403) {
        console.error('❌ Forbidden - user not authorized for this restaurant');
        throw new Error('HTTP error! status: 403');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al obtener el restaurante');
    }

    console.log('📊 Restaurant found:', data.restaurant);
    return data.restaurant;
  } catch (error) {
    console.error('❌ Error fetching restaurant:', error);
    throw error;
  }
}

/**
 * Crea un nuevo restaurante
 */
export async function createRestaurant(restaurantData: {
  name: string;
  slug: string;
  owner_email: string;
  owner_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  config?: Record<string, any>;
  retell_config?: Record<string, any>;
  twilio_config?: Record<string, any>;
}): Promise<RestaurantData | null> {
  try {
    console.log('🔄 Creating restaurant:', restaurantData);
    
    const response = await fetch('/api/restaurants', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(restaurantData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al crear el restaurante');
    }

    console.log('✅ Restaurant created:', data.restaurant);
    return data.restaurant;
  } catch (error) {
    console.error('❌ Error creating restaurant:', error);
    throw error;
  }
}

/**
 * Actualiza un restaurante existente
 */
export async function updateRestaurant(
  restaurantId: string, 
  updateData: Partial<RestaurantData>
): Promise<RestaurantData | null> {
  try {
    console.log('🔄 Updating restaurant:', restaurantId, updateData);
    
    const response = await fetch(`/api/restaurants/${restaurantId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al actualizar el restaurante');
    }

    console.log('✅ Restaurant updated:', data.restaurant);
    return data.restaurant;
  } catch (error) {
    console.error('❌ Error updating restaurant:', error);
    throw error;
  }
}

/**
 * Actualiza las credenciales de acceso de un restaurante
 */
export async function updateRestaurantCredentials(
  restaurantId: string,
  credentials: {
    username: string;
    password: string;
  }
): Promise<boolean> {
  try {
    console.log('🔄 Updating restaurant credentials:', restaurantId);
    console.log('📧 New username:', credentials.username);
    console.log('🔑 Password provided:', credentials.password ? 'Yes' : 'No');
    
    const response = await fetch(`/api/restaurants/${restaurantId}/credentials`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password
      }),
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP Error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error('❌ API Error:', data.error);
      throw new Error(data.error || 'Error al actualizar las credenciales');
    }

    console.log('✅ Restaurant credentials updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error updating restaurant credentials:', error);
    throw error;
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
    console.log('🔄 Updating restaurant owner info:', restaurantId);
    
    const updateData = {
      owner_name: ownerInfo.ownerName,
      phone: ownerInfo.personalPhone,
      // Guardar información adicional en el campo config
      config: {
        owner_position: ownerInfo.position,
        owner_notes: ownerInfo.notes
      }
    };
    
    const response = await fetch(`/api/restaurants/${restaurantId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al actualizar la información del propietario');
    }

    console.log('✅ Restaurant owner info updated');
    return true;
  } catch (error) {
    console.error('❌ Error updating restaurant owner info:', error);
    throw error;
  }
}

/**
 * Elimina un restaurante
 */
export async function deleteRestaurant(restaurantId: string): Promise<boolean> {
  try {
    console.log('🗑️ Deleting restaurant:', restaurantId);
    
    const response = await fetch(`/api/restaurants/${restaurantId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al eliminar el restaurante');
    }

    console.log('✅ Restaurant deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Error deleting restaurant:', error);
    throw error;
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
    
    const response = await fetch(`/api/restaurants/${restaurantId}/status`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al actualizar el estado del restaurante');
    }

    console.log('✅ Restaurant status updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error updating restaurant status:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de un restaurante
 */
export async function getRestaurantStats(restaurantId: string): Promise<Record<string, any> | null> {
  try {
    console.log('📊 Fetching restaurant stats:', restaurantId);
    
    const response = await fetch(`/api/restaurants/${restaurantId}/stats`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al obtener estadísticas del restaurante');
    }

    console.log('📊 Restaurant stats:', data.stats);
    return data.stats;
  } catch (error) {
    console.error('❌ Error fetching restaurant stats:', error);
    throw error;
  }
}
