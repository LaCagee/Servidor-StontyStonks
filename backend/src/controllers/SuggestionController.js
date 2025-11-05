// ============================================
// CONTROLADOR DE SUGERENCIAS DE CATEGORÍAS
// ============================================
const CategorySuggestionService = require('../services/CategorySuggestionService');

// ==================== OBTENER SUGERENCIAS ====================
exports.getSuggestions = async (req, res) => {
  try {
    const { description, type, maxSuggestions = 3, minScore = 5 } = req.query;

    // Validar parámetros obligatorios
    if (!description) {
      return res.status(400).json({
        error: 'La descripción es obligatoria'
      });
    }

    if (!type) {
      return res.status(400).json({
        error: 'El tipo de transacción es obligatorio'
      });
    }

    // Obtener sugerencias
    const suggestions = await CategorySuggestionService.suggestCategories(
      description,
      type,
      parseInt(maxSuggestions),
      parseInt(minScore)
    );

    res.json({
      message: 'Sugerencias obtenidas exitosamente',
      description,
      type,
      count: suggestions.length,
      suggestions
    });

  } catch (error) {
    console.error('Error al obtener sugerencias:', error);
    res.status(500).json({
      error: 'Error al obtener sugerencias',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== OBTENER MEJOR SUGERENCIA ====================
exports.getBestSuggestion = async (req, res) => {
  try {
    const { description, type } = req.query;

    // Validar parámetros obligatorios
    if (!description) {
      return res.status(400).json({
        error: 'La descripción es obligatoria'
      });
    }

    if (!type) {
      return res.status(400).json({
        error: 'El tipo de transacción es obligatorio'
      });
    }

    // Obtener mejor sugerencia
    const bestSuggestion = await CategorySuggestionService.suggestBestCategory(
      description,
      type
    );

    if (!bestSuggestion) {
      return res.json({
        message: 'No se encontraron sugerencias para esta descripción',
        description,
        type,
        suggestion: null
      });
    }

    res.json({
      message: 'Mejor sugerencia obtenida',
      description,
      type,
      suggestion: bestSuggestion
    });

  } catch (error) {
    console.error('Error al obtener mejor sugerencia:', error);
    res.status(500).json({
      error: 'Error al obtener sugerencia',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== PROBAR SUGERENCIAS (MODO DEBUG) ====================
exports.testSuggestions = async (req, res) => {
  try {
    const { descriptions, type } = req.body;

    // Validar entrada
    if (!descriptions || !Array.isArray(descriptions) || descriptions.length === 0) {
      return res.status(400).json({
        error: 'Debe proporcionar un array de descripciones'
      });
    }

    if (!type) {
      return res.status(400).json({
        error: 'El tipo de transacción es obligatorio'
      });
    }

    // Probar sugerencias
    const results = await CategorySuggestionService.testSuggestions(
      descriptions,
      type
    );

    res.json({
      message: 'Prueba de sugerencias completada',
      type,
      totalTests: descriptions.length,
      results
    });

  } catch (error) {
    console.error('Error en prueba de sugerencias:', error);
    res.status(500).json({
      error: 'Error al probar sugerencias',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== ESTADÍSTICAS DEL DICCIONARIO ====================
exports.getKeywordStats = async (req, res) => {
  try {
    const stats = CategorySuggestionService.getKeywordStats();

    res.json({
      message: 'Estadísticas del diccionario de palabras clave',
      stats
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== VALIDAR CATEGORÍA PARA TIPO ====================
exports.validateCategoryForType = async (req, res) => {
  try {
    const { categoryId, type } = req.query;

    if (!categoryId) {
      return res.status(400).json({
        error: 'El ID de categoría es obligatorio'
      });
    }

    if (!type) {
      return res.status(400).json({
        error: 'El tipo de transacción es obligatorio'
      });
    }

    const isValid = await CategorySuggestionService.isCategoryValidForType(
      parseInt(categoryId),
      type
    );

    res.json({
      categoryId: parseInt(categoryId),
      type,
      isValid,
      message: isValid
        ? 'La categoría es válida para este tipo de transacción'
        : 'La categoría no es válida para este tipo de transacción'
    });

  } catch (error) {
    console.error('Error al validar categoría:', error);
    res.status(500).json({
      error: 'Error al validar categoría',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};