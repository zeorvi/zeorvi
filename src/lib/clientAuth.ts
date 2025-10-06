/**
 * Servicio de Autenticación para el Cliente
 * Solo hace llamadas a la API, no importa dependencias del servidor
 */

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'manager' | 'employee' | 'restaurant';
  restaurantId: string;
  restaurantName: string;
  permissions: string[];
  lastLogin?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  restaurantSlug?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  restaurantId?: string;
  role?: 'admin' | 'manager' | 'employee' | 'restaurant';
}

class ClientAuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  }

  // =============================================
  // LOGIN
  // =============================================

  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en el login');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // =============================================
  // REGISTRO
  // =============================================

  async register(data: RegisterData): Promise<{ user: AuthUser; token: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en el registro');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // =============================================
  // VERIFICACIÓN DE TOKEN
  // =============================================

  async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      // Verificar si el token está expirado antes de hacer la llamada
      if (this.isTokenExpired(token)) {
        console.warn('Token is expired, clearing it');
        this.clearToken();
        return null;
      }

      const response = await fetch(`${this.baseUrl}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Si el token es inválido, limpiarlo
        console.warn('Token verification failed, clearing token');
        this.clearToken();
        return null;
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Token verification error:', error);
      this.clearToken();
      return null;
    }
  }

  // =============================================
  // LOGOUT
  // =============================================

  async logout(userId: string): Promise<void> {
    try {
      const token = this.getToken();
      if (!token) return;

      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });
    } catch (error) {
      console.error('Logout error:', error);
      // No lanzar error, el logout debe funcionar aunque falle el servidor
    }
  }

  // =============================================
  // CAMBIO DE CONTRASEÑA
  // =============================================

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch(`${this.baseUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error cambiando contraseña');
      }
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  // =============================================
  // UTILIDADES DE TOKEN
  // =============================================

  isTokenExpired(token: string): boolean {
    try {
      // Decodificar el token sin verificar la firma (solo para obtener la fecha de expiración)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // Si hay error, considerar como expirado
    }
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    // Intentar obtener de localStorage primero
    const localToken = localStorage.getItem('auth-token');
    if (localToken) return localToken;
    
    // Respaldo: obtener de cookies
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'auth-token') {
        return value;
      }
    }
    
    return null;
  }

  saveToken(token: string): void {
    if (typeof window === 'undefined') return;
    
    // Guardar en localStorage
    localStorage.setItem('auth-token', token);
    
    // También guardar en cookies como respaldo
    document.cookie = `auth-token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
  }

  clearToken(): void {
    if (typeof window === 'undefined') return;
    
    // Limpiar localStorage
    localStorage.removeItem('auth-token');
    
    // Limpiar cookies
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }

  // =============================================
  // VERIFICACIÓN DE SESIÓN
  // =============================================

  async checkSession(): Promise<AuthUser | null> {
    const token = this.getToken();
    if (!token) return null;

    return await this.verifyToken(token);
  }
}

// Instancia singleton para el cliente
export const clientAuthService = new ClientAuthService();
export default clientAuthService;
