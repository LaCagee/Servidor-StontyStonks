import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Target, TrendingUp, CreditCard } from 'lucide-react';

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // URL base de la API
  const API_BASE_URL = 'http://localhost:3000/api';

  // Función para obtener headers de autenticación
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  };

  // Función mejorada para hacer fetch
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

  // Cargar datos de forma secuencial para mejor control
  const loadRealData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación. Por favor, inicia sesión primero.');
      }

      console.log('🚀 Iniciando carga de datos del dashboard...');

      // Cargar datos secuencialmente para mejor control de errores
      const dashboardResult = await apiFetch('/dashboard/overview');
      console.log('✅ Dashboard overview cargado:', dashboardResult);

      const transactionsResult = await apiFetch('/transactions?page=1&limit=5&sort=date:desc');
      console.log('✅ Transacciones cargadas:', transactionsResult);

      const monthlyTrendResult = await apiFetch('/dashboard/monthly-trend?months=6');
      console.log('✅ Monthly trend cargado:', monthlyTrendResult);

      // Establecer los datos
      setDashboardData(dashboardResult.overview);
      setTransactions(transactionsResult.transactions || []);
      setMonthlyTrend(monthlyTrendResult.trend || []);

    } catch (err) {
      console.error('❌ Error cargando datos:', err);
      
      let errorMessage = 'Error al cargar los datos del dashboard';
      
      if (err.message.includes('Failed to fetch')) {
        errorMessage = `
          No se puede conectar con el servidor backend. Por favor verifica:
          1. 🖥️  El backend esté ejecutándose en http://localhost:3000
          2. 🔄 El servidor esté respondiendo correctamente
          3. 🌐 No haya problemas de red o CORS
        `;
      } else if (err.message.includes('HTTP error')) {
        errorMessage = `Error del servidor: ${err.message}`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // useEffect para ejecutar loadRealData al montar el componente
  useEffect(() => {
    loadRealData();
  }, []);

  // Calcular balances
  const calculateBalances = () => {
    if (dashboardData) {
      return {
        balance: dashboardData.balance?.currentBalance || 0,
        income: dashboardData.currentMonth?.income || 0,
        expenses: dashboardData.currentMonth?.expense || 0
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

      return { balance, income, expenses };
    }
  };

  const { balance, income, expenses } = calculateBalances();

  if (loading) {
    return (
      <MainLayout title="Panel Principal" balance={0}>
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p className="loading-message">Cargando tu dashboard financiero...</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Panel Principal" balance={0}>
        <div className="error-screen">
          <h3>❌ Error de Conexión</h3>
          <p className="error-message">{error}</p>
          <div className="error-actions">
            <button onClick={loadRealData} className="btn-depth">
              🔄 Reintentar
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Panel Principal" balance={balance}>
      <div className="dashboard-wrapper">
        {/* Header con Bienvenida */}
        <div className="dashboard-header">
          <div className="welcome-section">
            <h1 className="welcome-title">Bienvenido de vuelta</h1>
            <p className="welcome-subtitle">Aquí está tu resumen financiero</p>
          </div>
          <div className="date-display">
            {new Date().toLocaleDateString('es-CL', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {/* Grid de Métricas Principales */}
        <div className="metrics-grid">
          <Card variant="stonky-primary" className="metric-card">
            <div className="metric-content">
              <div className="metric-icon-wrapper">
                <DollarSign className="metric-icon" />
              </div>
              <div className="metric-info">
                <p className="metric-label">Saldo Total</p>
                <p className="metric-value">${balance.toLocaleString('es-CL')}</p>
                <p className="metric-trend positive">+12% vs mes anterior</p>
              </div>
            </div>
          </Card>

          <Card variant="stonky-success" className="metric-card">
            <div className="metric-content">
              <div className="metric-icon-wrapper">
                <TrendingUp className="metric-icon" />
              </div>
              <div className="metric-info">
                <p className="metric-label">Ingresos</p>
                <p className="metric-value">${income.toLocaleString('es-CL')}</p>
                <p className="metric-trend positive">+8% vs mes anterior</p>
              </div>
            </div>
          </Card>

          <Card variant="stonky-warning" className="metric-card">
            <div className="metric-content">
              <div className="metric-icon-wrapper">
                <CreditCard className="metric-icon" />
              </div>
              <div className="metric-info">
                <p className="metric-label">Gastos</p>
                <p className="metric-value">${expenses.toLocaleString('es-CL')}</p>
                <p className="metric-trend negative">-5% vs mes anterior</p>
              </div>
            </div>
          </Card>

          <Card variant="stonky-info" className="metric-card">
            <div className="metric-content">
              <div className="metric-icon-wrapper">
                <Target className="metric-icon" />
              </div>
              <div className="metric-info">
                <p className="metric-label">Metas Activas</p>
                <p className="metric-value">3</p>
                <p className="metric-trend">75% completado</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sección de Gráficos y Transacciones */}
<div className="content-grid">
  {/* Gráfico de Resumen Mensual */}
  <Card title="Resumen Mensual" className="chart-section">
    {monthlyTrend && monthlyTrend.length > 0 ? (
      <div className="chart-container">
        <div className="chart-bars-container">
          <div className="chart-bars">
            {monthlyTrend.map((month, index) => {
              // Calcular alturas relativas
              const maxValue = Math.max(
                ...monthlyTrend.map(m => Math.max(m.income || 0, m.expense || 0))
              );
              
              const incomeHeight = maxValue > 0 ? ((month.income || 0) / maxValue) * 100 : 5;
              const expenseHeight = maxValue > 0 ? ((month.expense || 0) / maxValue) * 100 : 5;

              return (
                <div key={index} className="chart-column">
                  <div className="bars-wrapper">
                    <div 
                      className="bar income-bar" 
                      style={{ height: `${incomeHeight}%` }}
                      title={`${month.monthName}: Ingresos $${(month.income || 0).toLocaleString('es-CL')}`}
                    ></div>
                    <div 
                      className="bar expense-bar" 
                      style={{ height: `${expenseHeight}%` }}
                      title={`${month.monthName}: Gastos $${(month.expense || 0).toLocaleString('es-CL')}`}
                    ></div>
                  </div>
                  <div className="month-label">
                    {month.monthName ? month.monthName.substring(0, 3).toLowerCase() : `M${index + 1}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="chart-info">
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-dot income-dot"></div>
              <span>Ingresos</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot expense-dot"></div>
              <span>Gastos</span>
            </div>
          </div>
          
          <div className="chart-totals">
            <div className="total-item">
              <span className="total-label">Total Ingresos:</span>
              <span className="total-value income">${monthlyTrend.reduce((sum, month) => sum + (month.income || 0), 0).toLocaleString('es-CL')}</span>
            </div>
            <div className="total-item">
              <span className="total-label">Total Gastos:</span>
              <span className="total-value expense">${monthlyTrend.reduce((sum, month) => sum + (month.expense || 0), 0).toLocaleString('es-CL')}</span>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="chart-loading">
        <p>Cargando datos del gráfico...</p>
      </div>
    )}
  </Card>

          {/* Transacciones Recientes */}
          <Card title="Transacciones Recientes" className="transactions-section" action={
            <button className="view-all-button btn-depth">Ver todas</button>
          }>
            <div className="transactions-list">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-icon-container">
                    <div className={`transaction-icon ${transaction.type}`}>
                      {transaction.type === 'income' 
                        ? <ArrowUpCircle className="icon" />
                        : <ArrowDownCircle className="icon" />
                      }
                    </div>
                  </div>
                  <div className="transaction-details">
                    <div className="transaction-main">
                      <p className="transaction-description">{transaction.description}</p>
                      <p className={`transaction-amount ${transaction.type}`}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString('es-CL')}
                      </p>
                    </div>
                    <div className="transaction-meta">
                      <span className="transaction-category">
                        {transaction.category?.name || 'Sin categoría'}
                      </span>
                      <span className="transaction-date">
                        {new Date(transaction.date).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="no-transactions">
                  <p>No hay transacciones recientes</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sección de Metas y Estadísticas */}
        <div className="secondary-grid">
          <Card title="Metas de Ahorro" className="goals-section">
            <div className="goals-list">
              <div className="goal-item">
                <div className="goal-header">
                  <h4 className="goal-title">Viaje a Europa</h4>
                  <span className="goal-percentage">45%</span>
                </div>
                <div className="goal-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '45%' }}></div>
                  </div>
                </div>
                <div className="goal-stats">
                  <span className="goal-current">$2.250.000</span>
                  <span className="goal-target">de $5.000.000</span>
                </div>
              </div>

              <div className="goal-item">
                <div className="goal-header">
                  <h4 className="goal-title">Nueva Laptop</h4>
                  <span className="goal-percentage">60%</span>
                </div>
                <div className="goal-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '60%' }}></div>
                  </div>
                </div>
                <div className="goal-stats">
                  <span className="goal-current">$480.000</span>
                  <span className="goal-target">de $800.000</span>
                </div>
              </div>

              <div className="goal-item">
                <div className="goal-header">
                  <h4 className="goal-title">Fondo Emergencia</h4>
                  <span className="goal-percentage">30%</span>
                </div>
                <div className="goal-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '30%' }}></div>
                  </div>
                </div>
                <div className="goal-stats">
                  <span className="goal-current">$900.000</span>
                  <span className="goal-target">de $3.000.000</span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Resumen por Categoría" className="categories-section">
            <div className="categories-list">
              {dashboardData?.topCategories?.map((category, index) => (
                <div key={index} className="category-item">
                  <div className="category-info">
                    <span className="category-name">{category.categoryName}</span>
                    <span className="category-amount">${category.total?.toLocaleString('es-CL') || '0'}</span>
                  </div>
                  <div className="category-bar">
                    <div 
                      className="category-fill" 
                      style={{ 
                        width: `${category.percentage || 0}%`,
                        backgroundColor: category.categoryColor || '#ccc'
                      }}
                    ></div>
                  </div>
                </div>
              )) || (
                <div className="no-categories">
                  <p>No hay datos de categorías disponibles</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}