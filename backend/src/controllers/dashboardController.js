// ============================================
// CONTROLADOR DE DASHBOARD 
// ============================================
const { Transaction, Category } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// ==================== OBTENER BALANCE GENERAL ====================
exports.getBalance = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Usar el método del modelo
    const balance = await Transaction.getBalance(userId);
    
    res.json({
      message: 'Balance obtenido exitosamente',
      balance: {
        income: parseFloat(balance.income.toFixed(2)),
        expense: parseFloat(balance.expense.toFixed(2)),
        balance: parseFloat(balance.balance.toFixed(2))
      }
    });
    
  } catch (error) {
    console.error('Error al obtener balance:', error);
    res.status(500).json({
      error: 'Error al obtener balance',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== RESUMEN DEL MES ACTUAL ====================
exports.getCurrentMonthSummary = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Obtener transacciones del mes actual
    const transactions = await Transaction.getCurrentMonth(userId);
    
    // Calcular totales
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const balance = income - expense;
    
    // Obtener fecha actual
    const now = new Date();
    const monthName = now.toLocaleString('es-ES', { month: 'long' });
    const year = now.getFullYear();
    
    res.json({
      message: 'Resumen del mes obtenido exitosamente',
      period: {
        month: now.getMonth() + 1,
        monthName,
        year
      },
      summary: {
        totalIncome: parseFloat(income.toFixed(2)),
        totalExpense: parseFloat(expense.toFixed(2)),
        balance: parseFloat(balance.toFixed(2)),
        transactionCount: transactions.length,
        incomeCount: transactions.filter(t => t.type === 'income').length,
        expenseCount: transactions.filter(t => t.type === 'expense').length
      }
    });
    
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({
      error: 'Error al obtener resumen',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== GASTOS POR CATEGORÍA (CORREGIDO) ====================
exports.getExpensesByCategory = async (req, res) => {
  try {
    const userId = req.userId;
    const { startDate, endDate } = req.query;
    
    // Si no se especifican fechas, usar mes actual
    const now = new Date();
    const start = startDate 
      ? new Date(startDate) 
      : new Date(now.getFullYear(), now.getMonth(), 1);
    
    const end = endDate 
      ? new Date(endDate) 
      : new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // SOLUCIÓN: Hacer consulta manual con columnas explícitas
    const summary = await Transaction.findAll({
      attributes: [
        'categoryId',
        ['type', 'transactionType'],  // ← ALIAS para evitar ambigüedad
        [sequelize.fn('SUM', sequelize.col('Transaction.amount')), 'total'],
        [sequelize.fn('COUNT', sequelize.col('Transaction.id')), 'count']
      ],
      where: {
        userId,
        date: {
          [Op.between]: [start, end]
        },
        isActive: true
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color']
      }],
      group: [
        'Transaction.category_id', 
        'Transaction.type',  
        'category.id'
      ],
      raw: false
    });
    
    // Si no hay transacciones, devolver array vacío
    if (summary.length === 0) {
      return res.json({
        message: 'No hay transacciones en este período',
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        },
        summary: {
          totalExpenses: 0,
          totalIncome: 0,
          categoriesCount: 0
        },
        categories: []
      });
    }
    
    // Procesar resultados
    const byCategory = summary.map(item => ({
      categoryId: item.categoryId,
      categoryName: item.category.name,
      categoryIcon: item.category.icon,
      categoryColor: item.category.color,
      type: item.get('transactionType'),  
      total: parseFloat(item.get('total')),
      count: parseInt(item.get('count'))
    }));
    
    // Calcular totales
    const totalExpenses = byCategory
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => sum + item.total, 0);
    
    const totalIncome = byCategory
      .filter(item => item.type === 'income')
      .reduce((sum, item) => sum + item.total, 0);
    
    // Calcular porcentajes para gastos
    const expensesWithPercentage = byCategory
      .filter(item => item.type === 'expense')
      .map(item => ({
        ...item,
        percentage: totalExpenses > 0 
          ? parseFloat(((item.total / totalExpenses) * 100).toFixed(2))
          : 0
      }))
      .sort((a, b) => b.total - a.total);
    
    res.json({
      message: 'Gastos por categoría obtenidos exitosamente',
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      },
      summary: {
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        totalIncome: parseFloat(totalIncome.toFixed(2)),
        categoriesCount: expensesWithPercentage.length
      },
      categories: expensesWithPercentage
    });
    
  } catch (error) {
    console.error('Error al obtener gastos por categoría:', error);
    res.status(500).json({
      error: 'Error al obtener gastos por categoría',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== TENDENCIA MENSUAL (ÚLTIMOS 6 MESES) ====================
exports.getMonthlyTrend = async (req, res) => {
  try {
    const userId = req.userId;
    const { months = 6 } = req.query;
    
    const monthsToShow = parseInt(months);
    
    if (monthsToShow < 1 || monthsToShow > 12) {
      return res.status(400).json({
        error: 'El número de meses debe estar entre 1 y 12'
      });
    }
    
    // Calcular rango de fechas
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Último día del mes actual
    const startDate = new Date(now.getFullYear(), now.getMonth() - (monthsToShow - 1), 1); // Primer día del mes hace N meses
    
    // Obtener transacciones del período
    const transactions = await Transaction.findAll({
      where: {
        userId,
        isActive: true,
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['date', 'ASC']]
    });
    
    // Agrupar por mes
    const monthlyData = {};
    
    for (let i = 0; i < monthsToShow; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      monthlyData[key] = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        monthName: date.toLocaleString('es-ES', { month: 'long' }),
        income: 0,
        expense: 0,
        balance: 0,
        transactionCount: 0
      };
    }
    
    // Procesar transacciones
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyData[key]) {
        const amount = parseFloat(transaction.amount);
        
        if (transaction.type === 'income') {
          monthlyData[key].income += amount;
        } else {
          monthlyData[key].expense += amount;
        }
        
        monthlyData[key].transactionCount++;
      }
    });
    
    // Calcular balances y formatear
    const trend = Object.values(monthlyData)
      .map(month => ({
        ...month,
        income: parseFloat(month.income.toFixed(2)),
        expense: parseFloat(month.expense.toFixed(2)),
        balance: parseFloat((month.income - month.expense).toFixed(2))
      }))
      .sort((a, b) => {
        // Ordenar cronológicamente
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
    
    // Calcular totales del período
    const totals = trend.reduce((acc, month) => ({
      income: acc.income + month.income,
      expense: acc.expense + month.expense,
      balance: acc.balance + month.balance,
      transactions: acc.transactions + month.transactionCount
    }), { income: 0, expense: 0, balance: 0, transactions: 0 });
    
    res.json({
      message: 'Tendencia mensual obtenida exitosamente',
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        months: monthsToShow
      },
      totals: {
        income: parseFloat(totals.income.toFixed(2)),
        expense: parseFloat(totals.expense.toFixed(2)),
        balance: parseFloat(totals.balance.toFixed(2)),
        transactions: totals.transactions
      },
      trend
    });
    
  } catch (error) {
    console.error('Error al obtener tendencia mensual:', error);
    res.status(500).json({
      error: 'Error al obtener tendencia mensual',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== RESUMEN COMPLETO DEL DASHBOARD (CORREGIDO) ====================
exports.getDashboardOverview = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Calcular fechas del mes actual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Ejecutar consultas en paralelo
    const [
      balance,
      currentMonthTransactions,
      expensesSummary
    ] = await Promise.all([
      Transaction.getBalance(userId),
      Transaction.getCurrentMonth(userId),
      
      Transaction.findAll({
        attributes: [
          'categoryId', // posible corrección aquí si falla reemplazar por 'categoryId' antes "category_id"
          ['type', 'transactionType'],
          [sequelize.fn('SUM', sequelize.col('Transaction.amount')), 'total'],
          [sequelize.fn('COUNT', sequelize.col('Transaction.id')), 'count']
        ],
        where: {
          userId,
          date: {
            [Op.between]: [startOfMonth, endOfMonth]
          },
          isActive: true,
          type: 'expense'  // ← Solo gastos
        },
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color']
        }],
        group: [
          'Transaction.category_id',
          'Transaction.type',
          'category.id'
        ],
        raw: false
      })
    ]);
    
    // Procesar resumen del mes actual
    const income = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const expense = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    // Procesar categorías (si hay datos)
    let topCategories = [];
    
    if (expensesSummary.length > 0) {
      const totalExpenses = expensesSummary
        .reduce((sum, item) => sum + parseFloat(item.get('total')), 0);
      
      topCategories = expensesSummary
        .map(item => ({
          categoryName: item.category.name,
          categoryIcon: item.category.icon,
          categoryColor: item.category.color,
          total: parseFloat(item.get('total')),
          percentage: totalExpenses > 0 
            ? parseFloat(((parseFloat(item.get('total')) / totalExpenses) * 100).toFixed(2))
            : 0
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5); // Top 5 categorías
    }
    
    res.json({
      message: 'Dashboard overview obtenido exitosamente',
      overview: {
        balance: {
          totalIncome: parseFloat(balance.income.toFixed(2)),
          totalExpense: parseFloat(balance.expense.toFixed(2)),
          currentBalance: parseFloat(balance.balance.toFixed(2))
        },
        currentMonth: {
          income: parseFloat(income.toFixed(2)),
          expense: parseFloat(expense.toFixed(2)),
          balance: parseFloat((income - expense).toFixed(2)),
          transactionCount: currentMonthTransactions.length
        },
        topCategories
      }
    });
    
  } catch (error) {
    console.error('Error al obtener dashboard overview:', error);
    res.status(500).json({
      error: 'Error al obtener resumen del dashboard',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};