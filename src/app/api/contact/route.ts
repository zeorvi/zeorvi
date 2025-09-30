import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, restaurant, phone } = body;

    // Validar que todos los campos requeridos estén presentes
    if (!name || !email || !restaurant || !phone) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Configurar el transporter de nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER, // Tu email
        pass: process.env.SMTP_PASS, // Tu contraseña de aplicación
      },
    });

    // Configurar el email
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.CONTACT_EMAIL || 'contacto@zeorvi.com', // Email donde quieres recibir los mensajes
      subject: `Nueva solicitud de demo - ${restaurant}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #06b6d4; border-bottom: 2px solid #06b6d4; padding-bottom: 10px;">
            Nueva Solicitud de Demo - ZEORVI
          </h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">Información del Cliente:</h3>
            <p><strong>Nombre:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Restaurante:</strong> ${restaurant}</p>
            <p><strong>Teléfono:</strong> ${phone}</p>
          </div>
          
          <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
            <p style="margin: 0; color: #065f46;">
              <strong>Próximos pasos:</strong> Contactar al cliente para agendar una demostración personalizada.
            </p>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
            <p>Este mensaje fue enviado desde el formulario de contacto de zeorvi.com</p>
            <p>Fecha: ${new Date().toLocaleString('es-ES')}</p>
          </div>
        </div>
      `,
      text: `
        Nueva Solicitud de Demo - ZEORVI
        
        Información del Cliente:
        - Nombre: ${name}
        - Email: ${email}
        - Restaurante: ${restaurant}
        - Teléfono: ${phone}
        
        Próximos pasos: Contactar al cliente para agendar una demostración personalizada.
        
        Este mensaje fue enviado desde el formulario de contacto de zeorvi.com
        Fecha: ${new Date().toLocaleString('es-ES')}
      `
    };

    // Enviar el email
    await transporter.sendMail(mailOptions);

    // También enviar email de confirmación al cliente
    const confirmationMailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Confirmación de solicitud de demo - ZEORVI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #06b6d4; border-bottom: 2px solid #06b6d4; padding-bottom: 10px;">
            ¡Gracias por tu interés en ZEORVI!
          </h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Hola <strong>${name}</strong>,</p>
            <p>Hemos recibido tu solicitud de demo para <strong>${restaurant}</strong>.</p>
            <p>Nuestro equipo se pondrá en contacto contigo en las próximas 24 horas para agendar una demostración personalizada.</p>
          </div>
          
          <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
            <h3 style="margin-top: 0; color: #065f46;">¿Qué puedes esperar?</h3>
            <ul style="color: #065f46;">
              <li>Demostración personalizada de 30 minutos</li>
              <li>Configuración específica para tu restaurante</li>
              <li>Respuesta a todas tus preguntas</li>
              <li>Propuesta comercial adaptada</li>
            </ul>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
            <p>Si tienes alguna pregunta urgente, puedes contactarnos directamente en:</p>
            <p><strong>Email:</strong> contacto@zeorvi.com</p>
            <p><strong>Teléfono:</strong> +34 XXX XXX XXX</p>
          </div>
        </div>
      `,
      text: `
        ¡Gracias por tu interés en ZEORVI!
        
        Hola ${name},
        
        Hemos recibido tu solicitud de demo para ${restaurant}.
        Nuestro equipo se pondrá en contacto contigo en las próximas 24 horas para agendar una demostración personalizada.
        
        ¿Qué puedes esperar?
        - Demostración personalizada de 30 minutos
        - Configuración específica para tu restaurante
        - Respuesta a todas tus preguntas
        - Propuesta comercial adaptada
        
        Si tienes alguna pregunta urgente, puedes contactarnos directamente en:
        Email: contacto@zeorvi.com
        Teléfono: +34 XXX XXX XXX
      `
    };

    await transporter.sendMail(confirmationMailOptions);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Email enviado correctamente' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
