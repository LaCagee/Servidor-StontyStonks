// ============================================
// Controlador de Autenticación
// Acá va toda la lógica para registrar, loguear y gestionar usuarios
// ============================================
const { User, Token } = require('../models');
const { generateAccessToken, generateResetToken, getTokenExpirationDate } = require('../utils/tokenGenerator');
const { welcomeEmail, resetPasswordEmail, passwordChangedEmail } = require('../utils/emailTemplates');
const transporter = require('../config/email');

// ==================== Registro de Usuario ====================
// Esta función se encarga de crear un nuevo usuario en el sistema
async function register(req, res) {
  try {
    const { email, name, password } = req.body;

    // Primero chequeamos si el usuario ya existe en la base de datos
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(409).json({
        error: 'El email ya está registrado'
      });
    }

    // Creamos el usuario nuevo (el hook beforeCreate se encarga de hashear la contraseña automáticamente)
    const user = await User.create({
      email,
      name: name || null,
      password,
      emailVerified: false  // El usuario parte sin verificar su email
    });

    // Generamos un token para verificar el email
    const verificationToken = generateResetToken(); // Reutilizamos esta función que genera tokens
    const expiresAt = getTokenExpirationDate(24); // El token expira en 24 horas
      console.log("===========================TOKEN DE VERIFICACIÓN===================================");
      console.log(`Token de verificación para ${user.email}: ` + verificationToken); // TODO: borrar esto en producción, solo para debugging
      console.log("=================================================================================");
    // Guardamos el token en la base de datos
    await Token.create({
      token: verificationToken,
      userId: user.id,
      expiresAt
    });

    // Armamos y enviamos el email de verificación
    const { verificationEmail } = require('../utils/emailTemplates');
    const emailContent = verificationEmail(user.name || user.email, verificationToken);

    transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html
    }).catch(err => {
      console.error('Error al enviar email de verificación:', err);
      // Si falla el email no bloqueamos el registro igual
    });

    res.status(201).json({
      message: 'Usuario registrado exitosamente. Por favor, verifica tu correo electrónico.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      error: 'Error al registrar usuario',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
// ==================== Verificar Email ====================
// Acá validamos el token que el usuario recibió por email
async function verifyEmail(req, res) {
  try {
    const { token: verificationToken } = req.body;

    // Buscamos el token en la base de datos
    const tokenRecord = await Token.findOne({
      where: { token: verificationToken },
      include: [{
        model: User,
        as: 'user'
      }]
    });

    // Chequeamos que el token exista
    if (!tokenRecord) {
      return res.status(400).json({
        error: 'Token de verificación inválido o expirado'
      });
    }

    // Verificamos que el token no haya expirado
    if (tokenRecord.isExpired()) {
      return res.status(400).json({
        error: 'El token de verificación ha expirado. Solicita uno nuevo.'
      });
    }

    // Verificamos que el token no haya sido usado antes
    if (tokenRecord.isRevoked()) {
      return res.status(400).json({
        error: 'Token ya utilizado'
      });
    }

    const user = tokenRecord.user;

    // Chequeamos si el usuario ya estaba verificado
    if (user.emailVerified) {
      return res.status(400).json({
        error: 'El correo ya ha sido verificado previamente'
      });
    }

    // Marcamos al usuario como verificado
    await user.verifyEmail(); // Este método está en el modelo User

    // Revocamos el token para que no se pueda usar de nuevo
    await tokenRecord.revoke();

    // Enviamos el email de bienvenida porque ya verificó su cuenta
    const emailContent = welcomeEmail(user.name || user.email);
    transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html
    }).catch(err => {
      console.error('Error al enviar email de bienvenida:', err);
    });

    res.json({
      message: 'Correo verificado exitosamente. ¡Ya puedes iniciar sesión!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        verifiedAt: user.verifiedAt
      }
    });

  } catch (error) {
    console.error('Error en verify email:', error);
    res.status(500).json({
      error: 'Error al verificar correo',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// ==================== Reenviar Email de Verificación ====================
// Por si el usuario perdió el email original o expiró el token
async function resendVerification(req, res) {
  try {
    const { email } = req.body;

    // Buscamos el usuario
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Por seguridad, no le decimos al usuario si el email existe o no
      return res.json({
        message: 'Si el correo está registrado, recibirás un nuevo email de verificación'
      });
    }

    // Chequeamos si ya estaba verificado
    if (user.emailVerified) {
      return res.status(400).json({
        error: 'Este correo ya ha sido verificado'
      });
    }

    // Borramos los tokens anteriores que no se hayan usado
    await Token.destroy({
      where: {
        userId: user.id,
        revokedAt: null
      }
    });

    // Generamos un nuevo token fresco
    const verificationToken = generateResetToken();
    const expiresAt = getTokenExpirationDate(24);

    // Guardamos el nuevo token
    await Token.create({
      token: verificationToken,
      userId: user.id,
      expiresAt
    });

    // Enviamos el email de verificación de nuevo
    const { verificationEmail } = require('../utils/emailTemplates');
    const emailContent = verificationEmail(user.name || user.email, verificationToken);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html
    });

    res.json({
      message: 'Si el correo está registrado, recibirás un nuevo email de verificación'
    });

  } catch (error) {
    console.error('Error en resend verification:', error);
    res.status(500).json({
      error: 'Error al reenviar verificación',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
// ==================== Inicio de Sesión ====================
// Acá el usuario se loguea con email y contraseña
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Buscamos el usuario por su email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // Verificamos que la contraseña sea correcta (usa bcrypt para comparar)
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // Generamos el token JWT para la sesión
    const accessToken = generateAccessToken(user.id);

    // Calculamos cuándo expira el token (24 horas)
    const expiresAt = getTokenExpirationDate(24);

    // Guardamos el token en la base de datos
    await Token.create({
      token: accessToken,
      userId: user.id,
      expiresAt
    });

    res.json({
      message: 'Inicio de sesión exitoso',
      token: accessToken,
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error al iniciar sesión',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// ==================== Cerrar Sesión ====================
// Acá revocamos el token para que el usuario salga de la sesión
async function logout(req, res) {
  try {
    // El token lo sacamos del middleware authMiddleware que lo pone en req.token
    const tokenString = req.token;

    if (!tokenString) {
      return res.status(400).json({
        error: 'No se proporcionó token'
      });
    }

    // Buscamos el token y lo revocamos
    const token = await Token.findOne({ where: { token: tokenString } });

    if (token) {
      await token.revoke(); // Este método está en el modelo Token
    }

    res.json({
      message: 'Sesión cerrada exitosamente'
    });

  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      error: 'Error al cerrar sesión',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// ==================== Obtener Perfil ====================
// Devuelve los datos del usuario que está logueado
async function getProfile(req, res) {
  try {
    // El userId lo sacamos del middleware authMiddleware
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password'] } // No devolvemos la contraseña por seguridad
    });

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        verifiedAt: user.verifiedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      error: 'Error al obtener perfil',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// ==================== Solicitar Recuperación de Contraseña ====================
// El usuario olvidó su contraseña y pide un link para resetearla
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    // Buscamos al usuario
    const user = await User.findOne({ where: { email } });

    // Por seguridad, siempre respondemos lo mismo aunque el email no exista
    if (!user) {
      return res.json({
        message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña'
      });
    }

    // Generamos un token para resetear la contraseña
    const resetToken = generateResetToken();
    const expiresAt = getTokenExpirationDate(1); // Este token expira en 1 hora

    // Guardamos el token en la base de datos
    await Token.create({
      token: resetToken,
      userId: user.id,
      expiresAt
    });

    // Armamos y enviamos el email con el link de reset
    const emailContent = resetPasswordEmail(user.name || user.email, resetToken);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html
    });

    res.json({
      message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña'
    });

  } catch (error) {
    console.error('Error en forgot password:', error);
    res.status(500).json({
      error: 'Error al procesar solicitud',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// ==================== Verificar Token de Reset ====================
// Antes de mostrar el formulario, chequeamos si el token es válido
async function verifyResetToken(req, res) {
  try {
    const { token: resetToken } = req.body;

    // Buscamos el token en la base de datos
    const tokenRecord = await Token.findOne({
      where: { token: resetToken },
      include: [{
        model: User,
        as: 'user'
      }]
    });

    // Verificamos que el token exista
    if (!tokenRecord) {
      return res.status(400).json({
        error: 'Token inválido o expirado'
      });
    }

    // Chequeamos que no haya expirado
    if (tokenRecord.isExpired()) {
      return res.status(400).json({
        error: 'Token expirado'
      });
    }

    // Verificamos que no se haya usado antes
    if (tokenRecord.isRevoked()) {
      return res.status(400).json({
        error: 'Token ya utilizado'
      });
    }

    res.json({
      message: 'Token válido',
      valid: true
    });

  } catch (error) {
    console.error('Error al verificar token:', error);
    res.status(500).json({
      error: 'Error al verificar token',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// ==================== Restablecer Contraseña ====================
// Acá el usuario pone su nueva contraseña y la guardamos
async function resetPassword(req, res) {
  try {
    const { token: resetToken, password } = req.body;

    // Buscamos el token en la base de datos
    const tokenRecord = await Token.findOne({
      where: { token: resetToken },
      include: [{
        model: User,
        as: 'user'
      }]
    });

    // Verificamos que el token exista
    if (!tokenRecord) {
      return res.status(400).json({
        error: 'Token inválido o expirado'
      });
    }

    // Chequeamos que no haya expirado
    if (tokenRecord.isExpired()) {
      return res.status(400).json({
        error: 'Token expirado'
      });
    }

    // Verificamos que no se haya usado antes
    if (tokenRecord.isRevoked()) {
      return res.status(400).json({
        error: 'Token ya utilizado'
      });
    }

    // Actualizamos la contraseña del usuario
    const user = tokenRecord.user;
    user.password = password; // El hook beforeUpdate hashea la contraseña automáticamente
    await user.save();

    // Revocamos el token de recuperación para que no se pueda usar de nuevo
    await tokenRecord.revoke();

    // Por seguridad, cerramos todas las sesiones activas del usuario
    await Token.revokeAllUserTokens(user.id);

    // Enviamos un email de confirmación avisando que se cambió la contraseña
    const emailContent = passwordChangedEmail(user.name || user.email);
    transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html
    }).catch(err => {
      console.error('Error al enviar email de confirmación:', err);
    });

    res.json({
      message: 'Contraseña restablecida exitosamente. Por favor, inicia sesión con tu nueva contraseña.'
    });

  } catch (error) {
    console.error('Error en reset password:', error);
    res.status(500).json({
      error: 'Error al restablecer contraseña',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// ==================== Exportamos todas las funciones ====================
module.exports = {
  register,
  login,
  logout,
  getProfile,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  verifyEmail,
  resendVerification
};


