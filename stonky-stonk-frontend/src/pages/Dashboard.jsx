import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Target, TrendingUp, CreditCard } from 'lucide-react';

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTransactions([
        { id: 1, type: 'expense', amount: 45000, description: 'Supermercado', category: 'Alimentación', date: '2024-01-15' },
        { id: 2, type: 'income', amount: 150000, description: 'Salario', category: 'Trabajo', date: '2024-01-01' },
        { id: 3, type: 'expense', amount: 12000, description: 'Uber', category: 'Transporte', date: '2024-01-10' },
        { id: 4, type: 'income', amount: 25000, description: 'Freelance', category: 'Trabajo', date: '2024-01-05' },
        { id: 5, type: 'expense', amount: 35000, description: 'Restaurante', category: 'Entretenimiento', date: '2024-01-12' }
      ]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  const balance = transactions.reduce((acc, t) => 
    t.type === 'income' ? acc + t.amount : acc - t.amount, 0
  );

  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

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
          {/* Gráfico de Resumen */}
          <Card title="Resumen Mensual" className="chart-section">
            <div className="chart-placeholder">
              <div className="chart-bars">
                <div className="chart-bar income" style={{ height: '80%' }}></div>
                <div className="chart-bar expense" style={{ height: '60%' }}></div>
                <div className="chart-bar income" style={{ height: '70%' }}></div>
                <div className="chart-bar expense" style={{ height: '50%' }}></div>
                <div className="chart-bar income" style={{ height: '90%' }}></div>
              </div>
              <div className="chart-labels">
                <span>Ene</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Abr</span>
                <span>May</span>
              </div>
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color income"></div>
                <span>Ingresos</span>
              </div>
              <div className="legend-item">
                <div className="legend-color expense"></div>
                <span>Gastos</span>
              </div>
            </div>
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
                      <span className="transaction-category">{transaction.category}</span>
                      <span className="transaction-date">{transaction.date}</span>
                    </div>
                  </div>
                </div>
              ))}
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
              <div className="category-item">
                <div className="category-info">
                  <span className="category-name">Alimentación</span>
                  <span className="category-amount">$45.000</span>
                </div>
                <div className="category-bar">
                  <div className="category-fill" style={{ width: '35%' }}></div>
                </div>
              </div>
              <div className="category-item">
                <div className="category-info">
                  <span className="category-name">Transporte</span>
                  <span className="category-amount">$12.000</span>
                </div>
                <div className="category-bar">
                  <div className="category-fill" style={{ width: '15%' }}></div>
                </div>
              </div>
              <div className="category-item">
                <div className="category-info">
                  <span className="category-name">Entretenimiento</span>
                  <span className="category-amount">$35.000</span>
                </div>
                <div className="category-bar">
                  <div className="category-fill" style={{ width: '25%' }}></div>
                </div>
              </div>
              <div className="category-item">
                <div className="category-info">
                  <span className="category-name">Servicios</span>
                  <span className="category-amount">$28.000</span>
                </div>
                <div className="category-bar">
                  <div className="category-fill" style={{ width: '20%' }}></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}