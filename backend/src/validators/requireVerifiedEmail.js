// ============================================
// MIDDLEWARE: REQUERIR EMAIL VERIFICADO
// ============================================

async function requireVerifiedEmail(req, res, next) {
  try {
    // Este middleware debe usarse DESPUÉS de authMiddleware
    // porque necesita req.user
    
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuario no autenticado'
      });
    }
    
    if (!req.user.emailVerified) {
      return res.status(403).json({
        error: 'Debes verificar tu correo electrónico antes de realizar esta acción',
        emailVerified: false
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Error en requireVerifiedEmail:', error);
    res.status(500).json({
      error: 'Error al verificar estado de email'
    });
  }
}

module.exports = requireVerifiedEmail;