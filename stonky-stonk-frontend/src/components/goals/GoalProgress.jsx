import { useState } from 'react';
import { Edit2, Trash2, Plus, Pause, Play, Check, X, Target, CheckCircle, XCircle, Calendar, AlertTriangle, PartyPopper } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { formatCLP } from '../../utils/currency';

export default function GoalProgress({
  goal,
  onUpdate,
  onDelete,
  onAddContribution,
  onPause,
  onActivate,
  onComplete,
  onCancel,
  readonly = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');
  const [editName, setEditName] = useState(goal.name);
  const [editTarget, setEditTarget] = useState(goal.targetAmount);
  const [editDeadline, setEditDeadline] = useState(goal.deadline || '');
  const [editDescription, setEditDescription] = useState(goal.description || '');

  // Calcular progreso
  const progress = goal.progress || {};
  const currentAmount = progress.currentAmount || 0;
  const targetAmount = progress.targetAmount || goal.targetAmount;
  const remaining = progress.remaining || (targetAmount - currentAmount);
  const percentage = progress.percentage || 0;

  // Calcular información de fecha
  const daysRemaining = goal.daysRemaining || null;
  const isOverdue = goal.isOverdue || false;
  const isNearDeadline = goal.isNearDeadline || false;

  const handleSaveEdit = async () => {
    await onUpdate(goal.id, {
      name: editName,
      targetAmount: parseFloat(editTarget),
      deadline: editDeadline || null,
      description: editDescription,
    });
    setIsEditing(false);
  };

  const handleAddContribution = async (e) => {
    e.preventDefault();
    
    if (!contributionAmount || parseFloat(contributionAmount) <= 0) {
      alert('Ingresa un monto válido');
      return;
    }

    await onAddContribution(goal.id, parseFloat(contributionAmount), goal.categoryId);
    setContributionAmount('');
    setShowContributionForm(false);
  };

  const getStatusBadgeClass = () => {
    switch (goal.status) {
      case 'completed':
        return 'badge-success';
      case 'paused':
        return 'badge-warning';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  };

  const getStatusLabel = () => {
    switch (goal.status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            Completada
          </span>
        );
      case 'paused':
        return (
          <span className="flex items-center gap-1">
            <Pause className="w-3.5 h-3.5" />
            Pausada
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            Cancelada
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1">
            <Target className="w-3.5 h-3.5" />
            Activa
          </span>
        );
    }
  };

  return (
    <Card className="goal-card">
      {/* Header */}
      <div className="goal-header">
        <div className="goal-title-section">
          <h3 className="goal-title">{goal.name}</h3>
          <span className={`goal-badge ${getStatusBadgeClass()}`}>
            {getStatusLabel()}
          </span>
        </div>
        
        {!readonly && (
          <div className="goal-actions">
            <button
              className="action-btn"
              onClick={() => setIsEditing(!isEditing)}
              title="Editar"
            >
              <Edit2 size={18} />
            </button>
            <button
              className="action-btn delete"
              onClick={() => {
                if (window.confirm('¿Eliminar esta meta?')) {
                  onDelete(goal.id);
                }
              }}
              title="Eliminar"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Formulario de edición */}
      {isEditing && !readonly && (
        <div className="edit-form">
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nombre de la meta"
            />
          </div>

          <div className="form-group">
            <label>Monto Objetivo</label>
            <input
              type="number"
              value={editTarget}
              onChange={(e) => setEditTarget(e.target.value)}
              placeholder="Monto"
              min="0"
              step="1000"
            />
          </div>

          <div className="form-group">
            <label>Fecha Límite (opcional)</label>
            <input
              type="date"
              value={editDeadline}
              onChange={(e) => setEditDeadline(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Descripción (opcional)</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Describe tu meta"
              rows="3"
            />
          </div>

          <div className="form-actions">
            <Button variant="secondary" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSaveEdit}>
              Guardar Cambios
            </Button>
          </div>
        </div>
      )}

      {/* Información de la meta */}
      <div className="goal-info">
        {goal.description && (
          <p className="goal-description">{goal.description}</p>
        )}

        {/* Barra de progreso */}
        <div className="progress-section">
          <div className="progress-header">
            <span className="progress-label">Progreso</span>
            <span className="progress-percent">{Math.round(percentage)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            ></div>
          </div>
          <div className="progress-info">
            <span className="current-amount">{formatCLP(currentAmount)}</span>
            <span className="target-amount">{formatCLP(targetAmount)}</span>
          </div>
        </div>

        {/* Información de dinero restante */}
        {goal.status !== 'completed' && (
          <div className="remaining-info">
            <p className="remaining-label">Falta por ahorrar:</p>
            <p className="remaining-amount">{formatCLP(remaining)}</p>
          </div>
        )}

        {/* Información de fecha */}
        {goal.deadline && (
          <div className="deadline-info">
            <p className="deadline-label">Fecha límite: {goal.deadline}</p>
            {daysRemaining !== null && (
              <p className={`days-remaining ${isOverdue ? 'overdue' : ''} ${isNearDeadline ? 'warning' : ''}`}>
                {isOverdue ? (
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Vencida hace {Math.abs(daysRemaining)} días
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {daysRemaining} días restantes
                  </span>
                )}
              </p>
            )}
          </div>
        )}

        {/* Proyección */}
        {goal.projection && (
          <div className="projection-info">
            <p className="projection-label">Proyección</p>
            <ul className="projection-list">
              <li>Promedio diario: {formatCLP(goal.projection.dailyAverage)}</li>
              {goal.projection.willExceed && (
                <li className="projection-excess">
                  Se puede exceder por: {formatCLP(goal.projection.projectedExcess)}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Formulario de aporte */}
      {showContributionForm && !readonly && goal.status === 'active' && (
        <form className="contribution-form" onSubmit={handleAddContribution}>
          <div className="form-group">
            <label>Monto a Aportar</label>
            <input
              type="number"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              placeholder="Ingresa el monto"
              min="0"
              step="1000"
              autoFocus
            />
          </div>
          <div className="form-actions">
            <Button
              variant="secondary"
              onClick={() => setShowContributionForm(false)}
            >
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Confirmar Aporte
            </Button>
          </div>
        </form>
      )}

      {/* Botones de acción */}
      <div className="goal-footer">
        {!readonly && goal.status === 'active' && (
          <>
            <Button
              variant="secondary"
              onClick={() => setShowContributionForm(!showContributionForm)}
              className="full-width-btn"
            >
              <Plus size={16} /> Añadir Aporte
            </Button>
            
            <div className="button-group">
              <Button
                variant="outline"
                onClick={() => {
                  if (window.confirm('¿Pausar esta meta?')) {
                    onPause(goal.id);
                  }
                }}
              >
                <Pause size={16} /> Pausar
              </Button>
              
              <Button
                variant="success"
                onClick={() => {
                  if (window.confirm('¿Marcar como completada?')) {
                    onComplete(goal.id);
                  }
                }}
              >
                <Check size={16} /> Completar
              </Button>
            </div>
          </>
        )}

        {!readonly && goal.status === 'paused' && (
          <div className="button-group">
            <Button
              variant="primary"
              onClick={() => onActivate(goal.id)}
            >
              <Play size={16} /> Reactivar
            </Button>
            
            <Button
              variant="danger"
              onClick={() => onCancel(goal.id)}
            >
              <X size={16} /> Cancelar
            </Button>
          </div>
        )}

        {goal.status === 'completed' && (
          <div className="completed-message">
            <span className="flex items-center gap-2 justify-center">
              <CheckCircle className="w-5 h-5" />
              ¡Meta completada!
            </span>
          </div>
        )}

        {goal.status === 'cancelled' && (
          <div className="cancelled-message">
            <span className="flex items-center gap-2 justify-center">
              <XCircle className="w-5 h-5" />
              Meta cancelada
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}