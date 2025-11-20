// ============================================
// CONTROLADOR DE ANÁLISIS
// ============================================
const { Transaction, Category } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// ==================== OBTENER INSIGHTS FINANCIEROS ====================
exports.getInsights = async (req, res) => {
  try {
    const userId = req.userId;

    // Calcular fechas del mes actual y anterior
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Obtener transacciones del mes actual
    const currentMonthTransactions = await Transaction.findAll({
      where: {
        userId,
        isActive: true,
        date: {
          [Op.between]: [startOfCurrentMonth, endOfCurrentMonth]
        }
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color']
      }]
    });

    // Obtener transacciones del mes anterior
    const previousMonthTransactions = await Transaction.findAll({
      where: {
        userId,
        isActive: true,
        date: {
          [Op.between]: [startOfPreviousMonth, endOfPreviousMonth]
        }
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color']
      }]
    });

    // Calcular totales mes actual
    const currentIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const currentExpense = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Calcular totales mes anterior
    const previousIncome = previousMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const previousExpense = previousMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Agrupar gastos por categoría (mes actual)
    const expensesByCategory = {};
    currentMonthTransactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const categoryName = transaction.category?.name || 'Sin categoría';
        if (!expensesByCategory[categoryName]) {
          expensesByCategory[categoryName] = {
            amount: 0,
            count: 0,
            category: transaction.category
          };
        }
        expensesByCategory[categoryName].amount += parseFloat(transaction.amount);
        expensesByCategory[categoryName].count++;
      });

    // Generar insights
    const insights = [];
    let insightId = 1;

    // 1. Insight de ahorro - comparar ingresos vs gastos
    const currentSavings = currentIncome - currentExpense;
    const previousSavings = previousIncome - previousExpense;
    const savingsRate = currentIncome > 0 ? (currentSavings / currentIncome) * 100 : 0;

    if (savingsRate > 20) {
      insights.push({
        id: insightId++,
        type: 'trend_analysis',
        title: 'Excelente Tasa de Ahorro',
        message: `Tu tasa de ahorro es del ${savingsRate.toFixed(1)}%, ¡estás por encima del promedio!`,
        amount: 0,
        category: 'General',
        confidence: 0.95,
        actionable: false,
        priority: 'low',
        timeframe: 'Este mes',
        impact: 'Positivo',
        recommendation: 'Mantén estos buenos hábitos y considera invertir tus ahorros'
      });
    } else if (savingsRate < 10 && currentIncome > 0) {
      const potentialSavings = currentIncome * 0.15 - currentSavings;
      insights.push({
        id: insightId++,
        type: 'savings_opportunity',
        title: 'Oportunidad de Ahorro',
        message: `Tu tasa de ahorro es solo del ${savingsRate.toFixed(1)}%. Podrías mejorar tu situación financiera`,
        amount: Math.max(0, potentialSavings),
        category: 'General',
        confidence: 0.85,
        actionable: true,
        priority: 'high',
        timeframe: '1 mes',
        impact: 'Alto',
        recommendation: 'Intenta ahorrar al menos el 15% de tus ingresos mensuales'
      });
    }

    // 2. Alertas por categoría - identificar categorías con gasto alto
    const sortedCategories = Object.entries(expensesByCategory)
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        percentage: currentExpense > 0 ? (data.amount / currentExpense) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    if (sortedCategories.length > 0 && sortedCategories[0].percentage > 35) {
      insights.push({
        id: insightId++,
        type: 'spending_alert',
        title: 'Concentración de Gastos',
        message: `${sortedCategories[0].percentage.toFixed(1)}% de tus gastos están en ${sortedCategories[0].name}`,
        amount: sortedCategories[0].amount,
        category: sortedCategories[0].name,
        confidence: 0.90,
        actionable: true,
        priority: sortedCategories[0].percentage > 50 ? 'critical' : 'high',
        timeframe: 'Inmediato',
        impact: 'Medio',
        recommendation: `Revisa tus gastos en ${sortedCategories[0].name} para identificar oportunidades de reducción`
      });
    }

    // 3. Comparación mes a mes
    if (previousExpense > 0) {
      const expenseChange = ((currentExpense - previousExpense) / previousExpense) * 100;

      if (expenseChange > 20) {
        insights.push({
          id: insightId++,
          type: 'spending_alert',
          title: 'Aumento en Gastos',
          message: `Tus gastos aumentaron un ${expenseChange.toFixed(1)}% respecto al mes anterior`,
          amount: currentExpense - previousExpense,
          category: 'General',
          confidence: 0.88,
          actionable: true,
          priority: 'critical',
          timeframe: 'Inmediato',
          impact: 'Alto',
          recommendation: 'Revisa tus gastos recientes para identificar cambios en tus hábitos'
        });
      } else if (expenseChange < -10) {
        insights.push({
          id: insightId++,
          type: 'trend_analysis',
          title: 'Reducción de Gastos',
          message: `Redujiste tus gastos en un ${Math.abs(expenseChange).toFixed(1)}% este mes`,
          amount: 0,
          category: 'General',
          confidence: 0.92,
          actionable: false,
          priority: 'low',
          timeframe: 'Este mes',
          impact: 'Positivo',
          recommendation: 'Excelente trabajo, continúa con esta tendencia'
        });
      }
    }

    // 4. Análisis de patrones de gasto frecuente
    const categoriesWithHighFrequency = Object.entries(expensesByCategory)
      .filter(([_, data]) => data.count >= 10)
      .map(([name, data]) => ({
        name,
        count: data.count,
        averageAmount: data.amount / data.count
      }));

    if (categoriesWithHighFrequency.length > 0) {
      const topFrequent = categoriesWithHighFrequency[0];
      insights.push({
        id: insightId++,
        type: 'trend_analysis',
        title: 'Patrón de Gasto Identificado',
        message: `Realizaste ${topFrequent.count} transacciones en ${topFrequent.name} este mes`,
        amount: topFrequent.averageAmount,
        category: topFrequent.name,
        confidence: 0.87,
        actionable: true,
        priority: 'medium',
        timeframe: '1 mes',
        impact: 'Medio',
        recommendation: `Promedio de ${topFrequent.averageAmount.toFixed(0)} por transacción. Considera agrupar compras para ahorrar`
      });
    }

    // 5. Si no hay insights, dar uno genérico positivo
    if (insights.length === 0) {
      insights.push({
        id: insightId++,
        type: 'trend_analysis',
        title: 'Estado Financiero Estable',
        message: 'Tus finanzas se mantienen estables este mes',
        amount: 0,
        category: 'General',
        confidence: 0.75,
        actionable: false,
        priority: 'low',
        timeframe: 'Este mes',
        impact: 'Neutro',
        recommendation: 'Continúa monitoreando tus gastos regularmente'
      });
    }

    res.json({
      message: 'Insights obtenidos exitosamente',
      insights: insights.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
      summary: {
        totalInsights: insights.length,
        actionableInsights: insights.filter(i => i.actionable).length,
        criticalAlerts: insights.filter(i => i.priority === 'critical').length,
        potentialSavings: insights.reduce((sum, i) => sum + (i.amount || 0), 0)
      }
    });

  } catch (error) {
    console.error('Error al obtener insights:', error);
    res.status(500).json({
      error: 'Error al obtener insights',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
