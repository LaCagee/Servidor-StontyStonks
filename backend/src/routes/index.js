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
const goalRoutes = require('./goalRoutes');  
const budgetRoutes = require('./Budgetroutes');
const analysisRoutes = require('./analysisRoutes');
const reportsRoutes = require('./reportsRoutes');
const settingsRoutes = require('./settingsRoutes');
const notificationsRoutes = require('./notificationsRoutes');  


// Usar rutas
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/transactions', transactionRoutes);
router.use('/categories', categoryRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/suggestions', suggestionRoutes);
router.use('/goals', goalRoutes);  
router.use('/budgets', budgetRoutes);
router.use('/analysis', analysisRoutes);
router.use('/reports', reportsRoutes);
router.use('/settings', settingsRoutes);
router.use('/notifications', notificationsRoutes);  

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
      goals: '/api/goals',
      budgets: '/api/budgets',
      analysis: '/api/analysis',
      reports: '/api/reports',
      settings: '/api/settings',
      notifications: '/api/notifications'
    }
  });
});

module.exports = router;