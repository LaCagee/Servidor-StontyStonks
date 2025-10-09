const express = require('express');
const router = express.Router();
const { apiLimiter } = require('../middlewares/rateLimiter');

// Aplicar rate limiting general a todas las rutas API
router.use(apiLimiter);

// Importar rutas específicas
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const transactionRoutes = require('./transactionRoutes');

// Usar rutas
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/transactions', transactionRoutes);

// Ruta de prueba
router.get('/', (req, res) => {
  res.json({
    message: 'API StonkyStonk v1.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      transactions: '/api/transactions'
    }
  });
});

module.exports = router;