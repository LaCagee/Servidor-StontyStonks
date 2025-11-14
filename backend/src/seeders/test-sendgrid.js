// ============================================
// SCRIPT DE PRUEBA - SENDGRID API
// ============================================
require('dotenv').config();
const transporter = require('../config/email');

async function testSendGrid() {
  try {
    console.log('🔄 Iniciando prueba de SendGrid API...\n');
    console.log('📧 Email FROM:', process.env.EMAIL_FROM);
    console.log('🔑 API Key:', process.env.SENDGRID_API_KEY ? '✓ Configurada' : '✗ NO configurada');
    console.log('');

    
    const testEmail = {
      to: 'matiaseduardocaceresrojas09@gmail.com', // Email de destino para la prueba
      subject: '✅ Prueba SendGrid API - StonkyStonk',
      text: 'Este es un email de prueba desde SendGrid API.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4ECDC4;">🎉 ¡SendGrid API Funciona!</h1>
          <p>Este email fue enviado exitosamente usando <strong>@sendgrid/mail</strong>.</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Fecha:</strong> ${new Date().toLocaleString('es-CL')}</p>
            <p style="margin: 5px 0;"><strong>Método:</strong> SendGrid REST API (no SMTP)</p>
            <p style="margin: 5px 0;"><strong>Aplicación:</strong> StonkyStonk Backend</p>
          </div>

          <p>Si recibiste este email, significa que la migración fue exitosa ✅</p>

          <hr style="border: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            Este es un email de prueba del sistema StonkyStonk.
          </p>
        </div>
      `
    };

    console.log('📨 Enviando email de prueba...');
    const info = await transporter.sendMail(testEmail);

    console.log('\n✅ ¡Email enviado exitosamente!\n');
    console.log('📧 Message ID:', info.messageId);
    console.log('📨 Respuesta:', info.response);
    console.log('\n🎉 SendGrid API está funcionando correctamente!');
    console.log('👉 Revisa tu bandeja de entrada (o spam)\n');

  } catch (error) {
    console.error('\n❌ Error al enviar email:\n');
    console.error('Mensaje:', error.message);
    
    if (error.code === 403) {
      console.error('\n⚠️  Error 403: Verifica que tu Single Sender esté verificado en SendGrid');
    }
    
    if (error.code === 401) {
      console.error('\n⚠️  Error 401: API Key inválida. Verifica:');
      console.error('1. SENDGRID_API_KEY en .env (sin espacios)');
      console.error('2. Que el API Key tenga permisos Mail Send');
    }

    console.error('\n📋 Configuración actual:');
    console.error('   FROM:', process.env.EMAIL_FROM);
    console.error('   API Key configurada:', !!process.env.SENDGRID_API_KEY);
  }
}

// Verificar configuración antes de ejecutar
if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY no está configurada en .env');
  process.exit(1);
}

if (!process.env.EMAIL_FROM) {
  console.error('❌ EMAIL_FROM no está configurada en .env');
  process.exit(1);
}

testSendGrid();