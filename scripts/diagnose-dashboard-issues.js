#!/usr/bin/env node

/**
 * Script para diagnosticar problemas del dashboard de restaurantes
 * Funciona tanto en desarrollo como en producción
 */

const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          process.env[key] = value;
        }
      }
    });
  }
}

function diagnoseDashboardIssues() {
  console.log('🔍 Diagnóstico del Dashboard de Restaurantes\n');
  
  // 1. Verificar configuración del entorno
  console.log('1. 📊 VERIFICANDO CONFIGURACIÓN DEL ENTORNO:');
  console.log('==========================================');
  
  const nodeEnv = process.env.NODE_ENV || 'development';
  console.log(`   - NODE_ENV: ${nodeEnv}`);
  
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    console.log(`   - DATABASE_URL: ${databaseUrl.replace(/\/\/.*@/, '//***:***@')}`);
  } else {
    console.log('   - DATABASE_URL: No configurado');
  }
  
  // 2. Verificar archivos de base de datos
  console.log('\n2. 💾 VERIFICANDO ARCHIVOS DE BASE DE DATOS:');
  console.log('===========================================');
  
  const sqliteDbPath = path.join(process.cwd(), 'restaurant_dev.db');
  if (fs.existsSync(sqliteDbPath)) {
    const stats = fs.statSync(sqliteDbPath);
    console.log(`   ✅ SQLite DB encontrado: ${sqliteDbPath}`);
    console.log(`   - Tamaño: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   - Modificado: ${stats.mtime.toLocaleString()}`);
  } else {
    console.log(`   ❌ SQLite DB no encontrado: ${sqliteDbPath}`);
  }
  
  // 3. Verificar configuración de la aplicación
  console.log('\n3. ⚙️  VERIFICANDO CONFIGURACIÓN DE LA APLICACIÓN:');
  console.log('===============================================');
  
  const configPath = path.join(process.cwd(), 'src/lib/config.ts');
  if (fs.existsSync(configPath)) {
    console.log('   ✅ Archivo de configuración encontrado');
  } else {
    console.log('   ❌ Archivo de configuración no encontrado');
  }
  
  // 4. Verificar componentes del dashboard
  console.log('\n4. 🎨 VERIFICANDO COMPONENTES DEL DASHBOARD:');
  console.log('===========================================');
  
  const dashboardComponents = [
    'src/components/restaurant/EnhancedRestaurantDashboard.tsx',
    'src/components/restaurant/PremiumRestaurantDashboard.tsx',
    'src/components/restaurant/ReservationCalendar.tsx',
    'src/components/restaurant/TablePlanNew.tsx'
  ];
  
  dashboardComponents.forEach(component => {
    const componentPath = path.join(process.cwd(), component);
    if (fs.existsSync(componentPath)) {
      console.log(`   ✅ ${component}`);
    } else {
      console.log(`   ❌ ${component} - NO ENCONTRADO`);
    }
  });
  
  // 5. Verificar servicios de restaurante
  console.log('\n5. 🏪 VERIFICANDO SERVICIOS DE RESTAURANTE:');
  console.log('==========================================');
  
  const restaurantServices = [
    'src/lib/restaurantServicePostgres.ts',
    'src/lib/database/index.ts',
    'src/lib/database/sqlite.ts'
  ];
  
  restaurantServices.forEach(service => {
    const servicePath = path.join(process.cwd(), service);
    if (fs.existsSync(servicePath)) {
      console.log(`   ✅ ${service}`);
    } else {
      console.log(`   ❌ ${service} - NO ENCONTRADO`);
    }
  });
  
  // 6. Verificar hooks de autenticación
  console.log('\n6. 🔐 VERIFICANDO HOOKS DE AUTENTICACIÓN:');
  console.log('========================================');
  
  const authHooks = [
    'src/hooks/useClientAuth.ts',
    'src/lib/clientAuth.ts',
    'src/lib/auth/index.ts'
  ];
  
  authHooks.forEach(hook => {
    const hookPath = path.join(process.cwd(), hook);
    if (fs.existsSync(hookPath)) {
      console.log(`   ✅ ${hook}`);
    } else {
      console.log(`   ❌ ${hook} - NO ENCONTRADO`);
    }
  });
  
  // 7. Verificar rutas de la aplicación
  console.log('\n7. 🛣️  VERIFICANDO RUTAS DE LA APLICACIÓN:');
  console.log('========================================');
  
  const appRoutes = [
    'src/app/restaurant/[id]/page.tsx',
    'src/app/admin/page.tsx',
    'src/app/login/page.tsx'
  ];
  
  appRoutes.forEach(route => {
    const routePath = path.join(process.cwd(), route);
    if (fs.existsSync(routePath)) {
      console.log(`   ✅ ${route}`);
    } else {
      console.log(`   ❌ ${route} - NO ENCONTRADO`);
    }
  });
  
  // 8. Análisis de problemas comunes
  console.log('\n8. 🚨 ANÁLISIS DE PROBLEMAS COMUNES:');
  console.log('===================================');
  
  const issues = [];
  
  if (!fs.existsSync(sqliteDbPath)) {
    issues.push('❌ Base de datos SQLite no encontrada');
  }
  
  if (!process.env.DATABASE_URL && nodeEnv === 'production') {
    issues.push('❌ DATABASE_URL no configurado en producción');
  }
  
  if (!fs.existsSync(path.join(process.cwd(), 'src/components/restaurant/EnhancedRestaurantDashboard.tsx'))) {
    issues.push('❌ Componente EnhancedRestaurantDashboard no encontrado');
  }
  
  if (issues.length === 0) {
    console.log('   ✅ No se detectaron problemas evidentes');
  } else {
    issues.forEach(issue => console.log(`   ${issue}`));
  }
  
  // 9. Recomendaciones
  console.log('\n9. 💡 RECOMENDACIONES:');
  console.log('======================');
  
  if (nodeEnv === 'development') {
    console.log('   🏠 ENTORNO DE DESARROLLO DETECTADO:');
    console.log('   - Usa SQLite para desarrollo local');
    console.log('   - Los restaurantes deberían aparecer automáticamente');
    console.log('   - Si no aparecen, verifica que restaurant_dev.db exista');
    console.log('   - Ejecuta: npm run dev');
  } else {
    console.log('   ☁️  ENTORNO DE PRODUCCIÓN DETECTADO:');
    console.log('   - Usa PostgreSQL/Supabase');
    console.log('   - Los restaurantes deben sincronizarse manualmente');
    console.log('   - Ejecuta: node scripts/insert-production-data.js');
    console.log('   - O usa el botón "Sincronizar Restaurantes" en el panel admin');
  }
  
  console.log('\n   🔧 SOLUCIONES GENERALES:');
  console.log('   1. Verificar que el servidor esté ejecutándose');
  console.log('   2. Verificar autenticación de usuarios');
  console.log('   3. Verificar permisos de acceso a restaurantes');
  console.log('   4. Revisar logs del navegador (F12)');
  console.log('   5. Verificar logs del servidor');
  
  // 10. Comandos útiles
  console.log('\n10. 🛠️  COMANDOS ÚTILES:');
  console.log('========================');
  
  console.log('   Desarrollo:');
  console.log('   - npm run dev');
  console.log('   - node scripts/setup-database.js');
  
  console.log('\n   Producción:');
  console.log('   - node scripts/insert-production-data.js');
  console.log('   - node scripts/test-restaurant-dashboard.js');
  
  console.log('\n   Diagnóstico:');
  console.log('   - Revisar logs del navegador (F12 → Console)');
  console.log('   - Verificar Network tab en DevTools');
  console.log('   - Probar endpoints de API manualmente');
}

// Ejecutar diagnóstico
loadEnvFile();
diagnoseDashboardIssues();
