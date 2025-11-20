// ============================================
// RUTAS DE REPORTES
// ============================================
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const reportsController = require('../controllers/reportsController');

// ==================== TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN ====================

// Obtener resumen de reportes
router.get(
  '/summary',
  authMiddleware,
  reportsController.getReportSummary
);

// Exportar reporte
router.get(
  '/export',
  authMiddleware,
  reportsController.exportReport
);

module.exports = router;
