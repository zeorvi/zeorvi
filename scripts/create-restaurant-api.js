// Script para crear el restaurante rest_003 usando la API de la aplicación
const fetch = require('node-fetch');

async function createRestaurant() {
  try {
    console.log('🔍 Creando restaurante rest_003 (La Gaviota)...');
    
    // Primero necesitamos obtener un token de autenticación
    const loginResponse = await fetch('https://zeorvi-giwrefym2-zeorvis-projects.vercel.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@restaurante.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Error en login, intentando crear restaurante directamente...');
      
      // Intentar crear el restaurante directamente
      const createResponse = await fetch('https://zeorvi-giwrefym2-zeorvis-projects.vercel.app/api/restaurants/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'rest_003',
          name: 'La Gaviota',
          slug: 'la-gaviota',
          owner_email: 'info@lagaviota.com',
          owner_name: 'María García',
          phone: '+34 912 345 678',
          address: 'Paseo Marítimo, 123',
          city: 'Valencia',
          country: 'España',
          config: {
            theme: 'maritime',
            features: ['reservations', 'tables', 'menu']
          },
          plan: 'premium',
          status: 'active'
        })
      });
      
      const result = await createResponse.json();
      console.log('📊 Resultado:', result);
      
    } else {
      const loginData = await loginResponse.json();
      console.log('✅ Login exitoso, token obtenido');
      
      // Usar el token para crear el restaurante
      const createResponse = await fetch('https://zeorvi-giwrefym2-zeorvis-projects.vercel.app/api/restaurants/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.token}`
        },
        body: JSON.stringify({
          id: 'rest_003',
          name: 'La Gaviota',
          slug: 'la-gaviota',
          owner_email: 'info@lagaviota.com',
          owner_name: 'María García',
          phone: '+34 912 345 678',
          address: 'Paseo Marítimo, 123',
          city: 'Valencia',
          country: 'España',
          config: {
            theme: 'maritime',
            features: ['reservations', 'tables', 'menu']
          },
          plan: 'premium',
          status: 'active'
        })
      });
      
      const result = await createResponse.json();
      console.log('📊 Resultado:', result);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createRestaurant();
