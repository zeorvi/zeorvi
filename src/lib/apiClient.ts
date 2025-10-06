/**
 * Cliente API con manejo automático de tokens
 * Intercepta las llamadas para manejar tokens expirados
 */

import clientAuthService from './clientAuth';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  }

  // =============================================
  // MÉTODO PRINCIPAL DE FETCH
  // =============================================

  async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = clientAuthService.getToken();
    
    // Agregar headers por defecto
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Agregar headers existentes si son un objeto plano
    if (options.headers && typeof options.headers === 'object' && !(options.headers instanceof Headers)) {
      Object.assign(headers, options.headers);
    }

    // Agregar token de autorización si existe
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Si la respuesta es 401 (Unauthorized), limpiar el token
      if (response.status === 401) {
        console.warn('🔑 Unauthorized response, clearing token');
        clientAuthService.clearToken();
        
        // Si estamos en el navegador, redirigir al login
        if (typeof window !== 'undefined') {
          // Solo redirigir si no estamos ya en la página de login
          if (!window.location.pathname.includes('/login')) {
            console.log('🔄 Redirecting to login page');
            window.location.href = '/login';
          }
        }
      }

      return response;
    } catch (error) {
      console.error('❌ API Request failed:', error);
      throw error;
    }
  }

  // =============================================
  // MÉTODOS CONVENIENCIA
  // =============================================

  async get(endpoint: string, options: RequestInit = {}): Promise<Response> {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint: string, data?: any, options: RequestInit = {}): Promise<Response> {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(endpoint: string, data?: any, options: RequestInit = {}): Promise<Response> {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string, options: RequestInit = {}): Promise<Response> {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // =============================================
  // MÉTODOS ESPECÍFICOS PARA RESTAURANTES
  // =============================================

  async getRestaurant(restaurantId: string): Promise<any> {
    const response = await this.get(`/restaurants/${restaurantId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch restaurant: ${response.status}`);
    }
    
    const data = await response.json();
    return data.restaurant;
  }

  async updateRestaurant(restaurantId: string, data: any): Promise<any> {
    const response = await this.put(`/restaurants/${restaurantId}`, data);
    
    if (!response.ok) {
      throw new Error(`Failed to update restaurant: ${response.status}`);
    }
    
    const result = await response.json();
    return result.restaurant;
  }
}

// Instancia singleton
export const apiClient = new ApiClient();
export default apiClient;
