// ============================================
// RUTAS PRINCIPALES 
// ============================================
const express = require('express');
const router = express.Router();
const { apiLimiter } = require('../middlewares/rateLimiter');

// Aplicar rate limiting general a todas las rutas API
router.use(apiLimiter);

// Importar rutas específicas
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const transactionRoutes = require('./transactionRoutes');
const categoryRoutes = require('./categoryRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const suggestionRoutes = require('./SuggestionRoutes');
const goalRoutes = require('./goalRoutes');  // ← NUEVO
const budgetRoutes = require('./Budgetroutes');
const analysisRoutes = require('./analysisRoutes');  // ← NUEVO
const reportsRoutes = require('./reportsRoutes');  // ← NUEVO


// Usar rutas
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/transactions', transactionRoutes);
router.use('/categories', categoryRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/suggestions', suggestionRoutes);
router.use('/goals', goalRoutes);  // ← NUEVO
router.use('/budgets', budgetRoutes);
router.use('/analysis', analysisRoutes);  // ← NUEVO
router.use('/reports', reportsRoutes);  // ← NUEVO

// Ruta de prueba
router.get('/', (req, res) => {
  res.json({
    message: 'API StonkyStonk v1.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      transactions: '/api/transactions',
      categories: '/api/categories',
      dashboard: '/api/dashboard',
      suggestions: '/api/suggestions',
      goals: '/api/goals',  // ← NUEVO
      budgets: '/api/budgets',
      analysis: '/api/analysis',  // ← NUEVO
      reports: '/api/reports'  // ← NUEVO
    }
  });
});

module.exports = router;