// Tipos de datos para la plataforma de restaurantes

export interface Restaurant {
  id: string;
  name: string;
  type: 'restaurante' | 'cafeteria' | 'bar' | 'comida_rapida' | 'fine_dining';
  address: string;
  phone: string;
  email: string;
  website?: string;
  
  // Configuración operativa
  operatingHours: {
    [key: string]: { // 'monday', 'tuesday', etc.
      open: string; // "09:00"
      close: string; // "22:00"
      closed: boolean;
    };
  };
  
  // Configuración de la IA
  aiAgent: {
    retellAgentId: string;
    phoneNumber: string;
    voiceSettings: {
      voice: string;
      speed: number;
      pitch: number;
    };
    language: 'es' | 'en' | 'fr' | 'it';
    personality: string;
    customInstructions: string[];
  };
  
  // Configuración del menú
  menu: {
    categories: MenuCategory[];
    specialOffers: SpecialOffer[];
  };
  
  // Configuración de mesas
  tables: Table[];
  
  // Configuración de empleados
  staff: Employee[];
  
  // Configuración de inventario
  inventory: InventoryItem[];
  
  // Configuración de notificaciones
  notifications: {
    whatsapp: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
    slackWebhook?: string;
    emailRecipients: string[];
  };
  
  // Métricas y configuración
  settings: {
    timezone: string;
    currency: string;
    taxRate: number;
    serviceCharge: number;
    reservationPolicy: string;
    cancellationPolicy: string;
    maxAdvanceBookingDays: number;
    minAdvanceBookingHours: number;
  };
  
  // Metadatos
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  items: MenuItem[];
  displayOrder: number;
  active: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  allergens: string[];
  dietary: ('vegetarian' | 'vegan' | 'gluten_free' | 'dairy_free')[];
  available: boolean;
  preparationTime: number; // minutos
  ingredients: string[];
  image?: string;
}

export interface SpecialOffer {
  id: string;
  name: string;
  description: string;
  type: 'discount' | 'combo' | 'happy_hour' | 'seasonal';
  discount: number; // porcentaje o cantidad fija
  validFrom: string;
  validTo: string;
  conditions: string[];
  active: boolean;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  location: string;
  status: 'libre' | 'ocupada' | 'reservada' | 'mantenimiento';
  position: {
    x: number;
    y: number;
  };
  features: string[]; // 'window_view', 'private', 'accessible', etc.
  currentReservation?: {
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    partySize: number;
    arrivalTime: string;
    specialRequests?: string;
    estimatedDuration: number;
  };
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'manager' | 'waiter' | 'chef' | 'host' | 'cleaner' | 'other';
  status: 'active' | 'inactive' | 'vacation' | 'sick_leave';
  schedule: {
    [key: string]: { // 'monday', 'tuesday', etc.
      start?: string; // "09:00"
      end?: string; // "17:00"
      break?: string; // "13:00-14:00"
      off: boolean;
    };
  };
  salary: {
    type: 'hourly' | 'monthly' | 'commission';
    amount: number;
    currency: string;
  };
  performance: {
    rating: number;
    reviews: string[];
    attendance: number; // porcentaje
  };
  hiredDate: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'ingredients' | 'beverages' | 'supplies' | 'cleaning' | 'other';
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string; // 'kg', 'liters', 'pieces', etc.
  costPerUnit: number;
  supplier: string;
  supplierContact?: string;
  expirationDate?: string;
  location: string; // 'fridge', 'pantry', 'freezer', etc.
  lastRestocked: string;
  autoReorder: boolean;
  reorderPoint: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
}

export interface Reservation {
  id: string;
  restaurantId: string;
  clientInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  partySize: number;
  dateTime: string;
  duration: number; // minutos
  tableId?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no_show';
  specialRequests?: string;
  source: 'phone' | 'website' | 'walk_in' | 'ai_agent' | 'third_party';
  createdAt: string;
  updatedAt: string;
  notes?: string;
  reminders: {
    sent: boolean;
    sentAt?: string;
    type: 'sms' | 'email' | 'whatsapp';
  }[];
}

export interface Client {
  id: string;
  restaurantId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  birthday?: string;
  preferences: {
    dietary: string[];
    allergies: string[];
    favoriteTable?: string;
    preferredTime?: string;
    notes: string;
  };
  visitHistory: {
    date: string;
    partySize: number;
    totalSpent: number;
    tableId: string;
    rating?: number;
    feedback?: string;
  }[];
  loyalty: {
    points: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    totalSpent: number;
    totalVisits: number;
  };
  marketing: {
    allowSMS: boolean;
    allowEmail: boolean;
    allowWhatsApp: boolean;
    segments: string[];
  };
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'blocked';
}

