/**
 * Datos hardcoded de restaurantes para producción (Vercel)
 * Se usa cuando no hay acceso a la base de datos
 */

export interface HardcodedRestaurant {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  owner_name: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  config: Record<string, any>;
  plan: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  user_count?: number;
}

export const HARDCODED_RESTAURANTS: HardcodedRestaurant[] = [
  {
    id: 'admin',
    name: 'Administración General',
    slug: 'admin',
    owner_email: 'admin@restauranteia.com',
    owner_name: 'Administrador',
    phone: '+34 900 000 000',
    address: 'Oficina Central',
    city: 'Madrid',
    country: 'España',
    config: { theme: 'admin', features: ['all'] },
    plan: 'enterprise',
    status: 'active',
    user_count: 1
  },
  {
    id: 'rest_001',
    name: 'El Buen Sabor',
    slug: 'elbuensabor',
    owner_email: 'admin@elbuensabor.com',
    owner_name: 'Carlos Rodríguez',
    phone: '+34 912 345 678',
    address: 'Calle Mayor, 45',
    city: 'Madrid',
    country: 'España',
    config: { theme: 'modern', features: ['reservations', 'tables', 'menu'] },
    plan: 'premium',
    status: 'active',
    user_count: 1
  },
  {
    id: 'rest_003',
    name: 'La Gaviota',
    slug: 'lagaviota',
    owner_email: 'admin@lagaviota.com',
    owner_name: 'María García',
    phone: '+34 963 123 456',
    address: 'Paseo Marítimo, 123',
    city: 'Valencia',
    country: 'España',
    config: { theme: 'maritime', features: ['reservations', 'tables', 'menu', 'retell_ai'] },
    plan: 'premium',
    status: 'active',
    user_count: 1
  }
];

export function getHardcodedRestaurant(id: string): HardcodedRestaurant | null {
  const restaurant = HARDCODED_RESTAURANTS.find(r => r.id === id);
  return restaurant || null;
}

export function getHardcodedRestaurantBySlug(slug: string): HardcodedRestaurant | null {
  const restaurant = HARDCODED_RESTAURANTS.find(r => r.slug === slug);
  return restaurant || null;
}

export function getAllHardcodedRestaurants(): HardcodedRestaurant[] {
  return HARDCODED_RESTAURANTS;
}

