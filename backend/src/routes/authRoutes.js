// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword
} = require('../validators/authValidator');

// ==================== RUTAS PÚBLICAS ====================

// Registro de usuario
router.post(
  '/register',
  authLimiter,           // Rate limiting
  validateRegister,      // Validación
  authController.register
);

// Inicio de sesión
router.post(
  '/login',
  authLimiter,
  validateLogin,
  authController.login
);

// Solicitar recuperación de contraseña
router.post(
  '/forgot-password',
  authLimiter,
  validateForgotPassword,
  authController.forgotPassword
);

// Restablecer contraseña
router.post(
  '/reset-password',
  authLimiter,
  validateResetPassword,
  authController.resetPassword
);

// ==================== RUTAS PROTEGIDAS ====================

// Cerrar sesión (requiere autenticación)
router.post(
  '/logout',
  authMiddleware,
  authController.logout
);

// Obtener perfil del usuario (requiere autenticación)
router.get(
  '/profile',
  authMiddleware,
  authController.getProfile
);

// ==================== RUTA DE PRUEBA ====================
router.get('/', (req, res) => {
  res.json({
    message: 'Auth API - StonkyStonk',
    endpoints: {
      public: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'POST /api/auth/forgot-password',
        'POST /api/auth/reset-password'
      ],
      protected: [
        'POST /api/auth/logout (requiere token)',
        'GET /api/auth/profile (requiere token)'
      ]
    }
  });
});

module.exports = router;
