// ============================================
// RUTAS DE ANÁLISIS
// ============================================
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const analysisController = require('../controllers/analysisController');

// ==================== TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN ====================

// Obtener insights financieros
router.get(
  '/insights',
  authMiddleware,
  analysisController.getInsights
);

// Obtener proyecciones futuras
router.get(
  '/projections',
  authMiddleware,
  analysisController.getProjections
);

module.exports = router;
