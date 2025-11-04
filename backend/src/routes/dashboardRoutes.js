// ============================================
// RUTAS DE DASHBOARD
// ============================================
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const dashboardController = require('../controllers/dashboardController');

// ==================== TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN ====================

// Resumen completo del dashboard (todo en uno)
router.get(
  '/overview',
  authMiddleware,
  dashboardController.getDashboardOverview
);

// Balance general del usuario
router.get(
  '/balance',
  authMiddleware,
  dashboardController.getBalance
);

// Resumen del mes actual
router.get(
  '/current-month',
  authMiddleware,
  dashboardController.getCurrentMonthSummary
);

// Gastos agrupados por categoría
router.get(
  '/by-category',
  authMiddleware,
  dashboardController.getExpensesByCategory
);

// Tendencia mensual (últimos N meses)
router.get(
  '/monthly-trend',
  authMiddleware,
  dashboardController.getMonthlyTrend
);

module.exports = router;