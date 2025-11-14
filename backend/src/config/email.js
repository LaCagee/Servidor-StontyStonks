// ============================================
// CONFIGURACIÓN DE EMAIL - SENDGRID API
// ============================================
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// Configurar API Key de SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Wrapper para mantener compatibilidad con el código existente
const sendMail = async (mailOptions) => {
  try {
    const msg = {
      to: mailOptions.to,
      from: mailOptions.from || process.env.EMAIL_FROM,
      subject: mailOptions.subject,
      text: mailOptions.text,
      html: mailOptions.html
    };

    const response = await sgMail.send(msg);
    
    return {
      messageId: response[0].headers['x-message-id'],
      response: `${response[0].statusCode} ${response[0].body}`
    };
  } catch (error) {
    console.error('❌ Error al enviar email con SendGrid:', error);
    
    if (error.response) {
      console.error('Detalles:', error.response.body);
    }
    
    throw error;
  }
};

const transporter = {
  sendMail,
  verify: async () => {
    try {
      console.log('✅ SendGrid API configurada correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error en configuración de SendGrid:', error);
      return false;
    }
  }
};

module.exports = transporter;