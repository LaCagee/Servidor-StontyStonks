// ============================================
// CONTROLADOR DE AUTENTICACIÓN
// ============================================
const { User, Token } = require('../models');
const { generateAccessToken, generateResetToken, getTokenExpirationDate } = require('../utils/tokenGenerator');
const { welcomeEmail, resetPasswordEmail, passwordChangedEmail } = require('../utils/emailTemplates');
const transporter = require('../config/email');

// ==================== REGISTRO DE USUARIO ====================
async function register(req, res) {
  try {
    const { email, name, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(409).json({
        error: 'El email ya está registrado'
      });
    }

    // Crear usuario (el hook beforeCreate hashea la contraseña automáticamente)
    const user = await User.create({
      email,
      name: name || null,
      password,
      emailVerified: false  // ← Usuario NO verificado al registrarse
    });

    // Generar token de verificación
    const verificationToken = generateResetToken(); // Reutilizamos la función
    const expiresAt = getTokenExpirationDate(24); // Expira en 24 horas
      console.log("===========================TOKEN DE VERIFICACIÓN===================================");
      console.log(`Token de verificación para ${user.email}: ` + verificationToken); // borrar en producción, simplemente se uso para usar el token en postman para pruebas
      console.log("=================================================================================");
    // Guardar token en base de datos
    await Token.create({
      token: verificationToken,
      userId: user.id,
      expiresAt
    });

    // Enviar email de verificación
    const { verificationEmail } = require('../utils/emailTemplates');
    const emailContent = verificationEmail(user.name || user.email, verificationToken);

    transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html
    }).catch(err => {
      console.error('Error al enviar email de verificación:', err);
      // No bloqueamos el registro si falla el email
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
// ==================== VERIFICAR EMAIL ====================
async function verifyEmail(req, res) {
  try {
    const { token: verificationToken } = req.body;

    // Buscar token en base de datos
    const tokenRecord = await Token.findOne({
      where: { token: verificationToken },
      include: [{
        model: User,
        as: 'user'
      }]
    });

    // Verificar que el token existe
    if (!tokenRecord) {
      return res.status(400).json({
        error: 'Token de verificación inválido o expirado'
      });
    }

    // Verificar que el token no esté expirado
    if (tokenRecord.isExpired()) {
      return res.status(400).json({
        error: 'El token de verificación ha expirado. Solicita uno nuevo.'
      });
    }

    // Verificar que el token no esté revocado
    if (tokenRecord.isRevoked()) {
      return res.status(400).json({
        error: 'Token ya utilizado'
      });
    }

    const user = tokenRecord.user;

    // Verificar si el usuario ya está verificado
    if (user.emailVerified) {
      return res.status(400).json({
        error: 'El correo ya ha sido verificado previamente'
      });
    }

    // Marcar usuario como verificado
    await user.verifyEmail(); // Método del modelo User

    // Revocar el token de verificación
    await tokenRecord.revoke();

    // Enviar email de bienvenida ahora que está verificado
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

// ==================== REENVIAR EMAIL DE VERIFICACIÓN ====================
async function resendVerification(req, res) {
  try {
    const { email } = req.body;

    // Buscar usuario
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Por seguridad, no revelamos si el email existe
      return res.json({
        message: 'Si el correo está registrado, recibirás un nuevo email de verificación'
      });
    }

    // Verificar si ya está verificado
    if (user.emailVerified) {
      return res.status(400).json({
        error: 'Este correo ya ha sido verificado'
      });
    }

    // Revocar tokens de verificación anteriores del usuario
    await Token.destroy({
      where: {
        userId: user.id,
        revokedAt: null
      }
    });

    // Generar nuevo token de verificación
    const verificationToken = generateResetToken();
    const expiresAt = getTokenExpirationDate(24);

    // Guardar nuevo token
    await Token.create({
      token: verificationToken,
      userId: user.id,
      expiresAt
    });

    // Enviar email de verificación
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
// ==================== INICIO DE SESIÓN ====================
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Buscar usuario por email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña (método del modelo User)
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const accessToken = generateAccessToken(user.id);

    // Calcular fecha de expiración
    const expiresAt = getTokenExpirationDate(24); // 24 horas

    // Guardar token en base de datos
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

// ==================== CERRAR SESIÓN ====================
async function logout(req, res) {
  try {
    // El token viene del middleware authMiddleware (req.token)
    const tokenString = req.token;

    if (!tokenString) {
      return res.status(400).json({
        error: 'No se proporcionó token'
      });
    }

    // Buscar y revocar el token
    const token = await Token.findOne({ where: { token: tokenString } });

    if (token) {
      await token.revoke(); // Método del modelo Token
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

// ==================== OBTENER PERFIL ====================
async function getProfile(req, res) {
  try {
    // El userId viene del middleware authMiddleware (req.userId)
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password'] } // No devolver contraseña
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

// ==================== SOLICITAR RECUPERACIÓN DE CONTRASEÑA ====================
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    // Buscar usuario
    const user = await User.findOne({ where: { email } });

    // Por seguridad, siempre devolvemos el mismo mensaje (aunque el usuario no exista)
    if (!user) {
      return res.json({
        message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña'
      });
    }

    // Generar token de recuperación
    const resetToken = generateResetToken();
    const expiresAt = getTokenExpirationDate(1); // Expira en 1 hora

    // Guardar token en base de datos
    await Token.create({
      token: resetToken,
      userId: user.id,
      expiresAt
    });

    // Enviar email con el token
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

// ==================== VERIFICAR TOKEN DE RESET ====================
async function verifyResetToken(req, res) {
  try {
    const { token: resetToken } = req.body;

    // Buscar token en base de datos
    const tokenRecord = await Token.findOne({
      where: { token: resetToken },
      include: [{
        model: User,
        as: 'user'
      }]
    });

    // Verificar que el token existe
    if (!tokenRecord) {
      return res.status(400).json({
        error: 'Token inválido o expirado'
      });
    }

    // Verificar que el token no esté expirado
    if (tokenRecord.isExpired()) {
      return res.status(400).json({
        error: 'Token expirado'
      });
    }

    // Verificar que el token no esté revocado
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

// ==================== RESTABLECER CONTRASEÑA ====================
async function resetPassword(req, res) {
  try {
    const { token: resetToken, password } = req.body;

    // Buscar token en base de datos
    const tokenRecord = await Token.findOne({
      where: { token: resetToken },
      include: [{
        model: User,
        as: 'user'
      }]
    });

    // Verificar que el token existe
    if (!tokenRecord) {
      return res.status(400).json({
        error: 'Token inválido o expirado'
      });
    }

    // Verificar que el token no esté expirado
    if (tokenRecord.isExpired()) {
      return res.status(400).json({
        error: 'Token expirado'
      });
    }

    // Verificar que el token no esté revocado
    if (tokenRecord.isRevoked()) {
      return res.status(400).json({
        error: 'Token ya utilizado'
      });
    }

    // Actualizar contraseña del usuario
    const user = tokenRecord.user;
    user.password = password; // El hook beforeUpdate hashea automáticamente
    await user.save();

    // Revocar el token de recuperación
    await tokenRecord.revoke();

    // Revocar todos los tokens de sesión del usuario (por seguridad)
    await Token.revokeAllUserTokens(user.id);

    // Enviar email de confirmación
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

// ==================== EXPORTAR ====================
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


