// Sistema de internacionalización para la plataforma

export type Language = 'es' | 'en' | 'fr' | 'it';

export interface Translations {
  // Navegación y menús
  nav: {
    dashboard: string;
    agenda: string;
    reservations: string;
    tables: string;
    customers: string;
    inventory: string;
    staff: string;
    settings: string;
    aiManager: string;
    chat: string;
    notifications: string;
    logout: string;
  };

  // Dashboard y métricas
  dashboard: {
    title: string;
    subtitle: string;
    realTime: string;
    todaySummary: string;
    occupiedTables: string;
    activeReservations: string;
    staffOnDuty: string;
    currentOrders: string;
    waitingList: string;
    avgWaitTime: string;
    kitchenBacklog: string;
    todayRevenue: string;
    completedOrders: string;
    avgOccupancy: string;
    aiCalls: string;
    alerts: string;
    quickActions: string;
    callClient: string;
    newReservation: string;
    releaseTable: string;
    viewReports: string;
  };

  // Reservas
  reservations: {
    title: string;
    newReservation: string;
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    partySize: string;
    dateTime: string;
    specialRequests: string;
    tablePreference: string;
    status: string;
    confirmed: string;
    pending: string;
    cancelled: string;
    completed: string;
    noShow: string;
    save: string;
    cancel: string;
    edit: string;
    delete: string;
  };

  // Inventario
  inventory: {
    title: string;
    addProduct: string;
    productName: string;
    category: string;
    currentStock: string;
    minStock: string;
    maxStock: string;
    unit: string;
    unitCost: string;
    supplier: string;
    location: string;
    expirationDate: string;
    status: string;
    inStock: string;
    lowStock: string;
    outOfStock: string;
    expired: string;
    reorder: string;
    alerts: string;
    criticalStock: string;
  };

  // Personal
  staff: {
    title: string;
    addEmployee: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    active: string;
    inactive: string;
    vacation: string;
    sickLeave: string;
    schedule: string;
    salary: string;
    performance: string;
    attendance: string;
    rating: string;
    currentlyWorking: string;
    onlineNow: string;
  };

  // IA Manager
  aiManager: {
    title: string;
    subtitle: string;
    insights: string;
    reports: string;
    calls: string;
    incidents: string;
    newInsights: string;
    implement: string;
    dismiss: string;
    generateReport: string;
    configure: string;
    confidence: string;
    priority: string;
    recommendations: string;
    callPurpose: string;
    callOutcome: string;
    actionItems: string;
    incidentType: string;
    incidentPriority: string;
    resolved: string;
    inProgress: string;
  };

  // Chat y comunicación
  chat: {
    title: string;
    subtitle: string;
    channels: string;
    createChannel: string;
    online: string;
    typing: string;
    sendMessage: string;
    mentionTip: string;
    aiTip: string;
    teamOnline: string;
    notifications: string;
    soundNotifications: string;
    pushNotifications: string;
    showTyping: string;
  };

  // Notificaciones
  notifications: {
    title: string;
    subtitle: string;
    unread: string;
    urgent: string;
    today: string;
    all: string;
    markAllRead: string;
    configure: string;
    channels: string;
    email: string;
    whatsapp: string;
    sms: string;
    push: string;
    quietHours: string;
    from: string;
    to: string;
    categories: string;
  };

  // Configuración
  settings: {
    title: string;
    basicInfo: string;
    hours: string;
    menu: string;
    ai: string;
    notifications: string;
    restaurantName: string;
    establishmentType: string;
    address: string;
    phone: string;
    contactEmail: string;
    website: string;
    timezone: string;
    currency: string;
    taxRate: string;
    operatingHours: string;
    closed: string;
    opens: string;
    closes: string;
    reservationPolicy: string;
    aiPersonality: string;
    voiceSettings: string;
    language: string;
    voice: string;
    speed: string;
    pitch: string;
  };

  // Mensajes comunes
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    view: string;
    add: string;
    search: string;
    filter: string;
    loading: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    yes: string;
    no: string;
    confirm: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    refresh: string;
    export: string;
    import: string;
  };

  // Estados y etiquetas
  status: {
    active: string;
    inactive: string;
    pending: string;
    completed: string;
    cancelled: string;
    confirmed: string;
    processing: string;
    failed: string;
    success: string;
    new: string;
    updated: string;
    deleted: string;
  };

  // Roles del personal
  roles: {
    manager: string;
    waiter: string;
    chef: string;
    host: string;
    cleaner: string;
    other: string;
  };

  // Tipos de restaurante
  restaurantTypes: {
    restaurante: string;
    cafeteria: string;
    bar: string;
    comida_rapida: string;
    fine_dining: string;
  };
}

