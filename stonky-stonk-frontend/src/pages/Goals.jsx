import { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import GoalForm from '../components/goals/GoalForm';
import GoalProgress from '../components/goals/GoalProgress';
import { Plus, Target, TrendingUp, Pause, X, CheckCircle, DollarSign, Zap } from 'lucide-react';
import { formatCLP } from '../utils/currency';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'https://stonky-backend.blackdune-587dd75b.westus3.azurecontainerapps.io'}/api`;

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState(0);
  const token = localStorage.getItem('token');

  // Configurar headers con token
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // Cargar todas las metas y el balance
  useEffect(() => {
    loadGoals();
    loadBalance();
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

  const loadGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE_URL}/goals`, axiosConfig);
      
      if (response.data.goals) {
        setGoals(response.data.goals);
      }
    } catch (err) {
      console.error('Error al cargar metas:', err);
      setError(err.response?.data?.error || 'Error al cargar las metas');
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  // Crear nueva meta
  const handleAddGoal = async (goalData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/goals`,
        {
          name: goalData.name,
          targetAmount: goalData.targetAmount,
          deadline: goalData.deadline || null,
          categoryId: goalData.categoryId || null,
          description: goalData.description || null,
        },
        axiosConfig
      );

      if (response.data.goal) {
        setGoals(prev => [...prev, response.data.goal]);
        setShowForm(false);
      }
    } catch (err) {
      console.error('Error al crear meta:', err);
      alert(err.response?.data?.error || 'Error al crear la meta');
    }
  };

  // Actualizar meta
  const handleUpdateGoal = async (goalId, updates) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/goals/${goalId}`,
        updates,
        axiosConfig
      );

      if (response.data.goal) {
        setGoals(prev => prev.map(goal => 
          goal.id === goalId ? response.data.goal : goal
        ));
      }
    } catch (err) {
      console.error('Error al actualizar meta:', err);
      alert(err.response?.data?.error || 'Error al actualizar la meta');
    }
  };

  // Eliminar meta
  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('¿Estás seguro? Las transacciones se desvinculan pero no se eliminan.')) {
      return;
    }

    try {
      await axios.delete(
        `${API_BASE_URL}/goals/${goalId}`,
        axiosConfig
      );

      setGoals(prev => prev.filter(goal => goal.id !== goalId));
    } catch (err) {
      console.error('Error al eliminar meta:', err);
      alert(err.response?.data?.error || 'Error al eliminar la meta');
    }
  };

  // Añadir aporte a la meta (genera transacción automáticamente)
  const handleAddContribution = async (goalId, amount, categoryId) => {
    try {
      console.log('📍 Creando transacción con:', { goalId, amount, categoryId });
      
      // Crear transacción de gasto (expense) vinculada a la meta
      const transactionResponse = await axios.post(
        `${API_BASE_URL}/transactions`,
        {
          amount: amount,
          type: 'expense', // Tipo gasto porque es aporte a meta
          categoryId: categoryId || 1, // Usar categoryId de la meta
          goalId: goalId,
          description: `Aporte a meta de ahorro`,
          date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        },
        axiosConfig
      );

      if (transactionResponse.data.transaction) {
        console.log('✅ Transacción creada:', transactionResponse.data.transaction);
        
        // El backend recalcula automáticamente el progress
        // Obtener la meta actualizada para ver el nuevo progress
        const goalResponse = await axios.get(
          `${API_BASE_URL}/goals/${goalId}`,
          axiosConfig
        );
        
        if (goalResponse.data.goal) {
          console.log('✅ Meta actualizada con nuevo progress:', {
            currentAmount: goalResponse.data.goal.progress?.currentAmount,
            percentage: goalResponse.data.goal.progress?.percentage
          });
          
          // Actualizar solo esa meta en el estado
          setGoals(prev => prev.map(g => 
            g.id === goalId ? goalResponse.data.goal : g
          ));
        }
      }
    } catch (err) {
      console.error('❌ Error al añadir aporte:', err.message);
      console.error('Respuesta del servidor:', err.response?.data);
      alert(err.response?.data?.error || 'Error al añadir el aporte');
    }
  };

  // Pausar meta
  const handlePauseGoal = async (goalId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/goals/${goalId}/pause`,
        {},
        axiosConfig
      );

      if (response.data.goal) {
        setGoals(prev => prev.map(goal => 
          goal.id === goalId ? response.data.goal : goal
        ));
      }
    } catch (err) {
      console.error('Error al pausar meta:', err);
      alert(err.response?.data?.error || 'Error al pausar la meta');
    }
  };

  // Activar meta pausada
  const handleActivateGoal = async (goalId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/goals/${goalId}/activate`,
        {},
        axiosConfig
      );

      if (response.data.goal) {
        setGoals(prev => prev.map(goal => 
          goal.id === goalId ? response.data.goal : goal
        ));
      }
    } catch (err) {
      console.error('Error al activar meta:', err);
      alert(err.response?.data?.error || 'Error al activar la meta');
    }
  };

  // Marcar como completada
  const handleCompleteGoal = async (goalId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/goals/${goalId}/complete`,
        {},
        axiosConfig
      );

      if (response.data.goal) {
        setGoals(prev => prev.map(goal => 
          goal.id === goalId ? response.data.goal : goal
        ));
      }
    } catch (err) {
      console.error('Error al completar meta:', err);
      alert(err.response?.data?.error || 'Error al completar la meta');
    }
  };

  // Cancelar meta
  const handleCancelGoal = async (goalId) => {
    if (!window.confirm('¿Estás seguro? Esta acción no se puede revertir.')) {
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/goals/${goalId}/cancel`,
        {},
        axiosConfig
      );

      if (response.data.goal) {
        setGoals(prev => prev.map(goal => 
          goal.id === goalId ? response.data.goal : goal
        ));
      }
    } catch (err) {
      console.error('Error al cancelar meta:', err);
      alert(err.response?.data?.error || 'Error al cancelar la meta');
    }
  };

  // Filtrar metas por estado
  const completedGoals = goals.filter(goal => goal.status === 'completed');
  const activeGoals = goals.filter(goal => goal.status === 'active');
  const pausedGoals = goals.filter(goal => goal.status === 'paused');

  // Calcular estadísticas
  const totalSaved = goals.reduce((sum, goal) => sum + (goal.progress?.currentAmount || 0), 0);
  const totalTarget = activeGoals.reduce((sum, goal) => sum + (goal.targetAmount || 0), 0);
  const completionRate = goals.length > 0 ? ((completedGoals.length / goals.length) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <MainLayout title="Metas de Ahorro" balance={balance}>
        <div className="loading-state">
          <Zap className="loading-icon" />
          <p>Cargando tus metas de ahorro...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Metas de Ahorro" balance={balance}>
      <div className="goals-page">
        {/* Error Message */}
        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={() => setError(null)}>
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="page-header">
          <div className="header-info">
            <h1 className="page-title">Tus Metas de Ahorro</h1>
            <p className="page-subtitle">Gestiona y haz seguimiento a tus objetivos financieros</p>
          </div>
          <Button variant="primary" onClick={() => setShowForm(true)}>
            <Plus className="icon-sm" />
            Nueva Meta
          </Button>
        </div>

        {/* Métricas Principales Mejoradas */}
        <div className="analysis-metrics">
          <Card variant="stonky-primary" className="metric-card metric-card-primary">
            <div className="metric-content">
              <div className="metric-icon-container">
                <Target className="metric-icon" />
              </div>
              <div className="metric-info">
                <span className="metric-label">Metas Activas</span>
                <span className="metric-value">{activeGoals.length}</span>
                <span className="metric-description">En progreso ahora</span>
              </div>
              <div className="metric-badge">{totalTarget > 0 ? formatCLP(totalTarget) : 'Sin objetivos'}</div>
            </div>
          </Card>

          <Card variant="stonky-success" className="metric-card metric-card-success">
            <div className="metric-content">
              <div className="metric-icon-container">
                <DollarSign className="metric-icon" />
              </div>
              <div className="metric-info">
                <span className="metric-label">Total Ahorrado</span>
                <span className="metric-value">{formatCLP(totalSaved)}</span>
                <span className="metric-description">Progreso acumulado</span>
              </div>
              <div className="metric-badge">{completedGoals.length} completadas</div>
            </div>
          </Card>

          <Card variant="stonky-warning" className="metric-card metric-card-warning">
            <div className="metric-content">
              <div className="metric-icon-container">
                <CheckCircle className="metric-icon" />
              </div>
              <div className="metric-info">
                <span className="metric-label">Tasa de Éxito</span>
                <span className="metric-value">{completionRate}%</span>
                <span className="metric-description">Metas completadas</span>
              </div>
              <div className="metric-badge">{pausedGoals.length} pausadas</div>
            </div>
          </Card>
        </div>

        {/* Metas Activas */}
        <Card title="Metas Activas" className="goals-section">
          {activeGoals.length === 0 ? (
            <div className="empty-state">
              <Target className="empty-icon" />
              <h3>No hay metas activas</h3>
              <p>Crea tu primera meta de ahorro para comenzar</p>
              <Button variant="primary" onClick={() => setShowForm(true)}>
                Crear Meta
              </Button>
            </div>
          ) : (
            <div className="goals-grid">
              {activeGoals.map(goal => (
                <GoalProgress
                  key={goal.id}
                  goal={goal}
                  onUpdate={handleUpdateGoal}
                  onDelete={handleDeleteGoal}
                  onAddContribution={handleAddContribution}
                  onPause={handlePauseGoal}
                  onComplete={handleCompleteGoal}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Metas Pausadas */}
        {pausedGoals.length > 0 && (
          <Card title="Metas Pausadas" className="goals-section">
            <div className="goals-grid">
              {pausedGoals.map(goal => (
                <GoalProgress
                  key={goal.id}
                  goal={goal}
                  onUpdate={handleUpdateGoal}
                  onDelete={handleDeleteGoal}
                  onActivate={handleActivateGoal}
                  onCancel={handleCancelGoal}
                  readonly={false}
                />
              ))}
            </div>
          </Card>
        )}

        {/* Metas Completadas */}
        {completedGoals.length > 0 && (
          <Card title="Metas Completadas" className="goals-section">
            <div className="goals-grid">
              {completedGoals.map(goal => (
                <GoalProgress
                  key={goal.id}
                  goal={goal}
                  onUpdate={handleUpdateGoal}
                  onDelete={handleDeleteGoal}
                  readonly={true}
                />
              ))}
            </div>
          </Card>
        )}

        {/* Modal de Nueva Meta */}
        {showForm && (
          <GoalForm
            onSave={handleAddGoal}
            onCancel={() => setShowForm(false)}
          />
        )}
      </div>
    </MainLayout>
  );
}