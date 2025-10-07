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

export interface LoginResponse {
  user: AuthUser;
  token: string;
}

export interface VerifyResponse {
  user: AuthUser;
}

class ClientAuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  }

  // =============================================
  // UTILIDADES DE RESPUESTA
  // =============================================

  private async handleJsonResponse(response: Response): Promise<unknown> {
    // Verificar Content-Type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected JSON response but got ${contentType}`);
    }

    try {
      return await response.json();
    } catch (jsonError) {
      console.error('Failed to parse JSON response:', jsonError);
      throw new Error('Error procesando respuesta del servidor');
    }
  }

  private async handleErrorResponse(response: Response, defaultMessage: string): Promise<never> {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || defaultMessage);
      } catch (jsonError) {
        console.error('Failed to parse error response:', jsonError);
        throw new Error(`${defaultMessage} (status: ${response.status})`);
      }
    } else {
      throw new Error(`${defaultMessage} (status: ${response.status})`);
    }
  }

  // =============================================
  // LOGIN
  // =============================================

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response, 'Error en el login');
      }

      const data = await this.handleJsonResponse(response) as LoginResponse;
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // =============================================
  // REGISTRO
  // =============================================

  async register(data: RegisterData): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response, 'Error en el registro');
      }

      const result = await this.handleJsonResponse(response) as LoginResponse;
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
      // Validar token básico antes de verificar expiración
      if (!token || typeof token !== 'string' || token.trim() === '') {
        console.warn('Invalid token provided for verification');
        this.clearToken();
        return null;
      }

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
        console.warn(`Token verification failed with status ${response.status}, clearing token`);
        this.clearToken();
        return null;
      }

      const data = await this.handleJsonResponse(response) as VerifyResponse;
      
      // Validar que la respuesta contenga un usuario válido
      if (!data || !data.user) {
        console.warn('Invalid response from token verification');
        this.clearToken();
        return null;
      }

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
      // Validar que el token tenga el formato JWT correcto
      if (!token || typeof token !== 'string') {
        console.warn('Invalid token format: token is empty or not a string');
        return true;
      }

      // Verificar que el token tenga al menos 3 partes separadas por puntos
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.warn('Invalid JWT format: token does not have 3 parts');
        return true;
      }

      // Validar que la parte del payload no esté vacía
      const payloadPart = tokenParts[1];
      if (!payloadPart || payloadPart.trim() === '') {
        console.warn('Invalid JWT format: payload part is empty');
        return true;
      }

      // Intentar decodificar el payload
      let payload: { exp?: number };
      try {
        // Asegurar que la cadena base64 esté correctamente formateada
        const cleanPayload = payloadPart.replace(/[^A-Za-z0-9+/=]/g, '');
        payload = JSON.parse(atob(cleanPayload));
      } catch (decodeError) {
        console.warn('Failed to decode JWT payload:', decodeError);
        return true;
      }

      // Verificar que el payload tenga la propiedad exp
      if (!payload || typeof payload.exp !== 'number') {
        console.warn('Invalid JWT payload: missing or invalid exp field');
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp < currentTime;
      
      if (isExpired) {
        console.info('Token is expired');
      }
      
      return isExpired;
    } catch (error) {
      console.error('Unexpected error checking token expiration:', error);
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
