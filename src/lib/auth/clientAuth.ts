/**
 * Sistema de Autenticación para Cliente
 * Usa APIs REST en lugar de acceso directo a la base de datos
 */

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'restaurant';
  restaurantId?: string;
  restaurantName?: string;
  permissions: string[];
  lastLogin?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}

class ClientAuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  }

  /**
   * Iniciar sesión
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Error al iniciar sesión'
        };
      }

      return {
        success: true,
        user: data.user,
        token: data.token
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Error de conexión'
      };
    }
  }

  /**
   * Registrar nuevo usuario
   */
  async register(data: {
    email: string;
    password: string;
    name?: string;
    role: 'admin' | 'restaurant';
    restaurantId?: string;
    restaurantName?: string;
  }): Promise<AuthResult> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Error al registrar usuario'
        };
      }

      return {
        success: true,
        user: result.user,
        token: result.token
      };

    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Error de conexión'
      };
    }
  }

  /**
   * Obtener información del usuario actual
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Incluir cookies
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.user || null;

    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Cerrar sesión
   */
  async logout(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // Limpiar tokens del cliente
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      localStorage.removeItem('auth-token');

      return response.ok;

    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  /**
   * Verificar si el usuario está autenticado
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  /**
   * Obtener token de las cookies
   */
  getTokenFromCookies(): string | null {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'auth-token') {
        return value;
      }
    }
    return null;
  }

  /**
   * Guardar token en cookies y localStorage
   */
  saveToken(token: string): void {
    if (typeof document === 'undefined') return;
    
    // Guardar en cookie
    document.cookie = `auth-token=${token}; path=/; max-age=${24 * 60 * 60}`; // 24 horas
    
    // Guardar en localStorage como respaldo
    localStorage.setItem('auth-token', token);
  }

  /**
   * Validar credenciales de restaurante (compatibilidad con sistema anterior)
   */
  async validateRestaurantCredentials(username: string, password: string): Promise<{
    valid: boolean;
    user?: AuthUser;
    restaurantData?: any;
  }> {
    try {
      // Determinar el email a usar
      let email = username;
      
      // Si es un username conocido, usar el mapeo
      const userEmailMap: { [key: string]: string } = {
        'admin': 'admin@restauranteia.com',
        'elbuensabor': 'admin@elbuensabor.com'
      };
      
      if (userEmailMap[username.toLowerCase()]) {
        email = userEmailMap[username.toLowerCase()];
      }
      
      // Intentar login
      const authResult = await this.login({ email, password });
      
      if (!authResult.success || !authResult.user) {
        return { valid: false };
      }

      // Si es un restaurante, obtener datos del restaurante
      let restaurantData = null;
      if (authResult.user.restaurantId) {
        try {
          const response = await fetch(`/api/restaurants/${authResult.user.restaurantId}`);
          if (response.ok) {
            const data = await response.json();
            restaurantData = data.restaurant;
          }
        } catch (error) {
          console.error('Error fetching restaurant data:', error);
        }
      }

      return {
        valid: true,
        user: authResult.user,
        restaurantData
      };

    } catch (error) {
      console.error('Restaurant credentials validation error:', error);
      return { valid: false };
    }
  }
}

// Instancia singleton para el cliente
export const clientAuth = new ClientAuthService();
export default clientAuth;

