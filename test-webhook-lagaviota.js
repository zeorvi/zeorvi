// Script para probar el webhook de La Gaviota
const https = require('https');

// Simular una llamada de Retell para La Gaviota
const webhookData = {
  call_id: "test_call_123",
  agent_id: "agent_2082fc7a622cdbd22441b22060", // ID del agente de La Gaviota
  event: "call_started",
  timestamp: new Date().toISOString(),
  call_phone_number: "+34600123456",
  data: {
    restaurant_id: "rest_003",
    restaurant_name: "La Gaviota"
  }
};

const postData = JSON.stringify(webhookData);

const options = {
  hostname: 'www.zeorvi.com',
  port: 443,
  path: '/api/retell/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🧪 Probando webhook de La Gaviota...');
console.log('📡 URL:', `https://${options.hostname}${options.path}`);
console.log('📋 Datos:', JSON.stringify(webhookData, null, 2));

const req = https.request(options, (res) => {
  console.log(`✅ Status: ${res.statusCode}`);
  console.log(`📊 Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📄 Respuesta:', data);
    if (res.statusCode === 200) {
      console.log('🎉 ¡Webhook funcionando correctamente!');
    } else {
      console.log('❌ Error en el webhook');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Error:', e.message);
});

req.write(postData);
req.end();
