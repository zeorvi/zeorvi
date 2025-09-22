// Sistema de mapeo de usuarios
// Mapea nombres de usuario a emails de Firebase

export interface UserMapping {
  username: string;
  email: string;
  role: 'admin' | 'restaurant';
  restaurantId?: string;
  restaurantName?: string;
  restaurantType?: string;
  airtableUrl?: string;
  airtableBaseId?: string;
  retellConfig?: {
    agentId: string;
    apiKey: string;
    voiceId: string;
    language: string;
  };
  twilioConfig?: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
    whatsappNumber: string;
  };
}

// Base de datos de usuarios (en producción esto estaría en Airtable o Firestore)
const userMappings: UserMapping[] = [
  {
    username: 'admin',
    email: 'admin@restauranteia.com',
    role: 'admin'
  },
  {
    username: 'elbuensabor',
    email: 'admin@elbuensabor.com',
    role: 'restaurant',
    restaurantId: 'rest_001',
    restaurantName: 'Restaurante El Buen Sabor',
    restaurantType: 'Familiar',
    airtableBaseId: 'appElBuenSabor123',
    airtableUrl: 'https://airtable.com/embed/appElBuenSabor123/tblReservas?backgroundColor=orange&view=viwReservasHoy',
    retellConfig: {
      agentId: 'agent_elbuensabor_001',
      apiKey: 'retell_key_elbuensabor_123',
      voiceId: 'voice_familiar_spanish',
      language: 'es-ES'
    },
    twilioConfig: {
      accountSid: 'AC_elbuensabor_123',
      authToken: 'auth_elbuensabor_456',
      phoneNumber: '+1234567890',
      whatsappNumber: '+1234567890'
    }
  },
  {
    username: 'laparrilla',
    email: 'chef@laparrilla.com',
    role: 'restaurant',
    restaurantId: 'rest_002',
    restaurantName: 'La Parrilla del Chef',
    restaurantType: 'Gourmet',
    airtableBaseId: 'appLaParrilla456',
    airtableUrl: 'https://airtable.com/embed/appLaParrilla456/tblReservas?backgroundColor=orange&view=viwReservasHoy',
    retellConfig: {
      agentId: 'agent_laparrilla_002',
      apiKey: 'retell_key_laparrilla_456',
      voiceId: 'voice_gourmet_spanish',
      language: 'es-ES'
    },
    twilioConfig: {
      accountSid: 'AC_laparrilla_456',
      authToken: 'auth_laparrilla_789',
      phoneNumber: '+1234567891',
      whatsappNumber: '+1234567891'
    }
  },
  {
    username: 'lagaviota',
    email: 'admin@lagaviota.com',
    role: 'restaurant',
    restaurantId: 'rest_003',
    restaurantName: 'La Gaviota',
    restaurantType: 'Marisquería',
    airtableBaseId: 'appLaGaviota789',
    airtableUrl: 'https://airtable.com/embed/appLaGaviota789/tblReservas?backgroundColor=blue&view=viwReservasHoy',
    retellConfig: {
      agentId: 'agent_2082fc7a622cdbd22441b22060',
      apiKey: 'retell_key_lagaviota_789',
      voiceId: 'es-ES-ElviraNeural',
      language: 'es-ES'
    },
    twilioConfig: {
      accountSid: 'AC_lagaviota_789',
      authToken: 'auth_lagaviota_012',
      phoneNumber: '+1234567892',
      whatsappNumber: '+1234567892'
    }
  }
];

export function getUserByUsername(username: string): UserMapping | undefined {
  return userMappings.find(user => user.username === username);
}

export function getUserByEmail(email: string): UserMapping | undefined {
  return userMappings.find(user => user.email === email);
}

export function addUserMapping(mapping: Omit<UserMapping, 'username'>): string {
  // Generar username único basado en el nombre del restaurante
  const username = mapping.restaurantName
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20) || 'user' + Date.now();
  
  const newMapping: UserMapping = {
    username,
    ...mapping
  };
  
  userMappings.push(newMapping);
  return username;
}

export function addUserMappingWithUsername(mapping: UserMapping): void {
  // Verificar si el username ya existe
  const existingUser = getUserByUsername(mapping.username);
  if (existingUser) {
    throw new Error('El nombre de usuario ya existe');
  }
  
  // Verificar si el email ya existe
  const existingEmail = getUserByEmail(mapping.email);
  if (existingEmail) {
    throw new Error('El email ya está registrado');
  }
  
  userMappings.push(mapping);
}

export function getAllUsers(): UserMapping[] {
  return userMappings;
}
