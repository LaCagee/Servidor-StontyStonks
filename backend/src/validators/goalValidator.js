// ============================================
// VALIDADORES DE METAS (GOALS)
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

// ==================== VALIDADOR: CREAR META ====================
const validateCreate = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre de la meta es obligatorio')
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),

  body('targetAmount')
    .notEmpty().withMessage('El monto objetivo es obligatorio')
    .isFloat({ min: 0.01 }).withMessage('El monto objetivo debe ser mayor a 0')
    .toFloat(),

  body('deadline')
    .optional()
    .isISO8601().withMessage('La fecha límite debe ser válida (formato ISO 8601)')
    .custom((value) => {
      if (value && new Date(value) < new Date()) {
        throw new Error('La fecha límite debe ser futura');
      }
      return true;
    })
    .toDate(),

  body('categoryId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de categoría debe ser un número válido')
    .toInt(),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),

  handleValidationErrors
];

// ==================== VALIDADOR: ACTUALIZAR META ====================
const validateUpdate = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('El nombre no puede estar vacío')
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),

  body('targetAmount')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('El monto objetivo debe ser mayor a 0')
    .toFloat(),

  body('deadline')
    .optional()
    .isISO8601().withMessage('La fecha límite debe ser válida (formato ISO 8601)')
    .custom((value) => {
      if (value && new Date(value) < new Date()) {
        throw new Error('La fecha límite debe ser futura');
      }
      return true;
    })
    .toDate(),

  body('categoryId')
    .optional()
    .custom((value) => {
      // Permitir null o un número entero positivo
      if (value !== null && value !== undefined) {
        if (!Number.isInteger(value) || value < 1) {
          throw new Error('El ID de categoría debe ser un número válido o null');
        }
      }
      return true;
    }),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),

  handleValidationErrors
];

// ==================== VALIDADOR: FILTROS ====================
const validateFilters = [
  query('status')
    .optional()
    .isIn(['active', 'paused', 'completed', 'cancelled'])
    .withMessage('El estado debe ser: active, paused, completed o cancelled'),

  handleValidationErrors
];

// ==================== EXPORTAR ====================
module.exports = {
  validateCreate,
  validateUpdate,
  validateFilters
};