export const translations: Record<Language, Translations> = {
  es: {
    nav: {
      dashboard: 'Dashboard',
      agenda: 'Agenda',
      reservations: 'Reservas',
      tables: 'Mesas',
      customers: 'Clientes',
      inventory: 'Inventario',
      staff: 'Personal',
      settings: 'Configuración',
      aiManager: 'IA Encargado',
      chat: 'Chat',
      notifications: 'Notificaciones',
      logout: 'Cerrar Sesión'
    },
    dashboard: {
      title: 'Dashboard en Tiempo Real',
      subtitle: 'Última actualización',
      realTime: 'En Vivo',
      todaySummary: 'Resumen del Día',
      occupiedTables: 'Mesas Ocupadas',
      activeReservations: 'Reservas Activas',
      staffOnDuty: 'Personal en Turno',
      currentOrders: 'Órdenes Activas',
      waitingList: 'Lista de Espera',
      avgWaitTime: 'Tiempo Promedio Espera',
      kitchenBacklog: 'Cocina - Pendientes',
      todayRevenue: 'Ingresos Hoy',
      completedOrders: 'Órdenes Completadas',
      avgOccupancy: 'Ocupación Promedio',
      aiCalls: 'Llamadas IA',
      alerts: 'Alertas y Notificaciones',
      quickActions: 'Acciones Rápidas',
      callClient: 'Llamar Cliente',
      newReservation: 'Nueva Reserva',
      releaseTable: 'Liberar Mesa',
      viewReports: 'Ver Reportes'
    },
    reservations: {
      title: 'Gestión de Reservas',
      newReservation: 'Nueva Reserva',
      clientName: 'Nombre del Cliente',
      clientPhone: 'Teléfono',
      clientEmail: 'Email',
      partySize: 'Número de Personas',
      dateTime: 'Fecha y Hora',
      specialRequests: 'Solicitudes Especiales',
      tablePreference: 'Preferencia de Mesa',
      status: 'Estado',
      confirmed: 'Confirmada',
      pending: 'Pendiente',
      cancelled: 'Cancelada',
      completed: 'Completada',
      noShow: 'No se presentó',
      save: 'Guardar',
      cancel: 'Cancelar',
      edit: 'Editar',
      delete: 'Eliminar'
    },
    inventory: {
      title: 'Control de Inventario',
      addProduct: 'Agregar Producto',
      productName: 'Nombre del Producto',
      category: 'Categoría',
      currentStock: 'Stock Actual',
      minStock: 'Stock Mínimo',
      maxStock: 'Stock Máximo',
      unit: 'Unidad',
      unitCost: 'Costo Unitario',
      supplier: 'Proveedor',
      location: 'Ubicación',
      expirationDate: 'Fecha de Vencimiento',
      status: 'Estado',
      inStock: 'En Stock',
      lowStock: 'Stock Bajo',
      outOfStock: 'Agotado',
      expired: 'Vencido',
      reorder: 'Reabastecer',
      alerts: 'Alertas de Inventario',
      criticalStock: 'Stock Crítico'
    },
    staff: {
      title: 'Gestión de Personal',
      addEmployee: 'Agregar Empleado',
      firstName: 'Nombre',
      lastName: 'Apellido',
      email: 'Email',
      phone: 'Teléfono',
      role: 'Puesto',
      status: 'Estado',
      active: 'Activo',
      inactive: 'Inactivo',
      vacation: 'Vacaciones',
      sickLeave: 'Incapacidad',
      schedule: 'Horario',
      salary: 'Salario',
      performance: 'Rendimiento',
      attendance: 'Asistencia',
      rating: 'Calificación',
      currentlyWorking: 'Trabajando Actualmente',
      onlineNow: 'En Línea Ahora'
    },
    aiManager: {
      title: 'IA Encargado Digital',
      subtitle: 'Asistente inteligente',
      insights: 'Insights Inteligentes',
      reports: 'Reportes Automáticos',
      calls: 'Llamadas Recientes',
      incidents: 'Incidencias',
      newInsights: 'nuevos',
      implement: 'Implementar',
      dismiss: 'Descartar',
      generateReport: 'Generar Reporte',
      configure: 'Configurar IA',
      confidence: 'Confianza',
      priority: 'Prioridad',
      recommendations: 'Recomendaciones',
      callPurpose: 'Propósito',
      callOutcome: 'Resultado',
      actionItems: 'Acciones pendientes',
      incidentType: 'Tipo de Incidencia',
      incidentPriority: 'Prioridad',
      resolved: 'Resuelto',
      inProgress: 'En Proceso'
    },
    chat: {
      title: 'Chat Interno del Equipo',
      subtitle: 'Comunicación en tiempo real',
      channels: 'Canales',
      createChannel: 'Crear Canal',
      online: 'en línea',
      typing: 'escribiendo...',
      sendMessage: 'Enviar',
      mentionTip: 'Usa @nombre para mencionar a alguien',
      aiTip: 'Menciona "IA" para consultar al asistente',
      teamOnline: 'Equipo en Línea',
      notifications: 'Notificaciones',
      soundNotifications: 'Notificaciones de sonido',
      pushNotifications: 'Notificaciones push',
      showTyping: 'Mostrar cuando escribo'
    },
    notifications: {
      title: 'Centro de Notificaciones',
      subtitle: 'Mantente al día con todas las alertas',
      unread: 'Sin Leer',
      urgent: 'Urgentes',
      today: 'Hoy',
      all: 'Todas',
      markAllRead: 'Marcar Todo Leído',
      configure: 'Configurar',
      channels: 'Canales de Notificación',
      email: 'Email',
      whatsapp: 'WhatsApp',
      sms: 'SMS',
      push: 'Notificaciones Push',
      quietHours: 'Horario Silencioso',
      from: 'Desde',
      to: 'Hasta',
      categories: 'Categorías'
    },
    settings: {
      title: 'Configuración del Restaurante',
      basicInfo: 'Información Básica',
      hours: 'Horarios',
      menu: 'Menú',
      ai: 'IA Asistente',
      notifications: 'Notificaciones',
      restaurantName: 'Nombre del Restaurante',
      establishmentType: 'Tipo de Establecimiento',
      address: 'Dirección',
      phone: 'Teléfono',
      contactEmail: 'Email de Contacto',
      website: 'Sitio Web',
      timezone: 'Zona Horaria',
      currency: 'Moneda',
      taxRate: 'Tasa de Impuestos',
      operatingHours: 'Horarios de Operación',
      closed: 'Cerrado',
      opens: 'Abre',
      closes: 'Cierra',
      reservationPolicy: 'Política de Reservas',
      aiPersonality: 'Personalidad del Asistente',
      voiceSettings: 'Configuración de Voz',
      language: 'Idioma',
      voice: 'Voz',
      speed: 'Velocidad',
      pitch: 'Tono'
    },
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      view: 'Ver',
      add: 'Agregar',
      search: 'Buscar',
      filter: 'Filtrar',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      warning: 'Advertencia',
      info: 'Información',
      yes: 'Sí',
      no: 'No',
      confirm: 'Confirmar',
      close: 'Cerrar',
      back: 'Atrás',
      next: 'Siguiente',
      previous: 'Anterior',
      refresh: 'Actualizar',
      export: 'Exportar',
      import: 'Importar'
    },
    status: {
      active: 'Activo',
      inactive: 'Inactivo',
      pending: 'Pendiente',
      completed: 'Completado',
      cancelled: 'Cancelado',
      confirmed: 'Confirmado',
      processing: 'Procesando',
      failed: 'Falló',
      success: 'Exitoso',
      new: 'Nuevo',
      updated: 'Actualizado',
      deleted: 'Eliminado'
    },
    roles: {
      manager: 'Gerente',
      waiter: 'Mesero',
      chef: 'Chef',
      host: 'Anfitrión',
      cleaner: 'Limpieza',
      other: 'Otro'
    },
    restaurantTypes: {
      restaurante: 'Restaurante',
      cafeteria: 'Cafetería',
      bar: 'Bar',
      comida_rapida: 'Comida Rápida',
      fine_dining: 'Fine Dining'
    }
  },

  en: {
    nav: {
      dashboard: 'Dashboard',
      agenda: 'Schedule',
      reservations: 'Reservations',
      tables: 'Tables',
      customers: 'Customers',
      inventory: 'Inventory',
      staff: 'Staff',
      settings: 'Settings',
      aiManager: 'AI Manager',
      chat: 'Chat',
      notifications: 'Notifications',
      logout: 'Logout'
    },
    dashboard: {
      title: 'Real-Time Dashboard',
      subtitle: 'Last updated',
      realTime: 'Live',
      todaySummary: 'Today\'s Summary',
      occupiedTables: 'Occupied Tables',
      activeReservations: 'Active Reservations',
      staffOnDuty: 'Staff on Duty',
      currentOrders: 'Current Orders',
      waitingList: 'Waiting List',
      avgWaitTime: 'Average Wait Time',
      kitchenBacklog: 'Kitchen - Pending',
      todayRevenue: 'Today\'s Revenue',
      completedOrders: 'Completed Orders',
      avgOccupancy: 'Average Occupancy',
      aiCalls: 'AI Calls',
      alerts: 'Alerts and Notifications',
      quickActions: 'Quick Actions',
      callClient: 'Call Client',
      newReservation: 'New Reservation',
      releaseTable: 'Release Table',
      viewReports: 'View Reports'
    },
    reservations: {
      title: 'Reservation Management',
      newReservation: 'New Reservation',
      clientName: 'Client Name',
      clientPhone: 'Phone',
      clientEmail: 'Email',
      partySize: 'Party Size',
      dateTime: 'Date and Time',
      specialRequests: 'Special Requests',
      tablePreference: 'Table Preference',
      status: 'Status',
      confirmed: 'Confirmed',
      pending: 'Pending',
      cancelled: 'Cancelled',
      completed: 'Completed',
      noShow: 'No Show',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete'
    },
    inventory: {
      title: 'Inventory Control',
      addProduct: 'Add Product',
      productName: 'Product Name',
      category: 'Category',
      currentStock: 'Current Stock',
      minStock: 'Minimum Stock',
      maxStock: 'Maximum Stock',
      unit: 'Unit',
      unitCost: 'Unit Cost',
      supplier: 'Supplier',
      location: 'Location',
      expirationDate: 'Expiration Date',
      status: 'Status',
      inStock: 'In Stock',
      lowStock: 'Low Stock',
      outOfStock: 'Out of Stock',
      expired: 'Expired',
      reorder: 'Reorder',
      alerts: 'Inventory Alerts',
      criticalStock: 'Critical Stock'
    },
    staff: {
      title: 'Staff Management',
      addEmployee: 'Add Employee',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      role: 'Role',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      vacation: 'Vacation',
      sickLeave: 'Sick Leave',
      schedule: 'Schedule',
      salary: 'Salary',
      performance: 'Performance',
      attendance: 'Attendance',
      rating: 'Rating',
      currentlyWorking: 'Currently Working',
      onlineNow: 'Online Now'
    },
    aiManager: {
      title: 'AI Digital Manager',
      subtitle: 'Intelligent assistant',
      insights: 'Smart Insights',
      reports: 'Automated Reports',
      calls: 'Recent Calls',
      incidents: 'Incidents',
      newInsights: 'new',
      implement: 'Implement',
      dismiss: 'Dismiss',
      generateReport: 'Generate Report',
      configure: 'Configure AI',
      confidence: 'Confidence',
      priority: 'Priority',
      recommendations: 'Recommendations',
      callPurpose: 'Purpose',
      callOutcome: 'Outcome',
      actionItems: 'Action items',
      incidentType: 'Incident Type',
      incidentPriority: 'Priority',
      resolved: 'Resolved',
      inProgress: 'In Progress'
    },
    chat: {
      title: 'Internal Team Chat',
      subtitle: 'Real-time communication',
      channels: 'Channels',
      createChannel: 'Create Channel',
      online: 'online',
      typing: 'typing...',
      sendMessage: 'Send',
      mentionTip: 'Use @name to mention someone',
      aiTip: 'Mention "AI" to consult the assistant',
      teamOnline: 'Team Online',
      notifications: 'Notifications',
      soundNotifications: 'Sound notifications',
      pushNotifications: 'Push notifications',
      showTyping: 'Show when typing'
    },
    notifications: {
      title: 'Notification Center',
      subtitle: 'Stay updated with all alerts',
      unread: 'Unread',
      urgent: 'Urgent',
      today: 'Today',
      all: 'All',
      markAllRead: 'Mark All Read',
      configure: 'Configure',
      channels: 'Notification Channels',
      email: 'Email',
      whatsapp: 'WhatsApp',
      sms: 'SMS',
      push: 'Push Notifications',
      quietHours: 'Quiet Hours',
      from: 'From',
      to: 'To',
      categories: 'Categories'
    },
    settings: {
      title: 'Restaurant Settings',
      basicInfo: 'Basic Information',
      hours: 'Hours',
      menu: 'Menu',
      ai: 'AI Assistant',
      notifications: 'Notifications',
      restaurantName: 'Restaurant Name',
      establishmentType: 'Establishment Type',
      address: 'Address',
      phone: 'Phone',
      contactEmail: 'Contact Email',
      website: 'Website',
      timezone: 'Timezone',
      currency: 'Currency',
      taxRate: 'Tax Rate',
      operatingHours: 'Operating Hours',
      closed: 'Closed',
      opens: 'Opens',
      closes: 'Closes',
      reservationPolicy: 'Reservation Policy',
      aiPersonality: 'Assistant Personality',
      voiceSettings: 'Voice Settings',
      language: 'Language',
      voice: 'Voice',
      speed: 'Speed',
      pitch: 'Pitch'
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      add: 'Add',
      search: 'Search',
      filter: 'Filter',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Info',
      yes: 'Yes',
      no: 'No',
      confirm: 'Confirm',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      refresh: 'Refresh',
      export: 'Export',
      import: 'Import'
    },
    status: {
      active: 'Active',
      inactive: 'Inactive',
      pending: 'Pending',
      completed: 'Completed',
      cancelled: 'Cancelled',
      confirmed: 'Confirmed',
      processing: 'Processing',
      failed: 'Failed',
      success: 'Successful',
      new: 'New',
      updated: 'Updated',
      deleted: 'Deleted'
    },
    roles: {
      manager: 'Manager',
      waiter: 'Waiter',
      chef: 'Chef',
      host: 'Host',
      cleaner: 'Cleaner',
      other: 'Other'
    },
    restaurantTypes: {
      restaurante: 'Restaurant',
      cafeteria: 'Cafeteria',
      bar: 'Bar',
      comida_rapida: 'Fast Food',
      fine_dining: 'Fine Dining'
    }
  },

  fr: {
    nav: {
      dashboard: 'Tableau de Bord',
      agenda: 'Agenda',
      reservations: 'Réservations',
      tables: 'Tables',
      customers: 'Clients',
      inventory: 'Inventaire',
      staff: 'Personnel',
      settings: 'Paramètres',
      aiManager: 'IA Gestionnaire',
      chat: 'Chat',
      notifications: 'Notifications',
      logout: 'Déconnexion'
    },
    dashboard: {
      title: 'Tableau de Bord en Temps Réel',
      subtitle: 'Dernière mise à jour',
      realTime: 'En Direct',
      todaySummary: 'Résumé du Jour',
      occupiedTables: 'Tables Occupées',
      activeReservations: 'Réservations Actives',
      staffOnDuty: 'Personnel de Service',
      currentOrders: 'Commandes Actuelles',
      waitingList: 'Liste d\'Attente',
      avgWaitTime: 'Temps d\'Attente Moyen',
      kitchenBacklog: 'Cuisine - En Attente',
      todayRevenue: 'Revenus Aujourd\'hui',
      completedOrders: 'Commandes Terminées',
      avgOccupancy: 'Occupation Moyenne',
      aiCalls: 'Appels IA',
      alerts: 'Alertes et Notifications',
      quickActions: 'Actions Rapides',
      callClient: 'Appeler Client',
      newReservation: 'Nouvelle Réservation',
      releaseTable: 'Libérer Table',
      viewReports: 'Voir Rapports'
    },
    reservations: {
      title: 'Gestion des Réservations',
      newReservation: 'Nouvelle Réservation',
      clientName: 'Nom du Client',
      clientPhone: 'Téléphone',
      clientEmail: 'Email',
      partySize: 'Nombre de Personnes',
      dateTime: 'Date et Heure',
      specialRequests: 'Demandes Spéciales',
      tablePreference: 'Préférence de Table',
      status: 'Statut',
      confirmed: 'Confirmée',
      pending: 'En Attente',
      cancelled: 'Annulée',
      completed: 'Terminée',
      noShow: 'Absent',
      save: 'Enregistrer',
      cancel: 'Annuler',
      edit: 'Modifier',
      delete: 'Supprimer'
    },
    inventory: {
      title: 'Contrôle d\'Inventaire',
      addProduct: 'Ajouter Produit',
      productName: 'Nom du Produit',
      category: 'Catégorie',
      currentStock: 'Stock Actuel',
      minStock: 'Stock Minimum',
      maxStock: 'Stock Maximum',
      unit: 'Unité',
      unitCost: 'Coût Unitaire',
      supplier: 'Fournisseur',
      location: 'Emplacement',
      expirationDate: 'Date d\'Expiration',
      status: 'Statut',
      inStock: 'En Stock',
      lowStock: 'Stock Faible',
      outOfStock: 'Rupture de Stock',
      expired: 'Expiré',
      reorder: 'Réapprovisionner',
      alerts: 'Alertes d\'Inventaire',
      criticalStock: 'Stock Critique'
    },
    staff: {
      title: 'Gestion du Personnel',
      addEmployee: 'Ajouter Employé',
      firstName: 'Prénom',
      lastName: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      role: 'Rôle',
      status: 'Statut',
      active: 'Actif',
      inactive: 'Inactif',
      vacation: 'Vacances',
      sickLeave: 'Congé Maladie',
      schedule: 'Horaire',
      salary: 'Salaire',
      performance: 'Performance',
      attendance: 'Assiduité',
      rating: 'Note',
      currentlyWorking: 'Travaille Actuellement',
      onlineNow: 'En Ligne Maintenant'
    },
    aiManager: {
      title: 'IA Gestionnaire Digital',
      subtitle: 'Assistant intelligent',
      insights: 'Analyses Intelligentes',
      reports: 'Rapports Automatiques',
      calls: 'Appels Récents',
      incidents: 'Incidents',
      newInsights: 'nouveaux',
      implement: 'Implémenter',
      dismiss: 'Rejeter',
      generateReport: 'Générer Rapport',
      configure: 'Configurer IA',
      confidence: 'Confiance',
      priority: 'Priorité',
      recommendations: 'Recommandations',
      callPurpose: 'Objectif',
      callOutcome: 'Résultat',
      actionItems: 'Actions à faire',
      incidentType: 'Type d\'Incident',
      incidentPriority: 'Priorité',
      resolved: 'Résolu',
      inProgress: 'En Cours'
    },
    chat: {
      title: 'Chat Interne de l\'Équipe',
      subtitle: 'Communication en temps réel',
      channels: 'Canaux',
      createChannel: 'Créer Canal',
      online: 'en ligne',
      typing: 'écrit...',
      sendMessage: 'Envoyer',
      mentionTip: 'Utilisez @nom pour mentionner quelqu\'un',
      aiTip: 'Mentionnez "IA" pour consulter l\'assistant',
      teamOnline: 'Équipe en Ligne',
      notifications: 'Notifications',
      soundNotifications: 'Notifications sonores',
      pushNotifications: 'Notifications push',
      showTyping: 'Montrer quand j\'écris'
    },
    notifications: {
      title: 'Centre de Notifications',
      subtitle: 'Restez informé de toutes les alertes',
      unread: 'Non Lues',
      urgent: 'Urgentes',
      today: 'Aujourd\'hui',
      all: 'Toutes',
      markAllRead: 'Marquer Tout Lu',
      configure: 'Configurer',
      channels: 'Canaux de Notification',
      email: 'Email',
      whatsapp: 'WhatsApp',
      sms: 'SMS',
      push: 'Notifications Push',
      quietHours: 'Heures Silencieuses',
      from: 'De',
      to: 'À',
      categories: 'Catégories'
    },
    settings: {
      title: 'Paramètres du Restaurant',
      basicInfo: 'Informations de Base',
      hours: 'Horaires',
      menu: 'Menu',
      ai: 'Assistant IA',
      notifications: 'Notifications',
      restaurantName: 'Nom du Restaurant',
      establishmentType: 'Type d\'Établissement',
      address: 'Adresse',
      phone: 'Téléphone',
      contactEmail: 'Email de Contact',
      website: 'Site Web',
      timezone: 'Fuseau Horaire',
      currency: 'Devise',
      taxRate: 'Taux de Taxe',
      operatingHours: 'Heures d\'Ouverture',
      closed: 'Fermé',
      opens: 'Ouvre',
      closes: 'Ferme',
      reservationPolicy: 'Politique de Réservation',
      aiPersonality: 'Personnalité de l\'Assistant',
      voiceSettings: 'Paramètres Vocaux',
      language: 'Langue',
      voice: 'Voix',
      speed: 'Vitesse',
      pitch: 'Ton'
    },
    common: {
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      view: 'Voir',
      add: 'Ajouter',
      search: 'Rechercher',
      filter: 'Filtrer',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      warning: 'Avertissement',
      info: 'Information',
      yes: 'Oui',
      no: 'Non',
      confirm: 'Confirmer',
      close: 'Fermer',
      back: 'Retour',
      next: 'Suivant',
      previous: 'Précédent',
      refresh: 'Actualiser',
      export: 'Exporter',
      import: 'Importer'
    },
    status: {
      active: 'Actif',
      inactive: 'Inactif',
      pending: 'En Attente',
      completed: 'Terminé',
      cancelled: 'Annulé',
      confirmed: 'Confirmé',
      processing: 'En Traitement',
      failed: 'Échoué',
      success: 'Réussi',
      new: 'Nouveau',
      updated: 'Mis à Jour',
      deleted: 'Supprimé'
    },
    roles: {
      manager: 'Gestionnaire',
      waiter: 'Serveur',
      chef: 'Chef',
      host: 'Hôte',
      cleaner: 'Nettoyage',
      other: 'Autre'
    },
    restaurantTypes: {
      restaurante: 'Restaurant',
      cafeteria: 'Cafétéria',
      bar: 'Bar',
      comida_rapida: 'Restauration Rapide',
      fine_dining: 'Gastronomie'
    }
  },

  it: {
    nav: {
      dashboard: 'Dashboard',
      agenda: 'Agenda',
      reservations: 'Prenotazioni',
      tables: 'Tavoli',
      customers: 'Clienti',
      inventory: 'Inventario',
      staff: 'Staff',
      settings: 'Impostazioni',
      aiManager: 'IA Manager',
      chat: 'Chat',
      notifications: 'Notifiche',
      logout: 'Logout'
    },
    dashboard: {
      title: 'Dashboard in Tempo Reale',
      subtitle: 'Ultimo aggiornamento',
      realTime: 'Dal Vivo',
      todaySummary: 'Riepilogo di Oggi',
      occupiedTables: 'Tavoli Occupati',
      activeReservations: 'Prenotazioni Attive',
      staffOnDuty: 'Staff in Servizio',
      currentOrders: 'Ordini Attuali',
      waitingList: 'Lista d\'Attesa',
      avgWaitTime: 'Tempo di Attesa Medio',
      kitchenBacklog: 'Cucina - In Attesa',
      todayRevenue: 'Ricavi di Oggi',
      completedOrders: 'Ordini Completati',
      avgOccupancy: 'Occupazione Media',
      aiCalls: 'Chiamate IA',
      alerts: 'Avvisi e Notifiche',
      quickActions: 'Azioni Rapide',
      callClient: 'Chiama Cliente',
      newReservation: 'Nuova Prenotazione',
      releaseTable: 'Libera Tavolo',
      viewReports: 'Vedi Report'
    },
    reservations: {
      title: 'Gestione Prenotazioni',
      newReservation: 'Nuova Prenotazione',
      clientName: 'Nome Cliente',
      clientPhone: 'Telefono',
      clientEmail: 'Email',
      partySize: 'Numero di Persone',
      dateTime: 'Data e Ora',
      specialRequests: 'Richieste Speciali',
      tablePreference: 'Preferenza Tavolo',
      status: 'Stato',
      confirmed: 'Confermata',
      pending: 'In Attesa',
      cancelled: 'Cancellata',
      completed: 'Completata',
      noShow: 'Non Presentato',
      save: 'Salva',
      cancel: 'Annulla',
      edit: 'Modifica',
      delete: 'Elimina'
    },
    inventory: {
      title: 'Controllo Inventario',
      addProduct: 'Aggiungi Prodotto',
      productName: 'Nome Prodotto',
      category: 'Categoria',
      currentStock: 'Stock Attuale',
      minStock: 'Stock Minimo',
      maxStock: 'Stock Massimo',
      unit: 'Unità',
      unitCost: 'Costo Unitario',
      supplier: 'Fornitore',
      location: 'Posizione',
      expirationDate: 'Data di Scadenza',
      status: 'Stato',
      inStock: 'Disponibile',
      lowStock: 'Scorte Basse',
      outOfStock: 'Esaurito',
      expired: 'Scaduto',
      reorder: 'Riordina',
      alerts: 'Avvisi Inventario',
      criticalStock: 'Scorte Critiche'
    },
    staff: {
      title: 'Gestione Staff',
      addEmployee: 'Aggiungi Dipendente',
      firstName: 'Nome',
      lastName: 'Cognome',
      email: 'Email',
      phone: 'Telefono',
      role: 'Ruolo',
      status: 'Stato',
      active: 'Attivo',
      inactive: 'Inattivo',
      vacation: 'Vacanza',
      sickLeave: 'Malattia',
      schedule: 'Orario',
      salary: 'Stipendio',
      performance: 'Performance',
      attendance: 'Presenza',
      rating: 'Valutazione',
      currentlyWorking: 'Attualmente al Lavoro',
      onlineNow: 'Online Ora'
    },
    aiManager: {
      title: 'IA Manager Digitale',
      subtitle: 'Assistente intelligente',
      insights: 'Analisi Intelligenti',
      reports: 'Report Automatici',
      calls: 'Chiamate Recenti',
      incidents: 'Incidenti',
      newInsights: 'nuovi',
      implement: 'Implementa',
      dismiss: 'Scarta',
      generateReport: 'Genera Report',
      configure: 'Configura IA',
      confidence: 'Confidenza',
      priority: 'Priorità',
      recommendations: 'Raccomandazioni',
      callPurpose: 'Scopo',
      callOutcome: 'Risultato',
      actionItems: 'Azioni da fare',
      incidentType: 'Tipo di Incidente',
      incidentPriority: 'Priorità',
      resolved: 'Risolto',
      inProgress: 'In Corso'
    },
    chat: {
      title: 'Chat Interna del Team',
      subtitle: 'Comunicazione in tempo reale',
      channels: 'Canali',
      createChannel: 'Crea Canale',
      online: 'online',
      typing: 'sta scrivendo...',
      sendMessage: 'Invia',
      mentionTip: 'Usa @nome per menzionare qualcuno',
      aiTip: 'Menziona "IA" per consultare l\'assistente',
      teamOnline: 'Team Online',
      notifications: 'Notifiche',
      soundNotifications: 'Notifiche sonore',
      pushNotifications: 'Notifiche push',
      showTyping: 'Mostra quando scrivo'
    },
    notifications: {
      title: 'Centro Notifiche',
      subtitle: 'Rimani aggiornato con tutti gli avvisi',
      unread: 'Non Lette',
      urgent: 'Urgenti',
      today: 'Oggi',
      all: 'Tutte',
      markAllRead: 'Segna Tutte Lette',
      configure: 'Configura',
      channels: 'Canali di Notifica',
      email: 'Email',
      whatsapp: 'WhatsApp',
      sms: 'SMS',
      push: 'Notifiche Push',
      quietHours: 'Ore Silenziose',
      from: 'Da',
      to: 'A',
      categories: 'Categorie'
    },
    settings: {
      title: 'Impostazioni Ristorante',
      basicInfo: 'Informazioni Base',
      hours: 'Orari',
      menu: 'Menu',
      ai: 'Assistente IA',
      notifications: 'Notifiche',
      restaurantName: 'Nome Ristorante',
      establishmentType: 'Tipo di Locale',
      address: 'Indirizzo',
      phone: 'Telefono',
      contactEmail: 'Email di Contatto',
      website: 'Sito Web',
      timezone: 'Fuso Orario',
      currency: 'Valuta',
      taxRate: 'Aliquota Fiscale',
      operatingHours: 'Orari di Apertura',
      closed: 'Chiuso',
      opens: 'Apre',
      closes: 'Chiude',
      reservationPolicy: 'Politica Prenotazioni',
      aiPersonality: 'Personalità Assistente',
      voiceSettings: 'Impostazioni Voce',
      language: 'Lingua',
      voice: 'Voce',
      speed: 'Velocità',
      pitch: 'Tono'
    },
    common: {
      save: 'Salva',
      cancel: 'Annulla',
      delete: 'Elimina',
      edit: 'Modifica',
      view: 'Visualizza',
      add: 'Aggiungi',
      search: 'Cerca',
      filter: 'Filtra',
      loading: 'Caricamento...',
      error: 'Errore',
      success: 'Successo',
      warning: 'Avviso',
      info: 'Informazione',
      yes: 'Sì',
      no: 'No',
      confirm: 'Conferma',
      close: 'Chiudi',
      back: 'Indietro',
      next: 'Avanti',
      previous: 'Precedente',
      refresh: 'Aggiorna',
      export: 'Esporta',
      import: 'Importa'
    },
    status: {
      active: 'Attivo',
      inactive: 'Inattivo',
      pending: 'In Attesa',
      completed: 'Completato',
      cancelled: 'Cancellato',
      confirmed: 'Confermato',
      processing: 'In Elaborazione',
      failed: 'Fallito',
      success: 'Riuscito',
      new: 'Nuovo',
      updated: 'Aggiornato',
      deleted: 'Eliminato'
    },
    roles: {
      manager: 'Manager',
      waiter: 'Cameriere',
      chef: 'Chef',
      host: 'Host',
      cleaner: 'Addetto Pulizie',
      other: 'Altro'
    },
    restaurantTypes: {
      restaurante: 'Ristorante',
      cafeteria: 'Caffetteria',
      bar: 'Bar',
      comida_rapida: 'Fast Food',
      fine_dining: 'Alta Cucina'
    }
  }
};

// Hook para usar las traducciones
export const useTranslations = (language: Language = 'es') => {
  return translations[language];
};
