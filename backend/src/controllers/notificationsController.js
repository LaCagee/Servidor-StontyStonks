// ============================================
// CONTROLADOR DE NOTIFICACIONES
// ============================================
const { Transaction, Category, Goal, Budget } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// ==================== OBTENER TODAS LAS NOTIFICACIONES ====================
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const notifications = [];
    let notificationId = 1;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // ========== 1. ALERTAS DE METAS ==========
    const goals = await Goal.findAll({
      where: {
        userId,
        status: 'active'
      }
    });

    for (const goal of goals) {
      const progress = goal.currentAmount && goal.targetAmount
        ? (goal.currentAmount / goal.targetAmount) * 100
        : 0;

      // Meta cerca de completarse (>90%)
      if (progress >= 90 && progress < 100) {
        notifications.push({
          id: notificationId++,
          type: 'goal',
          priority: 'high',
          title: '¡Casi logras tu meta!',
          message: `Tu meta "${goal.name}" está al ${progress.toFixed(1)}% completada`,
          icon: 'target',
          color: 'success',
          timestamp: new Date(),
          actionable: true,
          link: '/goals',
          data: { goalId: goal.id, progress }
        });
      }

      // Meta con deadline cercano (próximos 7 días)
      if (goal.deadline) {
        const daysUntilDeadline = Math.ceil((new Date(goal.deadline) - now) / (1000 * 60 * 60 * 24));

        if (daysUntilDeadline > 0 && daysUntilDeadline <= 7 && progress < 100) {
          notifications.push({
            id: notificationId++,
            type: 'goal',
            priority: daysUntilDeadline <= 3 ? 'critical' : 'high',
            title: 'Deadline de meta cercano',
            message: `Tu meta "${goal.name}" vence en ${daysUntilDeadline} día${daysUntilDeadline > 1 ? 's' : ''}`,
            icon: 'clock',
            color: 'warning',
            timestamp: new Date(),
            actionable: true,
            link: '/goals',
            data: { goalId: goal.id, daysRemaining: daysUntilDeadline }
          });
        }

        // Meta vencida
        if (daysUntilDeadline < 0 && progress < 100) {
          notifications.push({
            id: notificationId++,
            type: 'goal',
            priority: 'critical',
            title: 'Meta vencida',
            message: `Tu meta "${goal.name}" venció hace ${Math.abs(daysUntilDeadline)} día${Math.abs(daysUntilDeadline) > 1 ? 's' : ''}`,
            icon: 'alert-circle',
            color: 'error',
            timestamp: new Date(),
            actionable: true,
            link: '/goals',
            data: { goalId: goal.id, daysOverdue: Math.abs(daysUntilDeadline) }
          });
        }
      }
    }

    // ========== 2. ALERTAS DE PRESUPUESTO ==========
    const budgets = await Budget.findAll({
      where: {
        userId,
        isActive: true
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color']
      }]
    });

    for (const budget of budgets) {
      // Calcular gasto actual del mes en la categoría
      const currentSpending = await Transaction.sum('amount', {
        where: {
          userId,
          categoryId: budget.categoryId,
          type: 'expense',
          isActive: true,
          date: {
            [Op.between]: [startOfMonth, endOfMonth]
          }
        }
      }) || 0;

      const percentage = budget.limit > 0 ? (currentSpending / budget.limit) * 100 : 0;

      // Presupuesto excedido (>100%)
      if (percentage > 100) {
        notifications.push({
          id: notificationId++,
          type: 'budget',
          priority: 'critical',
          title: '¡Presupuesto excedido!',
          message: `Excediste el presupuesto de "${budget.category?.name || 'Sin categoría'}" por ${percentage.toFixed(0)}%`,
          icon: 'alert-triangle',
          color: 'error',
          timestamp: new Date(),
          actionable: true,
          link: '/budget',
          data: { budgetId: budget.id, percentage, spent: currentSpending, limit: budget.limit }
        });
      }
      // Presupuesto cerca del límite (>80%)
      else if (percentage >= 80) {
        notifications.push({
          id: notificationId++,
          type: 'budget',
          priority: 'high',
          title: 'Presupuesto cerca del límite',
          message: `Has usado el ${percentage.toFixed(0)}% del presupuesto de "${budget.category?.name || 'Sin categoría'}"`,
          icon: 'alert-circle',
          color: 'warning',
          timestamp: new Date(),
          actionable: true,
          link: '/budget',
          data: { budgetId: budget.id, percentage, spent: currentSpending, limit: budget.limit }
        });
      }
    }

    // ========== 3. INSIGHTS IMPORTANTES (de analysisController) ==========
    // Reutilizar la lógica del analysisController para obtener insights
    const currentMonthTransactions = await Transaction.findAll({
      where: {
        userId,
        isActive: true,
        date: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      }
    });

    const currentIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const currentExpense = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const savingsRate = currentIncome > 0 ? ((currentIncome - currentExpense) / currentIncome) * 100 : 0;

    // Tasa de ahorro baja (<10%)
    if (savingsRate < 10 && currentIncome > 0) {
      notifications.push({
        id: notificationId++,
        type: 'insight',
        priority: 'high',
        title: 'Tasa de ahorro baja',
        message: `Tu tasa de ahorro es solo del ${savingsRate.toFixed(1)}%. Considera reducir gastos`,
        icon: 'trending-down',
        color: 'warning',
        timestamp: new Date(),
        actionable: true,
        link: '/analysis',
        data: { savingsRate }
      });
    }

    // Comparar con mes anterior para detectar aumentos de gastos
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const previousMonthTransactions = await Transaction.findAll({
      where: {
        userId,
        isActive: true,
        date: {
          [Op.between]: [previousMonth, endOfPreviousMonth]
        }
      }
    });

    const previousExpense = previousMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    if (previousExpense > 0) {
      const expenseChange = ((currentExpense - previousExpense) / previousExpense) * 100;

      if (expenseChange > 20) {
        notifications.push({
          id: notificationId++,
          type: 'insight',
          priority: 'critical',
          title: 'Aumento significativo en gastos',
          message: `Tus gastos aumentaron ${expenseChange.toFixed(0)}% respecto al mes anterior`,
          icon: 'trending-up',
          color: 'error',
          timestamp: new Date(),
          actionable: true,
          link: '/analysis',
          data: { expenseChange, currentExpense, previousExpense }
        });
      }
    }

    // Ordenar por prioridad
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    notifications.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    res.json({
      message: 'Notificaciones obtenidas exitosamente',
      notifications,
      summary: {
        total: notifications.length,
        critical: notifications.filter(n => n.priority === 'critical').length,
        high: notifications.filter(n => n.priority === 'high').length,
        unread: notifications.length // Por ahora todas son "no leídas"
      }
    });

  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({
      error: 'Error al obtener notificaciones',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== MARCAR NOTIFICACIÓN COMO LEÍDA ====================
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    // Por ahora, solo retornar success
    // En el futuro, podríamos guardar esto en una tabla de notificaciones leídas
    res.json({
      message: 'Notificación marcada como leída',
      notificationId
    });

  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({
      error: 'Error al marcar notificación',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
