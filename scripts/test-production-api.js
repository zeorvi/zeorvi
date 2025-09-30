#!/usr/bin/env node

/**
 * Script para probar la API en producción
 */

const https = require('https');

async function testProductionAPI() {
  console.log('🧪 PROBANDO API EN PRODUCCIÓN (zeorvi.com)');
  console.log('==========================================\n');
  
  const productionUrl = 'https://www.zeorvi.com';
  
  // 1. Probar endpoint de restaurantes
  console.log('1. 🏪 PROBANDO ENDPOINT DE RESTAURANTES:');
  console.log('=======================================');
  
  try {
    const restaurantsResponse = await makeRequest(`${productionUrl}/api/restaurants`);
    
    if (restaurantsResponse.status === 200) {
      console.log('✅ API de restaurantes funcionando correctamente');
      const data = JSON.parse(restaurantsResponse.body);
      console.log(`📊 Restaurantes encontrados: ${data.restaurants ? data.restaurants.length : 0}`);
      
      if (data.restaurants && data.restaurants.length > 0) {
        console.log('\n📋 Restaurantes en producción:');
        data.restaurants.forEach((restaurant, index) => {
          console.log(`   ${index + 1}. ${restaurant.name} (${restaurant.status})`);
        });
      }
    } else if (restaurantsResponse.status === 401) {
      console.log('⚠️  API requiere autenticación (normal)');
      console.log('✅ Endpoint funcionando, solo necesita login');
    } else if (restaurantsResponse.status === 500) {
      console.log('❌ ERROR 500: Problema en el servidor');
      console.log('💡 Posibles causas:');
      console.log('   - Variables de entorno no configuradas en producción');
      console.log('   - Base de datos no accesible');
      console.log('   - Error en el código del servidor');
    } else {
      console.log(`⚠️  Respuesta inesperada: ${restaurantsResponse.status}`);
    }
    
  } catch (error) {
    console.log('❌ Error conectando a la API:', error.message);
  }
  
  // 2. Probar endpoint de autenticación
  console.log('\n2. 🔐 PROBANDO ENDPOINT DE AUTENTICACIÓN:');
  console.log('=======================================');
  
  try {
    const authResponse = await makeRequest(`${productionUrl}/api/auth/me`);
    
    if (authResponse.status === 401) {
      console.log('✅ Endpoint de autenticación funcionando (401 = no autenticado)');
    } else if (authResponse.status === 500) {
      console.log('❌ ERROR 500 en autenticación');
    } else {
      console.log(`📊 Respuesta de autenticación: ${authResponse.status}`);
    }
    
  } catch (error) {
    console.log('❌ Error en autenticación:', error.message);
  }
  
  // 3. Probar página principal
  console.log('\n3. 🌐 PROBANDO PÁGINA PRINCIPAL:');
  console.log('===============================');
  
  try {
    const mainResponse = await makeRequest(`${productionUrl}/`);
    
    if (mainResponse.status === 200) {
      console.log('✅ Página principal cargando correctamente');
    } else {
      console.log(`⚠️  Página principal: ${mainResponse.status}`);
    }
    
  } catch (error) {
    console.log('❌ Error cargando página principal:', error.message);
  }
  
  // 4. Probar panel de admin
  console.log('\n4. 👨‍💼 PROBANDO PANEL DE ADMIN:');
  console.log('============================');
  
  try {
    const adminResponse = await makeRequest(`${productionUrl}/admin`);
    
    if (adminResponse.status === 200) {
      console.log('✅ Panel de admin accesible');
    } else if (adminResponse.status === 302 || adminResponse.status === 301) {
      console.log('✅ Panel de admin redirigiendo (probablemente a login)');
    } else {
      console.log(`⚠️  Panel de admin: ${adminResponse.status}`);
    }
    
  } catch (error) {
    console.log('❌ Error accediendo al panel de admin:', error.message);
  }
  
  // 5. Resumen y recomendaciones
  console.log('\n📋 RESUMEN Y RECOMENDACIONES:');
  console.log('=============================');
  
  console.log('\n🎯 PRÓXIMOS PASOS:');
  console.log('1. Si hay error 500: Configurar variables de entorno en producción');
  console.log('2. Si funciona: Probar login y dashboard');
  console.log('3. Verificar que los restaurantes aparezcan en el panel admin');
  
  console.log('\n🔧 CONFIGURACIÓN NECESARIA EN PRODUCCIÓN:');
  console.log('DATABASE_URL=postgresql://postgres.rjalwnbkknjqdxzwatrw:asturias-1999-asturias@aws-1-eu-west-2.pooler.supabase.com:6543/postgres');
  console.log('RETELL_API_KEY=key_af2cbf1b9fb5a43ebc84bc56b27b');
  console.log('JWT_SECRET=your-super-secret-jwt-key-change-in-production');
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Production-Test-Script/1.0'
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

testProductionAPI().catch(console.error);
