import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import GoalForm from '../components/goals/GoalForm';
import GoalProgress from '../components/goals/GoalProgress';
import { Plus, Target, TrendingUp } from 'lucide-react';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const loadGoals = async () => {
      setLoading(true);
      // TODO: Reemplazar con llamada al backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockGoals = [
        {
          id: 1,
          name: 'Viaje a Europa',
          targetAmount: 5000000,
          currentAmount: 2250000,
          deadline: '2024-12-31',
          category: 'Viajes',
          description: 'Ahorro para viaje de 3 semanas por Europa',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          name: 'Nueva Laptop',
          targetAmount: 800000,
          currentAmount: 480000,
          deadline: '2024-06-30',
          category: 'Tecnología',
          description: 'MacBook Pro para trabajo',
          createdAt: '2024-01-10T14:20:00Z',
          updatedAt: '2024-01-15T08:15:00Z'
        }
      ];
      
      setGoals(mockGoals);
      setLoading(false);
    };

    loadGoals();
  }, []);

  const handleAddGoal = async (goalData) => {
    // TODO: Reemplazar con llamada POST al backend
    const newGoal = {
      id: Date.now(),
      ...goalData,
      currentAmount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setGoals(prev => [...prev, newGoal]);
    setShowForm(false);
  };

  const handleUpdateGoal = async (goalId, updates) => {
    // TODO: Reemplazar con llamada PUT al backend
    setGoals(prev => prev.map(goal => 
      goal.id === goalId 
        ? { ...goal, ...updates, updatedAt: new Date().toISOString() }
        : goal
    ));
  };

  const handleDeleteGoal = async (goalId) => {
    // TODO: Reemplazar con llamada DELETE al backend
    setGoals(prev => prev.filter(goal => goal.id !== goalId));
  };

  const handleAddContribution = async (goalId, amount) => {
    // TODO: Reemplazar con llamada PATCH al backend
    setGoals(prev => prev.map(goal => {
      if (goal.id === goalId) {
        const newAmount = goal.currentAmount + amount;
        return {
          ...goal,
          currentAmount: newAmount,
          updatedAt: new Date().toISOString()
        };
      }
      return goal;
    }));
  };

  const completedGoals = goals.filter(goal => goal.currentAmount >= goal.targetAmount);
  const inProgressGoals = goals.filter(goal => goal.currentAmount < goal.targetAmount);

  // Si está cargando, mostramos un indicador de carga
  if (loading) {
    return (
      <MainLayout title="Metas de Ahorro" balance={0}>
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Cargando tus metas...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Metas de Ahorro" balance={0}>
      <div className="goals-page">
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

        {/* Estadísticas */}
        <div className="stats-grid">
          <Card variant="stonky-primary" className="stat-card-large">
            <div className="stat-content">
              <Target className="stat-icon" />
              <div className="stat-info">
                <span className="stat-label">Metas Activas</span>
                <span className="stat-value">{goals.length}</span>
              </div>
            </div>
          </Card>

          <Card variant="stonky-success" className="stat-card-large">
            <div className="stat-content">
              <TrendingUp className="stat-icon" />
              <div className="stat-info">
                <span className="stat-label">Completadas</span>
                <span className="stat-value">{completedGoals.length}</span>
              </div>
            </div>
          </Card>

          <Card variant="stonky-info" className="stat-card-large">
            <div className="stat-content">
              <div className="stat-icon">🎯</div>
              <div className="stat-info">
                <span className="stat-label">En Progreso</span>
                <span className="stat-value">{inProgressGoals.length}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Metas en Progreso */}
        <Card title="Metas en Progreso" className="goals-section">
          {inProgressGoals.length === 0 ? (
            <div className="empty-state">
              <Target className="empty-icon" />
              <h3>No hay metas en progreso</h3>
              <p>Crea tu primera meta de ahorro para comenzar</p>
              <Button variant="primary" onClick={() => setShowForm(true)}>
                Crear Meta
              </Button>
            </div>
          ) : (
            <div className="goals-grid">
              {inProgressGoals.map(goal => (
                <GoalProgress
                  key={goal.id}
                  goal={goal}
                  onUpdate={handleUpdateGoal}
                  onDelete={handleDeleteGoal}
                  onAddContribution={handleAddContribution}
                />
              ))}
            </div>
          )}
        </Card>

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
                  readonly
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