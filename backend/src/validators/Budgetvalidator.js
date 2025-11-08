// ============================================
// VALIDADORES DE PRESUPUESTOS
// ============================================
const { body, query, validationResult } = require('express-validator');

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

// ==================== VALIDADOR: CREAR PRESUPUESTO ====================
const validateCreate = [
  body('categoryId')
    .notEmpty().withMessage('La categoría es obligatoria')
    .isInt({ min: 1 }).withMessage('El ID de categoría debe ser un número válido')
    .toInt(),

  body('monthlyLimit')
    .notEmpty().withMessage('El límite mensual es obligatorio')
    .isFloat({ min: 0.01 }).withMessage('El límite debe ser mayor a 0')
    .toFloat(),

  body('alertThreshold')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El umbral de alerta debe estar entre 1 y 100')
    .toInt(),

  body('month')
    .notEmpty().withMessage('El mes es obligatorio')
    .isInt({ min: 1, max: 12 }).withMessage('El mes debe estar entre 1 y 12')
    .toInt(),

  body('year')
    .notEmpty().withMessage('El año es obligatorio')
    .isInt({ min: 2020, max: 2100 }).withMessage('El año debe ser válido')
    .toInt(),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('La descripción no puede exceder 300 caracteres'),

  handleValidationErrors
];

// ==================== VALIDADOR: ACTUALIZAR PRESUPUESTO ====================
const validateUpdate = [
  body('monthlyLimit')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('El límite debe ser mayor a 0')
    .toFloat(),

  body('alertThreshold')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El umbral de alerta debe estar entre 1 y 100')
    .toInt(),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('La descripción no puede exceder 300 caracteres'),

  handleValidationErrors
];

// ==================== VALIDADOR: FILTROS DE BÚSQUEDA ====================
const validateFilters = [
  query('month')
    .optional()
    .isInt({ min: 1, max: 12 }).withMessage('El mes debe estar entre 1 y 12')
    .toInt(),

  query('year')
    .optional()
    .isInt({ min: 2020, max: 2100 }).withMessage('El año debe ser válido')
    .toInt(),

  query('status')
    .optional()
    .isIn(['active', 'inactive']).withMessage('El estado debe ser "active" o "inactive"'),

  handleValidationErrors
];

// ==================== VALIDADOR: SUGERIR PRESUPUESTO ====================
const validateSuggest = [
  query('categoryId')
    .notEmpty().withMessage('El ID de categoría es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID de categoría debe ser un número válido')
    .toInt(),

  query('months')
    .optional()
    .isInt({ min: 1, max: 12 }).withMessage('Los meses deben estar entre 1 y 12')
    .toInt(),

  handleValidationErrors
];

// ==================== VALIDADOR: CREAR PRESUPUESTOS MÚLTIPLES ====================
const validateCreateMultiple = [
  body('budgets')
    .isArray({ min: 1, max: 20 }).withMessage('Debe proporcionar entre 1 y 20 presupuestos')
    .custom((value) => {
      // Validar estructura de cada presupuesto
      for (const budget of value) {
        if (!budget.categoryId || typeof budget.categoryId !== 'number') {
          throw new Error('Cada presupuesto debe tener un categoryId válido');
        }
        if (!budget.monthlyLimit || budget.monthlyLimit <= 0) {
          throw new Error('Cada presupuesto debe tener un monthlyLimit mayor a 0');
        }
        if (!budget.month || budget.month < 1 || budget.month > 12) {
          throw new Error('Cada presupuesto debe tener un mes válido (1-12)');
        }
        if (!budget.year || budget.year < 2020) {
          throw new Error('Cada presupuesto debe tener un año válido');
        }
      }
      return true;
    }),

  handleValidationErrors
];

// ==================== EXPORTAR ====================
module.exports = {
  validateCreate,
  validateUpdate,
  validateFilters,
  validateSuggest,
  validateCreateMultiple
};