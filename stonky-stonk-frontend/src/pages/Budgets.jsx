import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import BudgetForm from '../components/budgets/BudgetForm';
import { Plus, PieChart, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      // TODO: Reemplazar con llamada al backend
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockBudgets = [
        {
          id: 1,
          category: 'Alimentación',
          allocatedAmount: 100000,
          spentAmount: 75000,
          period: 'month',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          category: 'Transporte',
          allocatedAmount: 50000,
          spentAmount: 45000,
          period: 'month',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          createdAt: '2024-01-01T00:00:00Z'
        }
      ];
      
      setBudgets(mockBudgets);
    } catch (error) {
      console.error('Error al cargar presupuestos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async (budgetData) => {
    try {
      if (editingBudget) {
        // Actualizar existente
        setBudgets(prev => prev.map(b =>
          b.id === editingBudget.id ? { ...b, ...budgetData } : b
        ));
      } else {
        // Crear nuevo
        const newBudget = {
          id: Date.now(),
          ...budgetData,
          createdAt: new Date().toISOString()
        };
        setBudgets(prev => [...prev, newBudget]);
      }
      setShowForm(false);
      setEditingBudget(null);
    } catch (error) {
      console.error('Error al guardar presupuesto:', error);
      throw error;
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
      // TODO: Llamada al backend
      setBudgets(prev => prev.filter(b => b.id !== budgetId));
    } catch (error) {
      console.error('Error al eliminar presupuesto:', error);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBudget(null);
  };

  const getBudgetStatus = (budget) => {
    const percentage = (budget.spentAmount / budget.allocatedAmount) * 100;
    if (percentage >= 90) return 'over-budget';
    if (percentage >= 75) return 'warning';
    return 'good';
  };

  const totalAllocated = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
  const totalRemaining = totalAllocated - totalSpent;

  return (
    <MainLayout title="Presupuestos" balance={0}>
      <div className="budgets-page">
        {/* Header */}
        <div className="page-header">
          <div className="header-info">
            <h1 className="page-title">Gestión de Presupuestos</h1>
            <p className="page-subtitle">Controla tus gastos por categoría</p>
          </div>
          <Button variant="primary" onClick={() => setShowForm(true)}>
            <Plus className="icon-sm" />
            Nuevo Presupuesto
          </Button>
        </div>

        {/* Resumen de Presupuestos */}
        <div className="budgets-summary">
          <Card className="summary-card">
            <h3>Resumen Mensual</h3>
            <div className="summary-stats">
              <div className="summary-stat">
                <span className="stat-label">Total Presupuestado</span>
                <span className="stat-value">
                  ${totalAllocated.toLocaleString('es-CL')}
                </span>
              </div>
              <div className="summary-stat">
                <span className="stat-label">Total Gastado</span>
                <span className="stat-value">
                  ${totalSpent.toLocaleString('es-CL')}
                </span>
              </div>
              <div className="summary-stat">
                <span className={`stat-value ${totalRemaining >= 0 ? 'positive' : 'negative'}`}>
                  ${Math.abs(totalRemaining).toLocaleString('es-CL')}
                </span>
                <span className="stat-label">
                  {totalRemaining >= 0 ? 'Restante' : 'Sobrepasado'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Lista de Presupuestos */}
        <Card title="Tus Presupuestos">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Cargando presupuestos...</p>
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
              {budgets.map(budget => {
                const status = getBudgetStatus(budget);
                const percentage = (budget.spentAmount / budget.allocatedAmount) * 100;
                
                return (
                  <div key={budget.id} className="budget-item">
                    <div className="budget-header">
                      <div className="budget-category">
                        <span className="category-name">{budget.category}</span>
                        <span className={`status-indicator ${status}`}>
                          {status === 'over-budget' && <AlertTriangle className="icon-xs" />}
                          {status === 'warning' && <AlertTriangle className="icon-xs" />}
                          {status === 'good' && <CheckCircle className="icon-xs" />}
                          {status === 'over-budget' && 'Excedido'}
                          {status === 'warning' && 'Alerta'}
                          {status === 'good' && 'Bien'}
                        </span>
                      </div>
                      <div className="budget-amounts">
                        <span className="spent">${budget.spentAmount.toLocaleString('es-CL')}</span>
                        <span className="separator">/</span>
                        <span className="allocated">${budget.allocatedAmount.toLocaleString('es-CL')}</span>
                      </div>
                    </div>
                    
                    <div className="budget-progress">
                      <div className="progress-bar">
                        <div 
                          className={`progress-fill ${status}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                      <span className="progress-percentage">{percentage.toFixed(0)}%</span>
                    </div>
                    
                    <div className="budget-actions">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(budget)}>
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

        {/* Modal de Formulario */}
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