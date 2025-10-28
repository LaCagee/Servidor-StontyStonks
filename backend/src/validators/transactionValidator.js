// ============================================
// VALIDADORES DE TRANSACCIONES
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

// ==================== VALIDADOR: CREAR TRANSACCIÓN ====================
const validateCreate = [
  body('amount')
    .notEmpty().withMessage('El monto es obligatorio')
    .isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0')
    .toFloat(),
  
  body('type')
    .notEmpty().withMessage('El tipo es obligatorio')
    .isIn(['income', 'expense']).withMessage('El tipo debe ser "income" o "expense"'),
  
  body('date')
    .optional()
    .isISO8601().withMessage('La fecha debe ser válida (formato ISO 8601)')
    .toDate(),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
  
  body('categoryId')
    .notEmpty().withMessage('La categoría es obligatoria')
    .isInt({ min: 1 }).withMessage('El ID de categoría debe ser un número válido')
    .toInt(),
  
  body('tags')
    .optional()
    .isArray().withMessage('Las etiquetas deben ser un array')
    .custom((value) => {
      if (value && value.some(tag => typeof tag !== 'string')) {
        throw new Error('Todas las etiquetas deben ser texto');
      }
      return true;
    }),
  
  handleValidationErrors
];

// ==================== VALIDADOR: ACTUALIZAR TRANSACCIÓN ====================
const validateUpdate = [
  body('amount')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0')
    .toFloat(),
  
  body('type')
    .optional()
    .isIn(['income', 'expense']).withMessage('El tipo debe ser "income" o "expense"'),
  
  body('date')
    .optional()
    .isISO8601().withMessage('La fecha debe ser válida (formato ISO 8601)')
    .toDate(),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
  
  body('categoryId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de categoría debe ser un número válido')
    .toInt(),
  
  body('tags')
    .optional()
    .isArray().withMessage('Las etiquetas deben ser un array')
    .custom((value) => {
      if (value && value.some(tag => typeof tag !== 'string')) {
        throw new Error('Todas las etiquetas deben ser texto');
      }
      return true;
    }),
  
  handleValidationErrors
];

// ==================== VALIDADOR: FILTROS DE BÚSQUEDA ====================
const validateFilters = [
  query('categoryId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de categoría debe ser un número válido')
    .toInt(),
  
  query('type')
    .optional()
    .isIn(['income', 'expense']).withMessage('El tipo debe ser "income" o "expense"'),
  
  query('startDate')
    .optional()
    .isISO8601().withMessage('La fecha de inicio debe ser válida')
    .toDate(),
  
  query('endDate')
    .optional()
    .isISO8601().withMessage('La fecha de fin debe ser válida')
    .toDate(),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('El texto de búsqueda debe tener entre 1 y 100 caracteres'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('La página debe ser un número mayor a 0')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100')
    .toInt(),
  
  handleValidationErrors
];

// ==================== EXPORTAR ====================
module.exports = {
  validateCreate,
  validateUpdate,
  validateFilters
};