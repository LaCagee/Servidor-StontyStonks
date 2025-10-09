const express = require('express');
const router = express.Router();
const { authLimiter } = require('../middlewares/rateLimiter');
// const authController = require('../controllers/authController');

// Aplicar rate limiting a rutas de autenticación
router.use(authLimiter);

// TODO: Implementar en A.2
// router.post('/register', authController.register);
// router.post('/login', authController.login);
// router.post('/logout', authController.logout);

// Ruta temporal de prueba
router.get('/', (req, res) => {
  res.json({ message: 'Auth routes - Coming soon' });
});

module.exports = router;