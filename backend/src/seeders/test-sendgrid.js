// ============================================
// SCRIPT DE PRUEBA - SENDGRID
// ============================================
require('dotenv').config();
const transporter = require('../config/email');

async function testSendGrid() {
  try {
    console.log('🔄 Iniciando prueba de SendGrid...\n');
    console.log('📧 Email FROM:', process.env.EMAIL_FROM);
    console.log('🔑 API Key:', process.env.EMAIL_PASSWORD ? '✓ Configurada' : '✗ NO configurada');
    console.log('');

    // ⚠️ CAMBIAR POR TU EMAIL REAL
    const testEmail = {
      from: process.env.EMAIL_FROM,
      to: 'matiaseduardocaceresrojas09@gmail.com', // ← CAMBIAR AQUÍ
      subject: '✅ Prueba SendGrid - StonkyStonk',
      text: 'Este es un email de prueba desde SendGrid.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4ECDC4;">🎉 ¡SendGrid Funciona!</h1>
          <p>Este email fue enviado exitosamente desde <strong>SendGrid</strong>.</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Fecha:</strong> ${new Date().toLocaleString('es-CL')}</p>
            <p style="margin: 5px 0;"><strong>Servicio:</strong> SendGrid SMTP</p>
            <p style="margin: 5px 0;"><strong>Aplicación:</strong> StonkyStonk Backend</p>
          </div>

          <p>Si recibiste este email, significa que la configuración es correcta ✅</p>

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
    console.log('\n🎉 SendGrid está funcionando correctamente!');
    console.log('👉 Revisa tu bandeja de entrada (o spam)\n');

  } catch (error) {
    console.error('\n❌ Error al enviar email:\n');
    console.error('Mensaje:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n⚠️  Error de autenticación. Verifica:');
      console.error('1. Tu SENDGRID_API_KEY en .env (sin espacios)');
      console.error('2. Que user sea literal "apikey"');
      console.error('3. Que el API Key tenga permisos Mail Send');
      console.error('4. Que el Single Sender esté verificado');
    }

    if (error.code === 'EENVELOPE') {
      console.error('\n⚠️  Error con direcciones de email. Verifica:');
      console.error('1. EMAIL_FROM coincide con Single Sender verificado');
      console.error('2. El email TO es válido');
    }

    console.error('\n📋 Configuración actual:');
    console.error('   FROM:', process.env.EMAIL_FROM);
    console.error('   API Key configurada:', !!process.env.EMAIL_PASSWORD);
  }
}

// Verificar configuración antes de ejecutar
if (!process.env.EMAIL_PASSWORD) {
  console.error('❌ EMAIL_PASSWORD no está configurada en .env');
  process.exit(1);
}

if (!process.env.EMAIL_FROM) {
  console.error('❌ EMAIL_FROM no está configurada en .env');
  process.exit(1);
}

testSendGrid();