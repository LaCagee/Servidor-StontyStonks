import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Target, TrendingUp, CreditCard, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { formatCLP, formatPercentage } from '../utils/currency';

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [goals, setGoals] = useState([]);
  const [previousMonthData, setPreviousMonthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'https://stonky-backend.blackdune-587dd75b.westus3.azurecontainerapps.io'}/api`;

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  };

  const apiFetch = async (endpoint) => {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  };

  const calculateMonthComparison = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  const loadRealData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación. Por favor, inicia sesión primero.');
      }

      console.log('🚀 Iniciando carga de datos del dashboard...');

      // Cargar todos los datos en paralelo
      const [dashboardResult, transactionsResult, monthlyTrendResult, goalsResult] = await Promise.all([
        apiFetch('/dashboard/overview'),
        apiFetch('/transactions?page=1&limit=5&sort=date:desc'),
        apiFetch('/dashboard/monthly-trend?months=6'),
        apiFetch('/goals')
      ]);

      setDashboardData(dashboardResult.overview);
      setTransactions(transactionsResult.transactions || []);
      setMonthlyTrend(monthlyTrendResult.trend || []);
      
      // Filtrar y contar metas activas
      const activeGoals = (goalsResult.goals || []).filter(g => g.status === 'active');
      setGoals(activeGoals);

      // Calcular progreso promedio de metas activas
      const avgProgress = activeGoals.length > 0
        ? (activeGoals.reduce((acc, g) => acc + (g.progress?.percentage || 0), 0) / activeGoals.length).toFixed(0)
        : 0;

      setPreviousMonthData({
        avgProgress
      });

    } catch (err) {
      console.error('❌ Error cargando datos:', err);
      
      let errorMessage = 'Error al cargar los datos del dashboard';
      
      if (err.message.includes('Failed to fetch')) {
        errorMessage = `No se puede conectar con el servidor backend. Por favor verifica que esté ejecutándose en ${import.meta.env.VITE_API_URL || 'https://stonky-backend.blackdune-587dd75b.westus3.azurecontainerapps.io'}`;
      } else if (err.message.includes('HTTP error')) {
        errorMessage = `Error del servidor: ${err.message}`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealData();
  }, []);

  const calculateBalances = () => {
    if (dashboardData) {
      return {
        balance: dashboardData.balance?.currentBalance || 0,
        income: dashboardData.currentMonth?.income || 0,
        expenses: dashboardData.currentMonth?.expense || 0,
        previousIncome: dashboardData.balance?.totalIncome || 0,
        previousExpense: dashboardData.balance?.totalExpense || 0
      };
    } else {
      const balance = transactions.reduce((acc, t) => 
        t.type === 'income' ? acc + t.amount : acc - t.amount, 0
      );

      const income = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

      const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

      return { balance, income, expenses, previousIncome: 0, previousExpense: 0 };
    }
  };

  const { balance, income, expenses, previousIncome, previousExpense } = calculateBalances();

  // Calcular cambios porcentuales
  const incomeChange = calculateMonthComparison(income, previousIncome);
  const expenseChange = calculateMonthComparison(expenses, previousExpense);
  const balanceChange = calculateMonthComparison(balance, previousIncome - previousExpense);

  if (loading) {
    return (
      <MainLayout title="Panel Principal" balance={0}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando tu dashboard financiero...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Panel Principal" balance={0}>
        <div className="card bg-red-900 bg-opacity-20 border-red-700 p-8 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
            <AlertCircle className="w-7 h-7" />
            Error de Conexión
          </h3>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={loadRealData}
            className="btn btn-primary flex items-center gap-2 justify-center"
          >
            <RefreshCw className="w-5 h-5" />
            Reintentar
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Panel Principal" balance={balance}>
      <div className="space-y-6">
        {/* Header de Bienvenida */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Bienvenido de vuelta
            </h2>
            <p className="text-gray-400">Aquí está tu resumen financiero</p>
          </div>
          <div className="text-gray-400 text-sm md:text-base">
            {new Date().toLocaleDateString('es-CL', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {/* Grid de Métricas Principales - Responsive */}
        <div className="cards-grid cards-grid-4">
          {/* Saldo Total */}
          <div className="stat-card card-stonky-primary">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="card-label">Saldo Total</p>
                <p className="card-value">
                  {formatCLP(balance)}
                </p>
                <div className={`card-change mt-3 ${parseFloat(balanceChange) >= 0 ? 'card-change-positive' : 'card-change-negative'}`}>
                  <span>{parseFloat(balanceChange) >= 0 ? '↑' : '↓'}</span>
                  {parseFloat(balanceChange) >= 0 ? '+' : ''}{formatPercentage(balanceChange)} vs mes anterior
                </div>
              </div>
              <div className="card-icon">
                <DollarSign />
              </div>
            </div>
          </div>

          {/* Ingresos */}
          <div className="stat-card card-stonky-success">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="card-label">Ingresos</p>
                <p className="card-value">
                  {formatCLP(income)}
                </p>
                <div className={`card-change mt-3 ${parseFloat(incomeChange) >= 0 ? 'card-change-positive' : 'card-change-negative'}`}>
                  <span>{parseFloat(incomeChange) >= 0 ? '↑' : '↓'}</span>
                  {parseFloat(incomeChange) >= 0 ? '+' : ''}{formatPercentage(incomeChange)} vs mes anterior
                </div>
              </div>
              <div className="card-icon">
                <TrendingUp />
              </div>
            </div>
          </div>

          {/* Gastos */}
          <div className="stat-card card-stonky-danger">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="card-label">Gastos</p>
                <p className="card-value">
                  {formatCLP(expenses)}
                </p>
                <div className={`card-change mt-3 ${parseFloat(expenseChange) <= 0 ? 'card-change-positive' : 'card-change-negative'}`}>
                  <span>{parseFloat(expenseChange) <= 0 ? '↓' : '↑'}</span>
                  {parseFloat(expenseChange) >= 0 ? '+' : ''}{formatPercentage(expenseChange)} vs mes anterior
                </div>
              </div>
              <div className="card-icon">
                <CreditCard />
              </div>
            </div>
          </div>

          {/* Metas Activas */}
          <div className="stat-card card-stonky-info">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="card-label">Metas Activas</p>
                <p className="card-value">{goals.length}</p>
                <div className="card-change card-change-neutral mt-3">
                  {formatPercentage(previousMonthData?.avgProgress || 0)} completado promedio
                </div>
              </div>
              <div className="card-icon">
                <Target />
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Contenido - Gráfico y Transacciones */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Resumen Mensual - Ocupa 2 columnas en desktop */}
          <div className="lg:col-span-2">
            <Card title="Resumen Mensual" className="h-full">
              {monthlyTrend && monthlyTrend.length > 0 ? (
                <div className="space-y-4">
                  {/* Indicadores de totales */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-green-500 bg-opacity-10 border border-green-500 border-opacity-20 rounded-lg p-3">
                      <p className="text-xs text-green-400 mb-1">Ingresos Totales</p>
                      <p className="text-lg font-bold text-green-400">
                        {formatCLP(monthlyTrend.reduce((sum, m) => sum + (m.income || 0), 0))}
                      </p>
                    </div>
                    <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-20 rounded-lg p-3">
                      <p className="text-xs text-red-400 mb-1">Gastos Totales</p>
                      <p className="text-lg font-bold text-red-400">
                        {formatCLP(monthlyTrend.reduce((sum, m) => sum + (m.expense || 0), 0))}
                      </p>
                    </div>
                    <div className="bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-20 rounded-lg p-3">
                      <p className="text-xs text-blue-400 mb-1">Balance</p>
                      <p className="text-lg font-bold text-blue-400">
                        {formatCLP(monthlyTrend.reduce((sum, m) => sum + ((m.income || 0) - (m.expense || 0)), 0))}
                      </p>
                    </div>
                  </div>

                  {/* Gráfico de barras profesional */}
                  <div className="bg-slate-800 bg-opacity-40 rounded-lg p-6 border border-slate-600">
                    <div className="flex items-end justify-between gap-4 h-80 mb-4">
                      {monthlyTrend.map((month, index) => {
                        // Calcular el valor máximo global para escalar correctamente
                        const allValues = monthlyTrend.flatMap(m => [m.income || 0, m.expense || 0]);
                        const maxValue = Math.max(...allValues, 1); // Mínimo 1 para evitar división por cero

                        const incomeValue = month.income || 0;
                        const expenseValue = month.expense || 0;

                        // Calcular porcentajes con altura mínima más visible (20% en lugar de 3%)
                        const incomePercent = maxValue > 0 ? Math.max((incomeValue / maxValue) * 100, incomeValue > 0 ? 15 : 3) : 3;
                        const expensePercent = maxValue > 0 ? Math.max((expenseValue / maxValue) * 100, expenseValue > 0 ? 15 : 3) : 3;

                        const hasData = incomeValue > 0 || expenseValue > 0;

                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-3 group cursor-pointer min-w-[60px]">
                            {/* Contenedor de barras */}
                            <div className="w-full flex items-end justify-center gap-2 h-full relative px-1">
                              {/* Barra de Ingresos */}
                              <div
                                className="flex-1 max-w-[36px] bg-gradient-to-t from-green-700 via-green-500 to-green-400 rounded-t-lg hover:from-green-600 hover:via-green-400 hover:to-green-300 transition-all duration-300 shadow-xl hover:shadow-2xl relative group/bar ring-1 ring-green-500 ring-opacity-30"
                                style={{
                                  height: `${incomePercent}%`,
                                  minHeight: hasData ? '28px' : '8px',
                                  opacity: hasData ? 1 : 0.25
                                }}
                              >
                                {/* Tooltip hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/bar:block z-20">
                                  <div className="bg-slate-900 border border-green-500 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl">
                                    <p className="text-green-400 font-semibold">Ingresos</p>
                                    <p className="text-white">{formatCLP(incomeValue)}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Barra de Gastos */}
                              <div
                                className="flex-1 max-w-[36px] bg-gradient-to-t from-red-700 via-red-500 to-red-400 rounded-t-lg hover:from-red-600 hover:via-red-400 hover:to-red-300 transition-all duration-300 shadow-xl hover:shadow-2xl relative group/bar ring-1 ring-red-500 ring-opacity-30"
                                style={{
                                  height: `${expensePercent}%`,
                                  minHeight: hasData ? '28px' : '8px',
                                  opacity: hasData ? 1 : 0.25
                                }}
                              >
                                {/* Tooltip hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/bar:block z-20">
                                  <div className="bg-slate-900 border border-red-500 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl">
                                    <p className="text-red-400 font-semibold">Gastos</p>
                                    <p className="text-white">{formatCLP(expenseValue)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Etiqueta del mes */}
                            <div className="text-center">
                              <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                {month.monthName ? month.monthName.substring(0, 3) : 'N/A'}
                              </p>
                              {hasData && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {month.transactionCount || 0} trans.
                                </p>
                              )}
                            </div>

                            {/* Card de detalle en hover */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-8 hidden group-hover:block z-30 pointer-events-none">
                              <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 shadow-2xl min-w-[200px]">
                                <p className="text-sm font-bold text-white mb-3 border-b border-slate-700 pb-2">
                                  {month.monthName || 'Mes'} {month.year || ''}
                                </p>
                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-green-400">↑ Ingresos:</span>
                                    <span className="text-white font-semibold">{formatCLP(incomeValue)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-red-400">↓ Gastos:</span>
                                    <span className="text-white font-semibold">{formatCLP(expenseValue)}</span>
                                  </div>
                                  <div className="flex justify-between border-t border-slate-700 pt-2">
                                    <span className="text-blue-400">= Balance:</span>
                                    <span className={`font-bold ${incomeValue - expenseValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      {formatCLP(incomeValue - expenseValue)}
                                    </span>
                                  </div>
                                  {month.transactionCount > 0 && (
                                    <div className="flex justify-between text-gray-400 pt-1">
                                      <span>Transacciones:</span>
                                      <span>{month.transactionCount}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Leyenda */}
                    <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-700">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gradient-to-br from-green-600 to-green-400 rounded"></div>
                        <span className="text-sm text-gray-300">Ingresos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gradient-to-br from-red-600 to-red-400 rounded"></div>
                        <span className="text-sm text-gray-300">Gastos</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <TrendingUp className="w-4 h-4" />
                        <span>Últimos {monthlyTrend.length} meses</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-800 bg-opacity-30 rounded-lg border border-slate-700">
                  <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg font-medium">No hay datos de tendencia mensual disponibles</p>
                  <p className="text-gray-500 text-sm mt-2">Comienza agregando transacciones para ver tu resumen</p>
                </div>
              )}
            </Card>
          </div>

          {/* Transacciones Recientes */}
          <div>
            <Card title="Transacciones Recientes" className="h-full">
              {transactions && transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-800 bg-opacity-30 rounded-lg hover:bg-opacity-50 transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'income' 
                            ? 'bg-green-500 bg-opacity-20' 
                            : 'bg-red-500 bg-opacity-20'
                        }`}>
                          {transaction.type === 'income' ? (
                            <ArrowUpCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <ArrowDownCircle className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {transaction.description || transaction.category}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(transaction.date).toLocaleDateString('es-CL')}
                          </p>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold whitespace-nowrap ml-2 ${
                        transaction.type === 'income'
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCLP(transaction.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">No hay transacciones disponibles</p>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Sección de Análisis - Solo en desktop si tenemos datos */}
        {monthlyTrend && monthlyTrend.length > 0 && (
          <div className="cards-grid cards-grid-4">
            <div className="info-card">
              <p className="card-label">Promedio Ingresos</p>
              <p className="card-value text-green-400">
                {formatCLP(
                  monthlyTrend.reduce((acc, m) => acc + (m.income || 0), 0) / monthlyTrend.length
                )}
              </p>
            </div>
            <div className="info-card">
              <p className="card-label">Promedio Gastos</p>
              <p className="card-value text-red-400">
                {formatCLP(
                  monthlyTrend.reduce((acc, m) => acc + (m.expense || 0), 0) / monthlyTrend.length
                )}
              </p>
            </div>
            <div className="info-card">
              <p className="card-label">Total Período</p>
              <p className="card-value text-blue-400">
                {formatCLP(
                  monthlyTrend.reduce((acc, m) => acc + ((m.income || 0) - (m.expense || 0)), 0)
                )}
              </p>
            </div>
            <div className="info-card">
              <p className="card-label">Tasa Ahorro</p>
              <p className="card-value text-yellow-400">
                {formatPercentage(
                  (monthlyTrend.reduce((acc, m) => acc + ((m.income || 0) - (m.expense || 0)), 0) /
                  monthlyTrend.reduce((acc, m) => acc + (m.income || 0), 0)) * 100
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}