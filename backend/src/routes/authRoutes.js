// ============================================
// Rutas de Autenticación
// Acá definimos todas las rutas para login, registro, etc.
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
  validateResetPassword,
  validateVerifyEmail,
  validateResendVerification
} = require('../validators/authValidator');

// ==================== Rutas Públicas (no necesitan login) ====================

// Ruta para registrar un nuevo usuario
router.post(
  '/register',
  authLimiter,           // Limitamos requests para evitar spam
  validateRegister,      // Validamos que los datos sean correctos
  authController.register
);

// Ruta para hacer login
router.post(
  '/login',
  authLimiter,
  validateLogin,
  authController.login
);

// Ruta para pedir reset de contraseña
router.post(
  '/forgot-password',
  authLimiter,
  validateForgotPassword,
  authController.forgotPassword
);

// Ruta para verificar si el token de reset es válido
router.post(
  '/verify-reset-token',
  authLimiter,
  validateVerifyEmail, // Reutilizamos este validador porque solo necesita 'token'
  authController.verifyResetToken
);

// Ruta para cambiar la contraseña con el token de reset
router.post(
  '/reset-password',
  authLimiter,
  validateResetPassword,
  authController.resetPassword
);

// Ruta para verificar el email con el token que le llegó al usuario
router.post(
  '/verify-email',
  validateVerifyEmail,
  authController.verifyEmail
);

// Ruta para reenviar el email de verificación
router.post(
  '/resend-verification',
  authLimiter,
  validateResendVerification,
  authController.resendVerification
);

// ==================== Rutas Protegidas (necesitan estar logueado) ====================

// Ruta para cerrar sesión
router.post(
  '/logout',
  authMiddleware,  // Middleware que chequea que esté logueado
  authController.logout
);

// Ruta para obtener los datos del perfil del usuario logueado
router.get(
  '/profile',
  authMiddleware,  // Middleware que chequea que esté logueado
  authController.getProfile
);

// ==================== Ruta de Prueba (para ver qué endpoints hay disponibles) ====================
router.get('/', (req, res) => {
  res.json({
    message: 'Auth API - StonkyStonk',
    endpoints: {
      public: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'POST /api/auth/verify-email',
        'POST /api/auth/resend-verification',
        'POST /api/auth/forgot-password',
        'POST /api/auth/verify-reset-token',
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
