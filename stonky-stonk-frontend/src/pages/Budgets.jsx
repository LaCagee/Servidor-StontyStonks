import { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import BudgetForm from '../components/budgets/BudgetForm';
import { Plus, PieChart, AlertTriangle, CheckCircle, RefreshCw, DollarSign, TrendingDown, Zap } from 'lucide-react';
import { formatCLP, formatPercentage } from '../utils/currency';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'https://stonky-backend.blackdune-587dd75b.westus3.azurecontainerapps.io'}/api`;

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);

  const token = localStorage.getItem('token');
  const axiosConfig = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  useEffect(() => {
    loadBudgets();
    loadBalance();

    // Recargar presupuestos cada 10 segundos para verificar cambios de transacciones
    const interval = setInterval(() => {
      loadBudgets();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Cargar el balance desde el dashboard
  const loadBalance = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/overview`, axiosConfig);
      if (response.data.overview?.balance) {
        setBalance(response.data.overview.balance.currentBalance || 0);
      }
    } catch (err) {
      console.error('Error al cargar balance:', err);
    }
  };

  // Escuchar cambios de visibilidad (cuando vuelves a la pestaña)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadBudgets();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const loadBudgets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/budgets`,
        axiosConfig
      );
      
      console.log('Presupuestos cargados:', response.data); // Para debugging
      setBudgets(response.data.budgets || []);
    } catch (err) {
      console.error('Error al cargar presupuestos:', err);
      setError(err.response?.data?.error || 'Error al cargar los presupuestos');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBudgets();
    setRefreshing(false);
  };

  const handleSaveBudget = async (budgetData) => {
    try {
      if (editingBudget) {
        await axios.put(
          `${API_BASE_URL}/budgets/${editingBudget.id}`,
          {
            monthlyLimit: budgetData.monthlyLimit,
            alertThreshold: budgetData.alertThreshold || 80,
            description: budgetData.description
          },
          axiosConfig
        );
      } else {
        await axios.post(
          `${API_BASE_URL}/budgets`,
          {
            categoryId: budgetData.categoryId,
            monthlyLimit: budgetData.monthlyLimit,
            alertThreshold: budgetData.alertThreshold || 80,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            description: budgetData.description
          },
          axiosConfig
        );
      }
      
      await loadBudgets();
      setShowForm(false);
      setEditingBudget(null);
    } catch (err) {
      console.error('Error al guardar presupuesto:', err);
      throw err.response?.data?.error || 'Error al guardar el presupuesto';
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleDelete = async (budgetId) => {
    if (!window.confirm('¿Estás seguro de eliminar este presupuesto?')) {
      return;
    }

    try {
      await axios.delete(
        `${API_BASE_URL}/budgets/${budgetId}`,
        axiosConfig
      );
      
      await loadBudgets();
    } catch (err) {
      console.error('Error al eliminar presupuesto:', err);
      setError(err.response?.data?.error || 'Error al eliminar el presupuesto');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBudget(null);
  };

  const getBudgetStatus = (budget) => {
    // CORRECCIÓN: Usar spent.currentSpent en lugar de spentAmount
    const spentAmount = budget.spent?.currentSpent || 0;
    const monthlyLimit = budget.monthlyLimit || 1;
    const percentage = (spentAmount / monthlyLimit) * 100;
    
    if (percentage >= 100) return 'over-budget';
    if (percentage >= (budget.alertThreshold || 80)) return 'warning';
    return 'good';
  };

  // CORRECCIÓN: Calcular totales usando spent.currentSpent
  const totalAllocated = budgets.reduce((sum, b) => sum + (parseFloat(b.monthlyLimit) || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (parseFloat(b.spent?.currentSpent) || 0), 0);
  const totalRemaining = totalAllocated - totalSpent;

  return (
    <MainLayout title="Presupuestos" balance={balance}>
      <div className="budgets-page">
        <div className="page-header">
          <div className="header-info">
            <h1 className="page-title">Gestión de Presupuestos</h1>
            <p className="page-subtitle">Controla tus gastos por categoría</p>
          </div>
          <div className="header-actions">
            <Button 
              variant="secondary" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`icon-sm ${refreshing ? 'rotating' : ''}`} />
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </Button>
            <Button variant="primary" onClick={() => setShowForm(true)}>
              <Plus className="icon-sm" />
              Nuevo Presupuesto
            </Button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Métricas Principales Mejoradas */}
        <div className="analysis-metrics">
          <Card variant="stonky-primary" className="metric-card metric-card-primary">
            <div className="metric-content">
              <div className="metric-icon-container">
                <DollarSign className="metric-icon" />
              </div>
              <div className="metric-info">
                <span className="metric-label">Total Presupuestado</span>
                <span className="metric-value">{formatCLP(totalAllocated)}</span>
                <span className="metric-description">Límite mensual asignado</span>
              </div>
              <div className="metric-badge">{budgets.length} categorías</div>
            </div>
          </Card>

          <Card variant="stonky-warning" className="metric-card metric-card-warning">
            <div className="metric-content">
              <div className="metric-icon-container">
                <TrendingDown className="metric-icon" />
              </div>
              <div className="metric-info">
                <span className="metric-label">Total Gastado</span>
                <span className="metric-value">{formatCLP(totalSpent)}</span>
                <span className="metric-description">Consumo actual del mes</span>
              </div>
              <div className="metric-badge">{totalAllocated > 0 ? ((totalSpent / totalAllocated) * 100).toFixed(1) + '%' : '0%'}</div>
            </div>
          </Card>

          <Card variant={totalRemaining >= 0 ? "stonky-success" : "stonky-danger"} className={`metric-card ${totalRemaining >= 0 ? 'metric-card-success' : 'metric-card-danger'}`}>
            <div className="metric-content">
              <div className="metric-icon-container">
                {totalRemaining >= 0 ? <CheckCircle className="metric-icon" /> : <AlertTriangle className="metric-icon" />}
              </div>
              <div className="metric-info">
                <span className="metric-label">{totalRemaining >= 0 ? 'Disponible' : 'Sobrepasado'}</span>
                <span className="metric-value">{formatCLP(Math.abs(totalRemaining))}</span>
                <span className="metric-description">{totalRemaining >= 0 ? 'Puedes gastar más' : 'Exceso en presupuesto'}</span>
              </div>
              <div className="metric-badge">{totalRemaining >= 0 ? 'Bajo control' : 'Atención'}</div>
            </div>
          </Card>
        </div>

        <Card title="Tus Presupuestos">
          {loading ? (
            <div className="loading-state">
              <Zap className="loading-icon" />
              <p>Cargando tus presupuestos...</p>
            </div>
          ) : budgets.length === 0 ? (
            <div className="empty-state">
              <PieChart className="empty-icon" size={64} />
              <h3>No hay presupuestos configurados</h3>
              <p>Comienza creando tu primer presupuesto para controlar tus gastos</p>
              <Button variant="primary" onClick={() => setShowForm(true)}>
                <Plus className="icon-sm" />
                Crear Presupuesto
              </Button>
            </div>
          ) : (
            <div className="budgets-list">
              {budgets.map((budget, index) => {
                // CORRECCIÓN: Usar spent.currentSpent en lugar de spentAmount
                const spentAmount = budget.spent?.currentSpent || 0;
                const monthlyLimit = budget.monthlyLimit || 1;
                const status = getBudgetStatus(budget);
                const percentage = (spentAmount / monthlyLimit) * 100;
                const remaining = monthlyLimit - spentAmount;

                return (
                  <div
                    key={budget.id}
                    className={`budget-item-modern ${status}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="budget-header-modern">
                      <div className="budget-category-section">
                        <div className="category-icon-wrapper">
                          {status === 'over-budget' && <AlertTriangle className="category-icon error" />}
                          {status === 'warning' && <AlertTriangle className="category-icon warning" />}
                          {status === 'good' && <CheckCircle className="category-icon success" />}
                        </div>
                        <div className="category-info">
                          <h4 className="category-name">{budget.category?.name || 'Sin categoría'}</h4>
                          {budget.description && (
                            <p className="budget-description-small">{budget.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="budget-status-badge" data-status={status}>
                        {status === 'over-budget' && 'Excedido'}
                        {status === 'warning' && 'Alerta'}
                        {status === 'good' && 'Bajo Control'}
                      </div>
                    </div>

                    <div className="budget-amounts-section">
                      <div className="amount-item">
                        <span className="amount-label">Gastado</span>
                        <span className="amount-value spent">{formatCLP(spentAmount)}</span>
                      </div>
                      <div className="amount-separator">/</div>
                      <div className="amount-item">
                        <span className="amount-label">Límite</span>
                        <span className="amount-value limit">{formatCLP(monthlyLimit)}</span>
                      </div>
                      <div className="amount-item remaining">
                        <span className="amount-label">Restante</span>
                        <span className={`amount-value ${remaining >= 0 ? 'positive' : 'negative'}`}>
                          {formatCLP(Math.abs(remaining))}
                        </span>
                      </div>
                    </div>

                    <div className="budget-progress-modern">
                      <div className="progress-header">
                        <span className="progress-label">Progreso</span>
                        <span className="progress-percentage">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="progress-bar-modern">
                        <div
                          className={`progress-fill-modern ${status}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="budget-actions-modern">
                      <Button variant="secondary" size="sm" onClick={() => handleEdit(budget)}>
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(budget.id)}>
                        Eliminar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {showForm && (
          <BudgetForm
            budget={editingBudget}
            onSave={handleSaveBudget}
            onCancel={handleCloseForm}
          />
        )}
      </div>
    </MainLayout>
  );
}