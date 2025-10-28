import { useState } from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';
import Button from '../ui/Button';

export default function GoalProgress({ goal, onUpdate, onDelete, onAddContribution, readonly = false }) {
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');

  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const remaining = goal.targetAmount - goal.currentAmount;
  const daysRemaining = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));

  const handleAddContribution = async (e) => {
    e.preventDefault();
    if (!contributionAmount || contributionAmount <= 0) {
      alert('Por favor, ingresa un monto válido.');
      return;
    }

    await onAddContribution(goal.id, Number(contributionAmount));
    setContributionAmount('');
    setShowContributionForm(false);
  };

  return (
    <div className={`goal-card ${progress >= 100 ? 'completed' : ''}`}>
      <div className="goal-header">
        <div className="goal-info">
          <h4 className="goal-name">{goal.name}</h4>
          {goal.description && <p className="goal-description">{goal.description}</p>}
        </div>
        {!readonly && (
          <div className="goal-actions">
            <button onClick={() => onUpdate(goal.id, goal)} title="Editar">
              <Edit2 size={18} />
            </button>
            <button className="delete" onClick={() => onDelete(goal.id)} title="Eliminar">
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="goal-progress">
        <div className="progress-bar-container">
          <div 
            className="progress-bar"
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
        <div className="progress-info">
          <div>
            <span className="progress-amount">${goal.currentAmount.toLocaleString('es-CL')}</span>
            <span className="progress-target"> de ${goal.targetAmount.toLocaleString('es-CL')}</span>
          </div>
          <span className="progress-percentage">{progress.toFixed(1)}%</span>
        </div>
      </div>

      <div className="goal-details">
        <div className="goal-detail">
          <span className="goal-detail-label">Faltan</span>
          <span className="goal-detail-value amount">${remaining.toLocaleString('es-CL')}</span>
        </div>
        <div className="goal-detail">
          <span className="goal-detail-label">Días restantes</span>
          <span className="goal-detail-value days">{daysRemaining > 0 ? daysRemaining : 0}</span>
        </div>
        <div className="goal-detail">
          <span className="goal-detail-label">Categoría</span>
          <span className="goal-detail-value category">{goal.category}</span>
        </div>
      </div>

      {!readonly && !showContributionForm && (
        <button className="add-contribution-btn" onClick={() => setShowContributionForm(true)}>
          <Plus size={20} />
          Agregar Aporte
        </button>
      )}

      {showContributionForm && (
        <form onSubmit={handleAddContribution} className="contribution-form">
          <input
            type="number"
            value={contributionAmount}
            onChange={(e) => setContributionAmount(e.target.value)}
            placeholder="Monto a aportar"
            min="1"
            max={remaining}
            required
            className="contribution-input"
          />
          <div className="contribution-actions">
            <button type="submit" className="btn btn-primary btn-sm">
              Agregar
            </button>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => setShowContributionForm(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}