// ============================================
// RUTAS DE SUGERENCIAS DE CATEGORÍAS
// ============================================
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const suggestionController = require('../controllers/SuggestionController');
const {
  validateGetSuggestions,
  validateGetBestSuggestion,
  validateTestSuggestions,
  validateCategoryForType
} = require('../validators/Suggestionvalidator');

// ==================== TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN ====================

// Obtener múltiples sugerencias de categorías
router.get(
  '/',
  authMiddleware,
  validateGetSuggestions,
  suggestionController.getSuggestions
);

// Obtener la mejor sugerencia (solo 1)
router.get(
  '/best',
  authMiddleware,
  validateGetBestSuggestion,
  suggestionController.getBestSuggestion
);

// Validar si una categoría es apropiada para un tipo
router.get(
  '/validate',
  authMiddleware,
  validateCategoryForType,
  suggestionController.validateCategoryForType
);

// Obtener estadísticas del diccionario de palabras clave
router.get(
  '/stats',
  authMiddleware,
  suggestionController.getKeywordStats
);

// Probar sugerencias con múltiples descripciones (útil para testing)
router.post(
  '/test',
  authMiddleware,
  validateTestSuggestions,
  suggestionController.testSuggestions
);

module.exports = router;