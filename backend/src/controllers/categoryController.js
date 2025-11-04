// ============================================
// CONTROLADOR DE CATEGORÍAS
// ============================================
const { Category } = require('../models');

// ==================== OBTENER TODAS LAS CATEGORÍAS ACTIVAS ====================
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.getActive();
    
    res.json({
      message: 'Categorías obtenidas exitosamente',
      count: categories.length,
      categories
    });
    
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      error: 'Error al obtener categorías',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== OBTENER CATEGORÍAS DE INGRESOS ====================
exports.getIncomeCategories = async (req, res) => {
  try {
    const categories = await Category.getIncomeCategories();
    
    res.json({
      message: 'Categorías de ingresos obtenidas exitosamente',
      count: categories.length,
      categories
    });
    
  } catch (error) {
    console.error('Error al obtener categorías de ingresos:', error);
    res.status(500).json({
      error: 'Error al obtener categorías',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== OBTENER CATEGORÍAS DE GASTOS ====================
exports.getExpenseCategories = async (req, res) => {
  try {
    const categories = await Category.getExpenseCategories();
    
    res.json({
      message: 'Categorías de gastos obtenidas exitosamente',
      count: categories.length,
      categories
    });
    
  } catch (error) {
    console.error('Error al obtener categorías de gastos:', error);
    res.status(500).json({
      error: 'Error al obtener categorías',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== OBTENER CATEGORÍA POR ID ====================
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findByPk(id);
    
    if (!category) {
      return res.status(404).json({
        error: 'Categoría no encontrada'
      });
    }
    
    if (!category.isActive) {
      return res.status(404).json({
        error: 'Categoría no disponible'
      });
    }
    
    res.json({
      category
    });
    
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({
      error: 'Error al obtener categoría',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};