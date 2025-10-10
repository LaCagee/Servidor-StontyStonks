// ============================================
// PLANTILLAS DE EMAILS
// ============================================

// ==================== EMAIL DE verificacion y bienvenida ====================
function verificationEmail(userName, verificationToken) {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
  
  return {
    subject: 'Verifica tu correo - StonkyStonk',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4ECDC4;">¡Bienvenido a StonkyStonk! 🎉</h1>
        <p>Hola ${userName || 'Usuario'},</p>
        <p>Gracias por registrarte en StonkyStonk, tu aplicación de control financiero.</p>
        <p><strong>Para completar tu registro, por favor verifica tu correo electrónico:</strong></p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #4ECDC4; 
                    color: white; 
                    padding: 12px 30px; 
                    text-decoration: none; 
                    border-radius: 5px;
                    display: inline-block;">
            Verificar Correo
          </a>
        </div>
        <p>O copia y pega este enlace en tu navegador:</p>
        <p style="word-break: break-all; color: #666;">
          ${verificationUrl}
        </p>
        <p><strong>Este enlace expirará en 24 horas.</strong></p>
        <p>Una vez verificado, podrás:</p>
        <ul>
          <li>📊 Registrar tus ingresos y gastos</li>
          <li>🎯 Crear metas financieras</li>
          <li>💰 Establecer presupuestos mensuales</li>
          <li>📈 Generar reportes detallados</li>
        </ul>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Si no creaste esta cuenta, puedes ignorar este correo.
        </p>
      </div>
    `
  };
}

function welcomeEmail(userName) {
  return {
    subject: '¡Tu cuenta ha sido verificada! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4ECDC4;">¡Cuenta Verificada Exitosamente!</h1>
        <p>Hola ${userName || 'Usuario'},</p>
        <p>Tu correo ha sido verificado correctamente. ¡Ya puedes usar todas las funciones de StonkyStonk!</p>
        <p>Comienza ahora:</p>
        <ul>
          <li>📊 Registra tu primera transacción</li>
          <li>🎯 Crea una meta de ahorro</li>
          <li>💰 Establece tu presupuesto mensual</li>
        </ul>
        <p>¡Toma control de tus finanzas hoy!</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Este es un correo automático, por favor no respondas.
        </p>
      </div>
    `
  };
}

// ==================== EMAIL DE RECUPERACIÓN DE CONTRASEÑA ====================
function resetPasswordEmail(userName, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    return {
        subject: 'Recuperación de Contraseña - StonkyStonk',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4ECDC4;">Recuperación de Contraseña</h1>
        <p>Hola ${userName || 'Usuario'},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña en StonkyStonk.</p>
        <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #4ECDC4; 
                    color: white; 
                    padding: 12px 30px; 
                    text-decoration: none; 
                    border-radius: 5px;
                    display: inline-block;">
            Restablecer Contraseña
          </a>
        </div>
        <p>O copia y pega este enlace en tu navegador:</p>
        <p style="word-break: break-all; color: #666;">
          ${resetUrl}
        </p>
        <p><strong>Este enlace expirará en 1 hora.</strong></p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Si no solicitaste este cambio, ignora este correo y tu contraseña permanecerá sin cambios.
        </p>
      </div>
    `
    };
}

// ==================== EMAIL DE CONFIRMACIÓN DE CAMBIO DE CONTRASEÑA ====================
function passwordChangedEmail(userName) {
    return {
        subject: 'Tu contraseña ha sido cambiada - StonkyStonk',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4ECDC4;">Contraseña Actualizada</h1>
        <p>Hola ${userName || 'Usuario'},</p>
        <p>Te confirmamos que tu contraseña ha sido cambiada exitosamente.</p>
        <p>Si no realizaste este cambio, por favor contacta a soporte inmediatamente.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Este es un correo automático, por favor no respondas.
        </p>
      </div>
    `
    };
}

// ==================== EXPORTAR ====================
module.exports = {
    welcomeEmail,
    resetPasswordEmail,
    passwordChangedEmail
};
