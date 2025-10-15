/**
 * Usuarios hardcoded para producción (Vercel)
 * Solo se usa cuando no hay acceso a la base de datos
 */

import bcrypt from 'bcryptjs';

export interface HardcodedUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'admin' | 'manager' | 'employee' | 'restaurant';
  restaurantId: string;
  restaurantName: string;
  permissions: string[];
}

// Contraseña: admin123
const DEFAULT_PASSWORD_HASH = '$2b$12$mgwC.JbdWLwf5fEit7lSeOLfLncb/CpZg4ty3/BvGBHitLK9DkQLe';

export const HARDCODED_USERS: HardcodedUser[] = [
  {
    id: 'user_admin',
    email: 'admin@restauranteia.com',
    passwordHash: DEFAULT_PASSWORD_HASH,
    name: 'Administrador',
    role: 'admin',
    restaurantId: 'rest_001',
    restaurantName: 'Administración General',
    permissions: ['*']
  },
  {
    id: 'user_lagaviota',
    email: 'admin@lagaviota.com',
    passwordHash: '$2b$12$gacV8viNHKhJWP47DvD3oe/SAjklvO6HVl.8xw/Tq.ktRbWShkQd6', // lagaviota123
    name: 'La Gaviota',
    role: 'restaurant',
    restaurantId: 'rest_003',
    restaurantName: 'La Gaviota',
    permissions: ['reservations', 'tables', 'menu']
  },
  {
    id: 'user_elbuensabor',
    email: 'admin@elbuensabor.com',
    passwordHash: DEFAULT_PASSWORD_HASH,
    name: 'El Buen Sabor',
    role: 'restaurant',
    restaurantId: 'rest_002',
    restaurantName: 'El Buen Sabor',
    permissions: ['reservations', 'tables', 'menu']
  }
];

export async function findUserByEmail(email: string): Promise<HardcodedUser | null> {
  const user = HARDCODED_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  return user || null;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

