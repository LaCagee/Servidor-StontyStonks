// ============================================
// CONTROLADOR DE USUARIO (GESTIÓN BÁSICA)
// ============================================
const { User } = require('../models');

// ==================== OBTENER PERFIL ====================
async function getProfile(req, res) {
  try {
    const userId = req.userId;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
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

// ==================== ACTUALIZAR NOMBRE ====================
async function updateProfile(req, res) {
  try {
    const userId = req.userId;
    const { name } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // Actualizar nombre
    user.name = name;
    await user.save();

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      error: 'Error al actualizar perfil',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// ==================== CAMBIAR EMAIL ====================
async function updateEmail(req, res) {
  try {
    const userId = req.userId;
    const { newEmail, password } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Contraseña incorrecta'
      });
    }

    // Verificar que el nuevo email no esté en uso
    const emailExists = await User.findOne({ 
      where: { email: newEmail } 
    });

    if (emailExists) {
      return res.status(409).json({
        error: 'El email ya está en uso'
      });
    }

    // Actualizar email y marcar como no verificado
    user.email = newEmail;
    user.emailVerified = false;
    user.verifiedAt = null;
    await user.save();

    // TODO: Enviar email de verificación al nuevo correo
    // (puedes reutilizar la lógica de verificationEmail)

    res.json({
      message: 'Email actualizado exitosamente. Por favor, verifica tu nuevo correo.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Error al actualizar email:', error);
    res.status(500).json({
      error: 'Error al actualizar email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// ==================== CAMBIAR CONTRASEÑA ====================
async function updatePassword(req, res) {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Contraseña actual incorrecta'
      });
    }

    // Verificar que la nueva contraseña sea diferente
    const isSamePassword = await user.comparePassword(newPassword);

    if (isSamePassword) {
      return res.status(400).json({
        error: 'La nueva contraseña debe ser diferente a la actual'
      });
    }

    // Actualizar contraseña (el hook beforeUpdate la hashea automáticamente)
    user.password = newPassword;
    await user.save();

    // Opcional: Enviar email de confirmación
    const { passwordChangedEmail } = require('../utils/emailTemplates');
    const transporter = require('../config/email');
    
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
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar contraseña:', error);
    res.status(500).json({
      error: 'Error al actualizar contraseña',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// ==================== EXPORTAR ====================
module.exports = {
  getProfile,
  updateProfile,
  updateEmail,
  updatePassword
};