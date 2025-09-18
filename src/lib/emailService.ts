// Servicio de envío de emails
// En producción esto se conectaría con Gmail API o SendGrid

export interface EmailCredentials {
  restaurantName: string;
  username: string;
  email: string;
  password: string;
  loginUrl: string;
}

export async function sendCredentialsEmail(credentials: EmailCredentials): Promise<void> {
  // Simular envío de email (en producción usarías Gmail API, SendGrid, etc.)
  
  const emailContent = `
Bienvenido a Restaurante IA Plataforma

Hola ${credentials.restaurantName},

Tu cuenta ha sido creada exitosamente. Aquí están tus credenciales de acceso:

👤 Usuario: ${credentials.username}
📧 Email: ${credentials.email}
🔑 Contraseña: ${credentials.password}

🌐 Accede a: ${credentials.loginUrl}

⚠️ IMPORTANTE:
- Esta es una contraseña temporal
- Debes cambiarla en tu primer login
- Guarda estas credenciales en un lugar seguro

¿Necesitas ayuda? Contacta al administrador.

¡Bienvenido a la plataforma!
  `;

  // Simular envío exitoso
  console.log('📧 ===========================================');
  console.log('📧 EMAIL ENVIADO EXITOSAMENTE');
  console.log('📧 ===========================================');
  console.log(`📧 Para: ${credentials.email}`);
  console.log(`📧 Asunto: Bienvenido a Restaurante IA Plataforma`);
  console.log('📧 ===========================================');
  console.log(emailContent);
  console.log('📧 ===========================================');
  
  // Simular delay de envío
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return Promise.resolve();
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  console.log('📧 Email de recuperación enviado a:', email);
  return Promise.resolve();
}
