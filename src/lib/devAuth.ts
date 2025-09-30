/**
 * Sistema de Autenticación para Desarrollo
 * Funciona sin base de datos para testing
 */

export interface DevUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee' | 'restaurant';
  restaurantId: string;
  restaurantName: string;
  permissions: string[];
}

// Usuarios de desarrollo predefinidos
const DEV_USERS: DevUser[] = [
  {
    id: 'dev-admin-1',
    email: 'admin@restauranteia.com',
    name: 'Administrador',
    role: 'admin',
    restaurantId: 'dev-restaurant-1',
    restaurantName: 'Restaurante Demo',
    permissions: ['all']
  },
  {
    id: 'dev-restaurant-1',
    email: 'admin@elbuensabor.com',
    name: 'El Buen Sabor Admin',
    role: 'restaurant',
    restaurantId: 'rest_001',
    restaurantName: 'El Buen Sabor',
    permissions: ['restaurant_management']
  },
  {
    id: 'dev-restaurant-2',
    email: 'admin@lagaviota.com',
    name: 'La Gaviota Admin',
    role: 'restaurant',
    restaurantId: 'rest_003',
    restaurantName: 'La Gaviota',
    permissions: ['restaurant_management']
  }
];

// Contraseñas de desarrollo (en producción esto sería hasheado)
const DEV_PASSWORDS: { [email: string]: string } = {
  'admin@restauranteia.com': 'admin123',
  'admin@elbuensabor.com': 'elbuensabor123',
  'admin@lagaviota.com': 'lagaviota123'
};

export class DevAuthService {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
  }

  async login(email: string, password: string): Promise<{ user: DevUser; token: string }> {
    // Verificar credenciales
    const user = DEV_USERS.find(u => u.email === email);
    const expectedPassword = DEV_PASSWORDS[email];

    if (!user || !expectedPassword || password !== expectedPassword) {
      throw new Error('Credenciales inválidas');
    }

    // Generar token JWT simple
    const token = this.generateToken(user);

    return { user, token };
  }

  async verifyToken(token: string): Promise<DevUser | null> {
    try {
      // Decodificar token (simplificado para desarrollo)
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Verificar expiración
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        return null;
      }

      // Buscar usuario
      const user = DEV_USERS.find(u => u.id === payload.userId);
      return user || null;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  async logout(userId: string): Promise<void> {
    // En desarrollo, simplemente loguear
    console.log(`User ${userId} logged out`);
  }

  private generateToken(user: DevUser): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 días
    };

    // Crear token JWT simple (sin verificación de firma en desarrollo)
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    
    return `${encodedHeader}.${encodedPayload}.dev-signature`;
  }
}

export const devAuthService = new DevAuthService();
