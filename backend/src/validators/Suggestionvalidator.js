// ============================================
// VALIDADORES DE SUGERENCIAS DE CATEGORÍAS
// ============================================
const { query, body, validationResult } = require('express-validator');

// ==================== MIDDLEWARE PARA MANEJAR ERRORES ====================
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Errores de validación',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }

  next();
};

// ==================== VALIDADOR: OBTENER SUGERENCIAS ====================
const validateGetSuggestions = [
  query('description')
    .trim()
    .notEmpty().withMessage('La descripción es obligatoria')
    .isLength({ min: 1, max: 500 }).withMessage('La descripción debe tener entre 1 y 500 caracteres'),

  query('type')
    .notEmpty().withMessage('El tipo de transacción es obligatorio')
    .isIn(['income', 'expense']).withMessage('El tipo debe ser "income" o "expense"'),

  query('maxSuggestions')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('maxSuggestions debe estar entre 1 y 10')
    .toInt(),

  query('minScore')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('minScore debe estar entre 0 y 100')
    .toFloat(),

  handleValidationErrors
];

// ==================== VALIDADOR: OBTENER MEJOR SUGERENCIA ====================
const validateGetBestSuggestion = [
  query('description')
    .trim()
    .notEmpty().withMessage('La descripción es obligatoria')
    .isLength({ min: 1, max: 500 }).withMessage('La descripción debe tener entre 1 y 500 caracteres'),

  query('type')
    .notEmpty().withMessage('El tipo de transacción es obligatorio')
    .isIn(['income', 'expense']).withMessage('El tipo debe ser "income" o "expense"'),

  handleValidationErrors
];

// ==================== VALIDADOR: PROBAR SUGERENCIAS ====================
const validateTestSuggestions = [
  body('descriptions')
    .isArray({ min: 1, max: 20 }).withMessage('Debe proporcionar entre 1 y 20 descripciones')
    .custom((value) => {
      if (!value.every(desc => typeof desc === 'string' && desc.length > 0 && desc.length <= 500)) {
        throw new Error('Todas las descripciones deben ser texto válido (1-500 caracteres)');
      }
      return true;
    }),

  body('type')
    .notEmpty().withMessage('El tipo de transacción es obligatorio')
    .isIn(['income', 'expense']).withMessage('El tipo debe ser "income" o "expense"'),

  handleValidationErrors
];

// ==================== VALIDADOR: VALIDAR CATEGORÍA ====================
const validateCategoryForType = [
  query('categoryId')
    .notEmpty().withMessage('El ID de categoría es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID de categoría debe ser un número válido')
    .toInt(),

  query('type')
    .notEmpty().withMessage('El tipo de transacción es obligatorio')
    .isIn(['income', 'expense']).withMessage('El tipo debe ser "income" o "expense"'),

  handleValidationErrors
];

// ==================== EXPORTAR ====================
module.exports = {
  validateGetSuggestions,
  validateGetBestSuggestion,
  validateTestSuggestions,
  validateCategoryForType
};