export interface Call {
  id: string;
  restaurantId: string;
  retellCallId: string;
  direction: 'inbound' | 'outbound';
  fromNumber: string;
  toNumber: string;
  status: 'completed' | 'failed' | 'busy' | 'no_answer' | 'in_progress';
  duration: number; // segundos
  startTime: string;
  endTime?: string;
  purpose: 'reservation' | 'inquiry' | 'complaint' | 'order' | 'cancellation' | 'other';
  outcome: 'successful' | 'failed' | 'follow_up_required' | 'escalated';
  transcript?: string;
  summary?: string;
  actionItems: string[];
  clientId?: string;
  reservationId?: string;
  orderId?: string;
  rating?: number; // 1-5
  cost: number;
  createdAt: string;
  tags: string[];
}

export interface Order {
  id: string;
  restaurantId: string;
  clientId?: string;
  tableId?: string;
  type: 'dine_in' | 'takeout' | 'delivery';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  discount: number;
  total: number;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'partial';
  paymentMethod?: 'cash' | 'card' | 'digital_wallet' | 'transfer';
  specialInstructions?: string;
  estimatedTime: number; // minutos
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  source: 'pos' | 'phone' | 'website' | 'ai_agent' | 'app';
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  modifications: string[];
  notes?: string;
}

export interface Incident {
  id: string;
  restaurantId: string;
  type: 'complaint' | 'maintenance' | 'inventory' | 'staff' | 'system' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  title: string;
  description: string;
  reportedBy: string; // employee ID or 'ai_agent'
  assignedTo?: string; // employee ID
  clientId?: string;
  orderId?: string;
  tableId?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  dueDate?: string;
  tags: string[];
  attachments: string[]; // URLs de archivos
}

export interface AIInsight {
  id: string;
  restaurantId: string;
  type: 'sales_pattern' | 'customer_behavior' | 'operational_efficiency' | 'staff_performance' | 'inventory_optimization' | 'marketing_opportunity';
  title: string;
  description: string;
  data: any; // JSON con datos específicos del insight
  recommendations: string[];
  priority: 'low' | 'medium' | 'high';
  confidence: number; // 0-100
  dateRange: {
    from: string;
    to: string;
  };
  status: 'new' | 'reviewed' | 'implemented' | 'dismissed';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  impact?: {
    metric: string;
    expectedChange: number;
    actualChange?: number;
  };
}

export interface Report {
  id: string;
  restaurantId: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  period: {
    from: string;
    to: string;
  };
  metrics: {
    sales: {
      total: number;
      orders: number;
      averageOrderValue: number;
      topItems: { name: string; quantity: number; revenue: number }[];
    };
    operations: {
      callsReceived: number;
      callsAnswered: number;
      reservations: number;
      cancellations: number;
      noShows: number;
      tableOccupancy: number; // porcentaje
    };
    customers: {
      newClients: number;
      returningClients: number;
      averageRating: number;
      complaints: number;
      compliments: number;
    };
    staff: {
      hoursWorked: number;
      attendance: number; // porcentaje
      productivity: number;
    };
    inventory: {
      itemsLowStock: number;
      itemsOutOfStock: number;
      wasteAmount: number;
      costOfGoods: number;
    };
  };
  insights: string[];
  recommendations: string[];
  generatedAt: string;
  generatedBy: 'ai_agent' | 'system' | 'manual';
  status: 'draft' | 'final' | 'sent';
}

// Tipos para el dashboard en tiempo real
export interface DashboardMetrics {
  realTime: {
    currentOccupancy: number;
    activeReservations: number;
    waitingList: number;
    averageWaitTime: number;
    staffOnDuty: number;
    currentOrders: number;
    kitchenBacklog: number;
  };
  today: {
    revenue: number;
    orders: number;
    customers: number;
    averageOrderValue: number;
    tableOccupancy: number;
    callsReceived: number;
    callsAnswered: number;
    reservations: number;
  };
  alerts: {
    id: string;
    type: 'inventory' | 'staff' | 'system' | 'customer' | 'maintenance';
    priority: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
    acknowledged: boolean;
  }[];
}

// Tipos para configuración de la plataforma
export interface PlatformConfig {
  features: {
    aiAgent: boolean;
    inventoryManagement: boolean;
    staffManagement: boolean;
    loyaltyProgram: boolean;
    onlineOrdering: boolean;
    deliveryIntegration: boolean;
    posIntegration: boolean;
    accountingIntegration: boolean;
  };
  integrations: {
    retell: {
      apiKey: string;
      webhookUrl: string;
    };
    whatsapp: {
      apiKey?: string;
      phoneNumber?: string;
    };
    stripe: {
      publicKey?: string;
      secretKey?: string;
    };
    deliveryPartners: {
      ubereats?: { apiKey: string };
      rappi?: { apiKey: string };
      deliveroo?: { apiKey: string };
    };
  };
  limits: {
    maxRestaurants: number;
    maxEmployeesPerRestaurant: number;
    maxTablesPerRestaurant: number;
    maxCallsPerMonth: number;
    storageLimit: number; // MB
  };
}
