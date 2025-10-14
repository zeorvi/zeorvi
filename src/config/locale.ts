// Configuración de idioma y codificación UTF-8
export const localeConfig = {
  // Idioma principal
  defaultLocale: 'es-ES',
  
  // Configuración UTF-8
  charset: 'utf-8',
  
  // Configuración de fechas en español
  dateConfig: {
    locale: 'es-ES',
    timeZone: 'Europe/Madrid',
    format: {
      short: 'dd/MM/yyyy',
      long: 'dd \'de\' MMMM \'de\' yyyy',
      time: 'HH:mm',
      datetime: 'dd/MM/yyyy HH:mm'
    }
  },
  
  // Configuración de números
  numberConfig: {
    locale: 'es-ES',
    currency: 'EUR',
    format: {
      currency: '€',
      decimal: ',',
      thousands: '.'
    }
  },
  
  // Configuración de mensajes
  messages: {
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    save: 'Guardar',
    edit: 'Editar',
    delete: 'Eliminar',
    search: 'Buscar',
    filter: 'Filtrar',
    sort: 'Ordenar',
    refresh: 'Actualizar',
    close: 'Cerrar',
    open: 'Abrir',
    yes: 'Sí',
    no: 'No'
  }
};

// Función para formatear fechas en español
export const formatDate = (date: Date | string, format: 'short' | 'long' | 'time' | 'datetime' = 'short') => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return 'Fecha inválida';
  }
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: localeConfig.dateConfig.timeZone,
  };
  
  switch (format) {
    case 'short':
      options.day = '2-digit';
      options.month = '2-digit';
      options.year = 'numeric';
      break;
    case 'long':
      options.day = '2-digit';
      options.month = 'long';
      options.year = 'numeric';
      break;
    case 'time':
      options.hour = '2-digit';
      options.minute = '2-digit';
      break;
    case 'datetime':
      options.day = '2-digit';
      options.month = '2-digit';
      options.year = 'numeric';
      options.hour = '2-digit';
      options.minute = '2-digit';
      break;
  }
  
  return d.toLocaleDateString(localeConfig.dateConfig.locale, options);
};

// Función para formatear números en español
export const formatNumber = (number: number, type: 'number' | 'currency' = 'number') => {
  if (type === 'currency') {
    return new Intl.NumberFormat(localeConfig.numberConfig.locale, {
      style: 'currency',
      currency: localeConfig.numberConfig.currency
    }).format(number);
  }
  
  return new Intl.NumberFormat(localeConfig.numberConfig.locale).format(number);
};

// Función para obtener mensaje localizado
export const getMessage = (key: keyof typeof localeConfig.messages) => {
  return localeConfig.messages[key];
};
