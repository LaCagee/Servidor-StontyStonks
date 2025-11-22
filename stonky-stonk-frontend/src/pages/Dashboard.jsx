// aca traemos las cosas de react que necesitamos
import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import ExpensesPieChart from '../components/charts/ExpensesPieChart';
import MonthlyTrendChart from '../components/charts/MonthlyTrendChart';
// estos son los iconos que usamos pa que se vea bonito
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Target, TrendingUp, CreditCard, AlertCircle, RefreshCw, PieChart } from 'lucide-react';
import axios from 'axios';
// esto es pa formatear la plata con la moneda del usuario
import { formatCLP, formatPercentage } from '../utils/currency'; // mantener pa retrocompatibilidad
import { useSettings } from '../context/SettingsContext'; // pa usar moneda del usuario

export default function Dashboard() {
  // usar el contexto de configuraciones pa formatear con la moneda correcta
  const { formatMoney, formatPercentage: formatPercent } = useSettings();

  // aca guardamos toda la info que necesitamos mostrar
  const [transactions, setTransactions] = useState([]); // las transacciones del usuario
  const [dashboardData, setDashboardData] = useState(null); // info general del dashboard
  const [monthlyTrend, setMonthlyTrend] = useState([]); // datos de los últimos 6 meses
  const [expensesByCategory, setExpensesByCategory] = useState([]); // gastos por categoría pa el gráfico pastel
  const [goals, setGoals] = useState([]); // las metas que tiene el usuario
  const [previousMonthData, setPreviousMonthData] = useState(null); // datos del mes pasado pa comparar
  const [loading, setLoading] = useState(true); // pa mostrar el spinner mientras carga
  const [error, setError] = useState(null); // pa cuando algo sale mal jaja

  // la URL del backend, si no hay variable de entorno usa la de azure
  const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'https://stonky-backend.blackdune-587dd75b.westus3.azurecontainerapps.io'}/api`;

  // esta funcion agarra el token pa autenticarnos con el backend
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  };

  // funcion reutilizable pa hacer fetch al backend (pa no repetir codigo)
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

  // calcula cuanto cambió algo comparado con el mes anterior (en porcentaje)
  const calculateMonthComparison = (current, previous) => {
    if (!previous || previous === 0) return 0; // si no hay dato anterior, retorna 0
    return (((current - previous) / previous) * 100).toFixed(1); // formula del porcentaje
  };

  // esta funcion carga todos los datos del dashboard desde el backend
  const loadRealData = async () => {
    try {
      setLoading(true); // mostramos el spinner
      setError(null); // limpiamos cualquier error anterior

      // verificamos que el usuario esté logueado
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación. Por favor, inicia sesión primero.');
      }

      console.log('🚀 Iniciando carga de datos del dashboard...');

      // calcular fechas del mes actual pa el gráfico pastel
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      // aca traemos todos los datos al mismo tiempo pa que sea mas rapido (Promise.all es la clave)
      const [dashboardResult, transactionsResult, monthlyTrendResult, goalsResult, categoryResult] = await Promise.all([
        apiFetch('/dashboard/overview'), // resumen general
        apiFetch('/transactions?page=1&limit=5&sort=date:desc'), // últimas 5 transacciones
        apiFetch('/dashboard/monthly-trend?months=6'), // datos de los últimos 6 meses
        apiFetch('/goals'), // todas las metas
        apiFetch(`/dashboard/by-category?startDate=${startDate}&endDate=${endDate}`) // gastos por categoría del mes actual
      ]);

      // guardamos los datos en los states
      setDashboardData(dashboardResult.overview);
      setTransactions(transactionsResult.transactions || []);
      setMonthlyTrend(monthlyTrendResult.trend || []);
      setExpensesByCategory(categoryResult.categories || []);

      // filtramos solo las metas que están activas (no las completadas ni canceladas)
      const activeGoals = (goalsResult.goals || []).filter(g => g.status === 'active');
      setGoals(activeGoals);

      // calculamos el promedio de progreso de todas las metas activas
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
                  {formatMoney(balance)}
                </p>
                <div className={`card-change mt-3 ${parseFloat(balanceChange) >= 0 ? 'card-change-positive' : 'card-change-negative'}`}>
                  <span>{parseFloat(balanceChange) >= 0 ? '↑' : '↓'}</span>
                  {parseFloat(balanceChange) >= 0 ? '+' : ''}{formatPercent(balanceChange)} vs mes anterior
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
                  {formatMoney(income)}
                </p>
                <div className={`card-change mt-3 ${parseFloat(incomeChange) >= 0 ? 'card-change-positive' : 'card-change-negative'}`}>
                  <span>{parseFloat(incomeChange) >= 0 ? '↑' : '↓'}</span>
                  {parseFloat(incomeChange) >= 0 ? '+' : ''}{formatPercent(incomeChange)} vs mes anterior
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
                  {formatMoney(expenses)}
                </p>
                <div className={`card-change mt-3 ${parseFloat(expenseChange) <= 0 ? 'card-change-positive' : 'card-change-negative'}`}>
                  <span>{parseFloat(expenseChange) <= 0 ? '↓' : '↑'}</span>
                  {parseFloat(expenseChange) >= 0 ? '+' : ''}{formatPercent(expenseChange)} vs mes anterior
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
                  {formatPercent(previousMonthData?.avgProgress || 0)} completado promedio
                </div>
              </div>
              <div className="card-icon">
                <Target />
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico Pastel de Gastos por Categoría */}
        {expensesByCategory && expensesByCategory.length > 0 && (
          <Card title="Gastos por Categoría (Este Mes)" icon={<PieChart className="card-icon" />}>
            <ExpensesPieChart data={expensesByCategory} />
          </Card>
        )}

        {/* Sección de Contenido - Gráfico y Transacciones */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Resumen Mensual - Ocupa 2 columnas en desktop */}
          <div className="lg:col-span-2">
            <Card title="Tendencia Mensual (Últimos 6 Meses)" className="h-full">
              <MonthlyTrendChart data={monthlyTrend} />
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
                        {transaction.type === 'income' ? '+' : '-'}{formatMoney(transaction.amount)}
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
                {formatMoney(
                  monthlyTrend.reduce((acc, m) => acc + (m.income || 0), 0) / monthlyTrend.length
                )}
              </p>
            </div>
            <div className="info-card">
              <p className="card-label">Promedio Gastos</p>
              <p className="card-value text-red-400">
                {formatMoney(
                  monthlyTrend.reduce((acc, m) => acc + (m.expense || 0), 0) / monthlyTrend.length
                )}
              </p>
            </div>
            <div className="info-card">
              <p className="card-label">Total Período</p>
              <p className="card-value text-blue-400">
                {formatMoney(
                  monthlyTrend.reduce((acc, m) => acc + ((m.income || 0) - (m.expense || 0)), 0)
                )}
              </p>
            </div>
            <div className="info-card">
              <p className="card-label">Tasa Ahorro</p>
              <p className="card-value text-yellow-400">
                {formatPercent(
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