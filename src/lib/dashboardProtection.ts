/**
 * Sistema de Protección del Dashboard
 * Asegura que todos los restaurantes usen el dashboard estándar optimizado
 */

import { NextRequest, NextResponse } from 'next/server';

// Configuración estándar del dashboard protegido
export const STANDARD_DASHBOARD_CONFIG = {
  // Componentes permitidos (solo los optimizados)
  allowedComponents: [
    'PremiumRestaurantDashboard',
    'EnhancedTablePlan', 
    'ReservationCalendar',
    'DailyAgenda'
  ],
  
  // Configuración responsive estándar
  responsiveConfig: {
    mobile: {
      headerHeight: '44px',
      sidebarWidth: '0px', // Oculto por defecto
      padding: '8px',
      gridColumns: 2
    },
    tablet: {
      headerHeight: '44px', 
      sidebarWidth: '192px',
      padding: '12px',
      gridColumns: 3
    },
    desktop: {
      headerHeight: '64px',
      sidebarWidth: '256px', 
      padding: '24px',
      gridColumns: 4
    }
  },
  
  // Navegación estándar (sin iconos)
  standardNavigation: [
    { id: 'agenda', label: 'Agenda del Día', color: 'blue' },
    { id: 'reservations', label: 'Gestión de Reservas', color: 'violet' },
    { id: 'tables', label: 'Control de Mesas', color: 'orange' },
    { id: 'clients', label: 'Base de Clientes', color: 'red' },
    { id: 'ai_chat', label: 'Chat con IA', color: 'purple' },
    { id: 'settings', label: 'Configuración', color: 'slate' }
  ],
  
  // Espaciado estándar
  standardSpacing: {
    agenda: {
      mobile: 'pt-4',
      tablet: 'pt-6', 
      desktop: 'pt-8'
    },
    navigation: {
      mobile: 'pt-6',
      tablet: 'pt-8',
      desktop: 'pt-10'
    }
  }
};

// Validar configuración del dashboard
export function validateDashboardConfig(restaurantId: string, config: any): boolean {
  try {
    // Verificar componentes permitidos
    if (config.components) {
      const invalidComponents = config.components.filter(
        (comp: string) => !STANDARD_DASHBOARD_CONFIG.allowedComponents.includes(comp)
      );
      
      if (invalidComponents.length > 0) {
        console.warn(`❌ [Dashboard Protection] Componentes no permitidos en ${restaurantId}:`, invalidComponents);
        return false;
      }
    }
    
    // Verificar navegación estándar
    if (config.navigation) {
      const hasIcons = config.navigation.some((item: any) => item.icon);
      if (hasIcons) {
        console.warn(`❌ [Dashboard Protection] Navegación con iconos detectada en ${restaurantId}`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error(`❌ [Dashboard Protection] Error validando ${restaurantId}:`, error);
    return false;
  }
}

// Aplicar configuración estándar
export function applyStandardDashboardConfig(restaurantId: string) {
  return {
    restaurantId,
    dashboardVersion: '2.0-optimized',
    config: STANDARD_DASHBOARD_CONFIG,
    appliedAt: new Date().toISOString(),
    appliedBy: 'system-protection'
  };
}

// Middleware de protección
export function dashboardProtectionMiddleware(request: NextRequest) {
  const url = request.nextUrl;
  
  // Solo aplicar en rutas de dashboard
  if (!url.pathname.includes('/restaurant/') || !url.pathname.includes('/dashboard')) {
    return NextResponse.next();
  }
  
  const restaurantId = url.pathname.split('/')[2];
  
  if (!restaurantId) {
    return NextResponse.next();
  }
  
  // Verificar si el restaurante usa dashboard estándar
  const dashboardConfig = getDashboardConfig(restaurantId);
  
  if (!dashboardConfig || dashboardConfig.dashboardVersion !== '2.0-optimized') {
    console.log(`🔒 [Dashboard Protection] Aplicando configuración estándar a ${restaurantId}`);
    
    // Aplicar configuración estándar
    const standardConfig = applyStandardDashboardConfig(restaurantId);
    saveDashboardConfig(restaurantId, standardConfig);
    
    // Redirigir a la versión optimizada
    const redirectUrl = new URL(url);
    redirectUrl.pathname = `/restaurant/${restaurantId}/dashboard-optimized`;
    
    return NextResponse.redirect(redirectUrl);
  }
  
  return NextResponse.next();
}

// Obtener configuración del dashboard (simulado - en producción usar base de datos)
function getDashboardConfig(restaurantId: string): any {
  // En producción, esto vendría de la base de datos
  const configs: { [key: string]: any } = {
    'rest_001': { dashboardVersion: '1.0-legacy' },
    'rest_002': { dashboardVersion: '1.0-legacy' },
    'rest_003': { dashboardVersion: '2.0-optimized' }, // Ya optimizado
  };
  
  return configs[restaurantId] || null;
}

// Guardar configuración del dashboard (simulado - en producción usar base de datos)
function saveDashboardConfig(restaurantId: string, config: any): void {
  // En producción, esto se guardaría en la base de datos
  console.log(`💾 [Dashboard Protection] Guardando configuración para ${restaurantId}:`, config);
}

// Script de migración para restaurantes existentes
export function migrateRestaurantsToStandardDashboard() {
  const restaurantsToMigrate = [
    'rest_001',
    'rest_002',
    // Agregar más restaurantes según sea necesario
  ];
  
  console.log('🚀 [Dashboard Protection] Iniciando migración a dashboard estándar...');
  
  restaurantsToMigrate.forEach(restaurantId => {
    const standardConfig = applyStandardDashboardConfig(restaurantId);
    saveDashboardConfig(restaurantId, standardConfig);
    console.log(`✅ [Dashboard Protection] Migrado ${restaurantId}`);
  });
  
  console.log('🎉 [Dashboard Protection] Migración completada');
}

// Validar que un nuevo restaurante use dashboard estándar
export function validateNewRestaurant(restaurantId: string, restaurantData: any): boolean {
  console.log(`🔍 [Dashboard Protection] Validando nuevo restaurante: ${restaurantId}`);
  
  // Aplicar configuración estándar automáticamente
  const standardConfig = applyStandardDashboardConfig(restaurantId);
  saveDashboardConfig(restaurantId, standardConfig);
  
  // Validar configuración
  const isValid = validateDashboardConfig(restaurantId, standardConfig.config);
  
  if (isValid) {
    console.log(`✅ [Dashboard Protection] Nuevo restaurante ${restaurantId} configurado correctamente`);
  } else {
    console.error(`❌ [Dashboard Protection] Error configurando ${restaurantId}`);
  }
  
  return isValid;
}

// Hook para componentes que asegura configuración estándar
export function useDashboardProtection(restaurantId: string) {
  const config = getDashboardConfig(restaurantId);
  
  if (!config || config.dashboardVersion !== '2.0-optimized') {
    console.warn(`⚠️ [Dashboard Protection] ${restaurantId} no usa configuración estándar`);
    
    // Aplicar configuración estándar automáticamente
    const standardConfig = applyStandardDashboardConfig(restaurantId);
    saveDashboardConfig(restaurantId, standardConfig);
  }
  
  return STANDARD_DASHBOARD_CONFIG;
}
