// ============================================
// CONTROLADOR DE METAS FINANCIERAS (GOALS)
// ============================================
const { Goal, Category, Transaction } = require('../models');
const { Op } = require('sequelize');

// ==================== CREAR META ====================
exports.createGoal = async (req, res) => {
  try {
    const { name, targetAmount, deadline, categoryId, description } = req.body;
    const userId = req.userId;

    // Validar categoría si se proporciona
    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      
      if (!category || !category.isActive) {
        return res.status(400).json({
          error: 'Categoría no válida'
        });
      }
    }

    // Crear meta
    const goal = await Goal.create({
      userId,
      name,
      targetAmount,
      deadline: deadline || null,
      categoryId: categoryId || null,
      description: description || null,
      status: 'active'
    });

    // Obtener información completa
    const goalWithInfo = await goal.getFullInfo();

    res.status(201).json({
      message: 'Meta creada exitosamente',
      goal: goalWithInfo
    });

  } catch (error) {
    console.error('Error al crear meta:', error);
    res.status(500).json({
      error: 'Error al crear la meta',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== OBTENER TODAS LAS METAS ====================
exports.getAllGoals = async (req, res) => {
  try {
    const userId = req.userId;
    const { status } = req.query;

    let whereClause = { userId };

    if (status) {
      whereClause.status = status;
    }

    const goals = await Goal.findAll({
      where: whereClause,
      order: [
        ['status', 'ASC'],
        ['deadline', 'ASC NULLS LAST'],
        ['createdAt', 'DESC']
      ]
    });

    // Obtener información completa para cada meta
    const goalsWithInfo = await Promise.all(
      goals.map(goal => goal.getFullInfo())
    );

    res.json({
      message: 'Metas obtenidas exitosamente',
      count: goalsWithInfo.length,
      goals: goalsWithInfo
    });

  } catch (error) {
    console.error('Error al obtener metas:', error);
    res.status(500).json({
      error: 'Error al obtener metas',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== OBTENER META POR ID ====================
exports.getGoalById = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const goal = await Goal.findOne({
      where: { id, userId }
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Meta no encontrada'
      });
    }

    const goalWithInfo = await goal.getFullInfo();

    res.json({
      goal: goalWithInfo
    });

  } catch (error) {
    console.error('Error al obtener meta:', error);
    res.status(500).json({
      error: 'Error al obtener la meta',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== ACTUALIZAR META ====================
exports.updateGoal = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { name, targetAmount, deadline, categoryId, description } = req.body;

    const goal = await Goal.findOne({
      where: { id, userId }
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Meta no encontrada'
      });
    }

    // No permitir editar metas completadas o canceladas
    if (goal.status === 'completed' || goal.status === 'cancelled') {
      return res.status(400).json({
        error: `No se puede editar una meta ${goal.status === 'completed' ? 'completada' : 'cancelada'}`
      });
    }

    // Validar categoría si se proporciona
    if (categoryId !== undefined) {
      if (categoryId) {
        const category = await Category.findByPk(categoryId);
        
        if (!category || !category.isActive) {
          return res.status(400).json({
            error: 'Categoría no válida'
          });
        }
      }
      goal.categoryId = categoryId;
    }

    // Actualizar campos
    if (name !== undefined) goal.name = name;
    if (targetAmount !== undefined) goal.targetAmount = targetAmount;
    if (deadline !== undefined) goal.deadline = deadline;
    if (description !== undefined) goal.description = description;

    await goal.save();

    const updatedGoal = await goal.getFullInfo();

    res.json({
      message: 'Meta actualizada exitosamente',
      goal: updatedGoal
    });

  } catch (error) {
    console.error('Error al actualizar meta:', error);
    res.status(500).json({
      error: 'Error al actualizar la meta',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== PAUSAR META ====================
exports.pauseGoal = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const goal = await Goal.findOne({
      where: { id, userId }
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Meta no encontrada'
      });
    }

    if (goal.status !== 'active') {
      return res.status(400).json({
        error: 'Solo se pueden pausar metas activas'
      });
    }

    await goal.pause();

    res.json({
      message: 'Meta pausada exitosamente',
      goal: {
        id: goal.id,
        name: goal.name,
        status: goal.status
      }
    });

  } catch (error) {
    console.error('Error al pausar meta:', error);
    res.status(500).json({
      error: 'Error al pausar la meta',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== REACTIVAR META ====================
exports.activateGoal = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const goal = await Goal.findOne({
      where: { id, userId }
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Meta no encontrada'
      });
    }

    if (goal.status !== 'paused') {
      return res.status(400).json({
        error: 'Solo se pueden reactivar metas pausadas'
      });
    }

    await goal.activate();

    const updatedGoal = await goal.getFullInfo();

    res.json({
      message: 'Meta reactivada exitosamente',
      goal: updatedGoal
    });

  } catch (error) {
    console.error('Error al reactivar meta:', error);
    res.status(500).json({
      error: 'Error al reactivar la meta',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== CANCELAR META ====================
exports.cancelGoal = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const goal = await Goal.findOne({
      where: { id, userId }
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Meta no encontrada'
      });
    }

    if (goal.status === 'completed') {
      return res.status(400).json({
        error: 'No se puede cancelar una meta completada'
      });
    }

    await goal.cancel();

    res.json({
      message: 'Meta cancelada exitosamente',
      goal: {
        id: goal.id,
        name: goal.name,
        status: goal.status
      }
    });

  } catch (error) {
    console.error('Error al cancelar meta:', error);
    res.status(500).json({
      error: 'Error al cancelar la meta',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== ELIMINAR META ====================
exports.deleteGoal = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const goal = await Goal.findOne({
      where: { id, userId }
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Meta no encontrada'
      });
    }

    // Desvincular transacciones asociadas
    await Transaction.update(
      { goalId: null },
      { where: { goalId: id, userId } }
    );

    await goal.destroy();

    res.json({
      message: 'Meta eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar meta:', error);
    res.status(500).json({
      error: 'Error al eliminar la meta',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== MARCAR COMO COMPLETADA ====================
exports.completeGoal = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const goal = await Goal.findOne({
      where: { id, userId }
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Meta no encontrada'
      });
    }

    if (goal.status === 'completed') {
      return res.status(400).json({
        error: 'La meta ya está completada'
      });
    }

    await goal.markAsCompleted();

    const completedGoal = await goal.getFullInfo();

    res.json({
      message: '🎉 ¡Felicidades! Meta completada exitosamente',
      goal: completedGoal
    });

  } catch (error) {
    console.error('Error al completar meta:', error);
    res.status(500).json({
      error: 'Error al completar la meta',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== VERIFICAR METAS AUTOMÁTICAMENTE ====================
exports.checkGoalsProgress = async (req, res) => {
  try {
    const userId = req.userId;

    const completedGoals = await Goal.checkAndCompleteGoals(userId);

    if (completedGoals.length === 0) {
      return res.json({
        message: 'No hay metas completadas automáticamente',
        completedGoals: []
      });
    }

    const goalsInfo = await Promise.all(
      completedGoals.map(goal => goal.getFullInfo())
    );

    res.json({
      message: `¡Felicidades! ${completedGoals.length} meta(s) completada(s) automáticamente`,
      completedGoals: goalsInfo
    });

  } catch (error) {
    console.error('Error al verificar progreso:', error);
    res.status(500).json({
      error: 'Error al verificar progreso de metas',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== OBTENER TRANSACCIONES DE UNA META ====================
exports.getGoalTransactions = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const goal = await Goal.findOne({
      where: { id, userId }
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Meta no encontrada'
      });
    }

    const transactions = await Transaction.findAll({
      where: {
        userId,
        goalId: id,
        isActive: true
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color']
      }],
      order: [['date', 'DESC']]
    });

    const total = await Transaction.getTotalForGoal(userId, id);

    res.json({
      message: 'Transacciones obtenidas exitosamente',
      goalId: id,
      goalName: goal.name,
      totalSaved: total,
      transactionCount: transactions.length,
      transactions
    });

  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    res.status(500).json({
      error: 'Error al obtener transacciones de la meta',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};