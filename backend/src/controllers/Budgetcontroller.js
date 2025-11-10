// ============================================
// CONTROLADOR DE PRESUPUESTOS
// ============================================
const { Budget, Category, Transaction } = require('../models');
const { Op } = require('sequelize');

// ==================== CREAR PRESUPUESTO ====================
exports.createBudget = async (req, res) => {
  try {
    const userId = req.userId;
    const { categoryId, monthlyLimit, alertThreshold, month, year, description } = req.body;

    // Validar que la categoría exista y sea del tipo correcto
    const category = await Category.findByPk(categoryId);

    if (!category) {
      return res.status(400).json({ error: 'Categoría no encontrada' });
    }

    if (!category.isActive) {
      return res.status(400).json({ error: 'Categoría no disponible' });
    }

    // Solo permitir presupuestos para categorías de gastos
    if (category.type === 'income') {
      return res.status(400).json({
        error: 'No se pueden crear presupuestos para categorías de ingresos'
      });
    }

    // Verificar si ya existe un presupuesto para esta categoría en este mes/año
    const existingBudget = await Budget.findOne({
      where: {
        userId,
        categoryId,
        month,
        year
      }
    });

    if (existingBudget) {
      return res.status(409).json({
        error: 'Ya existe un presupuesto para esta categoría en este período',
        existingBudget: await existingBudget.getFullInfo()
      });
    }

    // Crear presupuesto
    const budget = await Budget.create({
      userId,
      categoryId,
      monthlyLimit,
      alertThreshold: alertThreshold || 80,
      month,
      year,
      description: description || null
    });

    // Obtener información completa del presupuesto
    const budgetInfo = await budget.getFullInfo();

    res.status(201).json({
      message: 'Presupuesto creado exitosamente',
      budget: budgetInfo
    });

  } catch (error) {
    console.error('Error al crear presupuesto:', error);
    res.status(500).json({
      error: 'Error al crear presupuesto',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== OBTENER TODOS LOS PRESUPUESTOS ====================
exports.getAllBudgets = async (req, res) => {
  try {
    const userId = req.userId;
    const { month, year, status } = req.query;

    // Construir filtros
    const where = { userId };

    if (month) {
      where.month = parseInt(month);
    }

    if (year) {
      where.year = parseInt(year);
    }

    if (status) {
      where.isActive = status === 'active';
    }

    const budgets = await Budget.findAll({
      where,
      order: [['month', 'DESC'], ['year', 'DESC'], ['categoryId', 'ASC']]
    });

    // Obtener información completa de cada presupuesto
    const budgetsWithInfo = await Promise.all(
      budgets.map(async (budget) => await budget.getFullInfo())
    );

    res.json({
      message: 'Presupuestos obtenidos exitosamente',
      count: budgetsWithInfo.length,
      budgets: budgetsWithInfo
    });

  } catch (error) {
    console.error('Error al obtener presupuestos:', error);
    res.status(500).json({
      error: 'Error al obtener presupuestos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== OBTENER PRESUPUESTOS DEL MES ACTUAL ====================
exports.getCurrentMonthBudgets = async (req, res) => {
  try {
    const userId = req.userId;

    const budgets = await Budget.getCurrentMonthBudgets(userId);

    // Obtener información completa
    const budgetsWithInfo = await Promise.all(
      budgets.map(async (budget) => await budget.getFullInfo())
    );

    // Calcular resumen
const summary = {
  totalBudgets: budgetsWithInfo.length,
  totalLimit: budgetsWithInfo.reduce((sum, b) => sum + parseFloat(b.monthlyLimit), 0),
  totalSpent: budgetsWithInfo.reduce((sum, b) => sum + parseFloat(b.spent.currentSpent), 0),
  exceededCount: budgetsWithInfo.filter(b => b.spent.isExceeded).length,
  alertCount: budgetsWithInfo.filter(b => b.spent.shouldAlert).length
};

    res.json({
      message: 'Presupuestos del mes actual obtenidos exitosamente',
      summary,
      budgets: budgetsWithInfo
    });

  } catch (error) {
    console.error('Error al obtener presupuestos del mes:', error);
    res.status(500).json({
      error: 'Error al obtener presupuestos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== OBTENER PRESUPUESTO POR ID ====================
exports.getBudgetById = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const budget = await Budget.findOne({
      where: { id, userId }
    });

    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    const budgetInfo = await budget.getFullInfo();

    res.json({
      budget: budgetInfo
    });

  } catch (error) {
    console.error('Error al obtener presupuesto:', error);
    res.status(500).json({
      error: 'Error al obtener presupuesto',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== ACTUALIZAR PRESUPUESTO ====================
exports.updateBudget = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { monthlyLimit, alertThreshold, description } = req.body;

    const budget = await Budget.findOne({
      where: { id, userId }
    });

    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    if (!budget.isActive) {
      return res.status(400).json({
        error: 'No se puede editar un presupuesto desactivado'
      });
    }

    // Actualizar campos
    if (monthlyLimit !== undefined) budget.monthlyLimit = monthlyLimit;
    if (alertThreshold !== undefined) budget.alertThreshold = alertThreshold;
    if (description !== undefined) budget.description = description;

    await budget.save();

    const updatedBudget = await budget.getFullInfo();

    res.json({
      message: 'Presupuesto actualizado exitosamente',
      budget: updatedBudget
    });

  } catch (error) {
    console.error('Error al actualizar presupuesto:', error);
    res.status(500).json({
      error: 'Error al actualizar presupuesto',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== DESACTIVAR PRESUPUESTO ====================
exports.deactivateBudget = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const budget = await Budget.findOne({
      where: { id, userId }
    });

    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    if (!budget.isActive) {
      return res.status(400).json({
        error: 'El presupuesto ya está desactivado'
      });
    }

    await budget.deactivate();

    res.json({
      message: 'Presupuesto desactivado exitosamente',
      budget: {
        id: budget.id,
        isActive: budget.isActive
      }
    });

  } catch (error) {
    console.error('Error al desactivar presupuesto:', error);
    res.status(500).json({
      error: 'Error al desactivar presupuesto',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== ACTIVAR PRESUPUESTO ====================
exports.activateBudget = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const budget = await Budget.findOne({
      where: { id, userId }
    });

    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    if (budget.isActive) {
      return res.status(400).json({
        error: 'El presupuesto ya está activo'
      });
    }

    await budget.activate();

    res.json({
      message: 'Presupuesto activado exitosamente',
      budget: {
        id: budget.id,
        isActive: budget.isActive
      }
    });

  } catch (error) {
    console.error('Error al activar presupuesto:', error);
    res.status(500).json({
      error: 'Error al activar presupuesto',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== ELIMINAR PRESUPUESTO ====================
exports.deleteBudget = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const budget = await Budget.findOne({
      where: { id, userId }
    });

    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    await budget.destroy();

    res.json({
      message: 'Presupuesto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar presupuesto:', error);
    res.status(500).json({
      error: 'Error al eliminar presupuesto',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== OBTENER PRESUPUESTOS QUE REQUIEREN ALERTA ====================
exports.getBudgetsRequiringAlert = async (req, res) => {
  try {
    const userId = req.userId;

    const alertBudgets = await Budget.getBudgetsRequiringAlert(userId);

    res.json({
      message: 'Presupuestos con alertas obtenidos exitosamente',
      count: alertBudgets.length,
      budgets: alertBudgets
    });

  } catch (error) {
    console.error('Error al obtener presupuestos con alerta:', error);
    res.status(500).json({
      error: 'Error al obtener presupuestos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== OBTENER PRESUPUESTOS EXCEDIDOS ====================
exports.getExceededBudgets = async (req, res) => {
  try {
    const userId = req.userId;

    const exceededBudgets = await Budget.getExceededBudgets(userId);

    res.json({
      message: 'Presupuestos excedidos obtenidos exitosamente',
      count: exceededBudgets.length,
      budgets: exceededBudgets
    });

  } catch (error) {
    console.error('Error al obtener presupuestos excedidos:', error);
    res.status(500).json({
      error: 'Error al obtener presupuestos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== OBTENER RESUMEN GENERAL ====================
exports.getBudgetSummary = async (req, res) => {
  try {
    const userId = req.userId;
    const { month, year } = req.query;

    const summary = await Budget.getSummary(
      userId,
      month ? parseInt(month) : null,
      year ? parseInt(year) : null
    );

    res.json({
      message: 'Resumen de presupuestos obtenido exitosamente',
      summary
    });

  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({
      error: 'Error al obtener resumen',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== SUGERIR PRESUPUESTO AUTOMÁTICO ====================
exports.suggestBudget = async (req, res) => {
  try {
    const userId = req.userId;
    const { categoryId, months = 3 } = req.query;

    if (!categoryId) {
      return res.status(400).json({
        error: 'El ID de categoría es obligatorio'
      });
    }

    // Validar categoría
    const category = await Category.findByPk(categoryId);

    if (!category || !category.isActive) {
      return res.status(400).json({ error: 'Categoría no válida' });
    }

    if (category.type === 'income') {
      return res.status(400).json({
        error: 'No se pueden crear presupuestos para categorías de ingresos'
      });
    }

    // Calcular fecha de inicio (N meses atrás)
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - parseInt(months), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth(), 0);

    // Obtener gastos históricos
    const historicalExpenses = await Transaction.sum('amount', {
      where: {
        userId,
        categoryId,
        type: 'expense',
        isActive: true,
        date: {
          [Op.between]: [startDate, endDate]
        }
      }
    }) || 0;

    // Calcular promedio mensual
    const monthsAnalyzed = parseInt(months);
    const averageMonthly = historicalExpenses / monthsAnalyzed;

    // Sugerir con un margen del 10%
    const suggestedLimit = Math.ceil(averageMonthly * 1.1);

    res.json({
      message: 'Sugerencia de presupuesto calculada',
      suggestion: {
        categoryId: parseInt(categoryId),
        categoryName: category.name,
        monthsAnalyzed,
        historicalTotal: parseFloat(historicalExpenses.toFixed(2)),
        averageMonthly: parseFloat(averageMonthly.toFixed(2)),
        suggestedLimit: parseFloat(suggestedLimit.toFixed(2)),
        margin: '10%',
        reasoning: `Basado en tu promedio de gastos de los últimos ${monthsAnalyzed} meses, más un 10% de margen`
      }
    });

  } catch (error) {
    console.error('Error al sugerir presupuesto:', error);
    res.status(500).json({
      error: 'Error al calcular sugerencia',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== CREAR PRESUPUESTOS PARA EL PRÓXIMO MES ====================
exports.createNextMonthBudgets = async (req, res) => {
  try {
    const userId = req.userId;

    const newBudgets = await Budget.createNextMonthBudgets(userId);

    if (newBudgets.length === 0) {
      return res.json({
        message: 'No hay presupuestos activos para replicar'
      });
    }

    // Obtener información completa de los nuevos presupuestos
    const budgetsWithInfo = await Promise.all(
      newBudgets.map(async (budget) => await budget.getFullInfo())
    );

    res.status(201).json({
      message: `${newBudgets.length} presupuestos creados para el próximo mes`,
      count: newBudgets.length,
      budgets: budgetsWithInfo
    });

  } catch (error) {
    console.error('Error al crear presupuestos del próximo mes:', error);
    res.status(500).json({
      error: 'Error al crear presupuestos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== CREAR PRESUPUESTOS MÚLTIPLES ====================
exports.createMultipleBudgets = async (req, res) => {
  try {
    const userId = req.userId;
    const { budgets } = req.body;

    if (!Array.isArray(budgets) || budgets.length === 0) {
      return res.status(400).json({
        error: 'Debe proporcionar un array de presupuestos'
      });
    }

    const createdBudgets = [];
    const errors = [];

    for (const budgetData of budgets) {
      try {
        const { categoryId, monthlyLimit, alertThreshold, month, year, description } = budgetData;

        // Validar categoría
        const category = await Category.findByPk(categoryId);
        if (!category || !category.isActive || category.type === 'income') {
          errors.push({
            categoryId,
            error: 'Categoría no válida o es de ingresos'
          });
          continue;
        }

        // Verificar duplicados
        const existing = await Budget.findOne({
          where: { userId, categoryId, month, year }
        });

        if (existing) {
          errors.push({
            categoryId,
            error: 'Ya existe un presupuesto para esta categoría en este período'
          });
          continue;
        }

        // Crear presupuesto
        const budget = await Budget.create({
          userId,
          categoryId,
          monthlyLimit,
          alertThreshold: alertThreshold || 80,
          month,
          year,
          description: description || null
        });

        createdBudgets.push(await budget.getFullInfo());

      } catch (error) {
        errors.push({
          categoryId: budgetData.categoryId,
          error: error.message
        });
      }
    }

    res.status(201).json({
      message: `${createdBudgets.length} presupuestos creados exitosamente`,
      created: createdBudgets.length,
      failed: errors.length,
      budgets: createdBudgets,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error al crear presupuestos múltiples:', error);
    res.status(500).json({
      error: 'Error al crear presupuestos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};