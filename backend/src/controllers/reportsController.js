// ============================================
// CONTROLADOR DE REPORTES
// ============================================
const { Transaction, Category } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// ==================== OBTENER RESUMEN DE REPORTES ====================
exports.getReportSummary = async (req, res) => {
  try {
    const userId = req.userId;
    const { period = 'month', startDate, endDate } = req.query;

    // Calcular rango de fechas según el periodo
    let start, end;
    const now = new Date();

    if (period === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else if (period === 'week') {
      const dayOfWeek = now.getDay();
      start = new Date(now);
      start.setDate(now.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'quarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
    } else if (period === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
    } else {
      // Por defecto: mes actual
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Calcular periodo anterior del mismo tamaño para comparación
    const periodDuration = end.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - periodDuration);
    const previousEnd = new Date(start.getTime() - 1);

    // Obtener transacciones del periodo actual
    const currentTransactions = await Transaction.findAll({
      where: {
        userId,
        isActive: true,
        date: {
          [Op.between]: [start, end]
        }
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color']
      }],
      order: [['date', 'ASC']]
    });

    // Obtener transacciones del periodo anterior
    const previousTransactions = await Transaction.findAll({
      where: {
        userId,
        isActive: true,
        date: {
          [Op.between]: [previousStart, previousEnd]
        }
      }
    });

    // Calcular totales periodo actual
    const totalIncome = currentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpenses = currentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    // Calcular totales periodo anterior
    const previousIncome = previousTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const previousExpenses = previousTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Calcular crecimiento
    const incomeGrowth = previousIncome > 0
      ? ((totalIncome - previousIncome) / previousIncome) * 100
      : 0;

    const expenseGrowth = previousExpenses > 0
      ? ((totalExpenses - previousExpenses) / previousExpenses) * 100
      : 0;

    // Agrupar gastos por categoría
    const expensesByCategory = {};
    currentTransactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const categoryName = transaction.category?.name || 'Sin categoría';
        if (!expensesByCategory[categoryName]) {
          expensesByCategory[categoryName] = {
            amount: 0,
            count: 0
          };
        }
        expensesByCategory[categoryName].amount += parseFloat(transaction.amount);
        expensesByCategory[categoryName].count++;
      });

    // Convertir a array y agregar porcentajes
    const categoryArray = Object.entries(expensesByCategory)
      .map(([category, data]) => ({
        category,
        amount: parseFloat(data.amount.toFixed(2)),
        percentage: totalExpenses > 0
          ? parseFloat(((data.amount / totalExpenses) * 100).toFixed(1))
          : 0,
        trend: 0 // Simplificado, se puede mejorar comparando con periodo anterior
      }))
      .sort((a, b) => b.amount - a.amount);

    // Tendencia mensual (últimos 3 meses o según periodo)
    const monthlyTrend = [];
    const monthsToShow = period === 'year' ? 12 : 3;

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const monthTransactions = currentTransactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= monthStart && tDate <= monthEnd;
      });

      const monthIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const monthExpense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      monthlyTrend.push({
        month: monthDate.toLocaleString('es-ES', { month: 'short' }).charAt(0).toUpperCase() +
               monthDate.toLocaleString('es-ES', { month: 'short' }).slice(1, 3),
        income: parseFloat(monthIncome.toFixed(2)),
        expenses: parseFloat(monthExpense.toFixed(2)),
        savings: parseFloat((monthIncome - monthExpense).toFixed(2))
      });
    }

    // Top categorías para gráfico
    const topCategories = categoryArray.slice(0, 3).map((item, index) => {
      const colors = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6'];
      return {
        name: item.category,
        value: item.amount,
        color: colors[index % colors.length]
      };
    });

    res.json({
      message: 'Reporte obtenido exitosamente',
      period: {
        type: period,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      },
      summary: {
        totalIncome: parseFloat(totalIncome.toFixed(2)),
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        netSavings: parseFloat(netSavings.toFixed(2)),
        savingsRate: parseFloat(savingsRate.toFixed(1)),
        incomeGrowth: parseFloat(incomeGrowth.toFixed(1)),
        expenseGrowth: parseFloat(expenseGrowth.toFixed(1))
      },
      expensesByCategory: categoryArray,
      monthlyTrend,
      topCategories
    });

  } catch (error) {
    console.error('Error al obtener reporte:', error);
    res.status(500).json({
      error: 'Error al obtener reporte',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== EXPORTAR REPORTE (PLACEHOLDER) ====================
exports.exportReport = async (req, res) => {
  try {
    const { format = 'pdf' } = req.query;

    // TODO: Implementar generación de PDF/Excel
    // Por ahora solo devolvemos un mensaje

    res.json({
      message: `Exportación en formato ${format} no implementada aún`,
      note: 'Esta funcionalidad estará disponible próximamente'
    });

  } catch (error) {
    console.error('Error al exportar reporte:', error);
    res.status(500).json({
      error: 'Error al exportar reporte',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
