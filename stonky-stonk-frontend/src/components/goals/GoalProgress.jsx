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
    <Card className="goal-card-modern">
      {/* Header */}
      <div className="goal-header-modern">
        <div className="goal-title-section-modern">
          <div className="goal-icon-wrapper">
            {goal.status === 'completed' && <PartyPopper className="goal-status-icon completed" />}
            {goal.status === 'active' && <Target className="goal-status-icon active" />}
            {goal.status === 'paused' && <Pause className="goal-status-icon paused" />}
            {goal.status === 'cancelled' && <XCircle className="goal-status-icon cancelled" />}
          </div>
          <div className="goal-title-info">
            <h3 className="goal-title">{goal.name}</h3>
            <span className={`goal-badge-modern ${getStatusBadgeClass()}`}>
              {getStatusLabel()}
            </span>
          </div>
        </div>

        {!readonly && (
          <div className="goal-actions-header">
            <button
              className="action-btn-modern"
              onClick={() => setIsEditing(!isEditing)}
              title="Editar"
            >
              <Edit2 size={18} />
            </button>
            <button
              className="action-btn-modern delete"
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

        {/* Barra de progreso moderna */}
        <div className="progress-section-modern">
          <div className="progress-stats">
            <div className="stat-item">
              <span className="stat-label">Ahorrado</span>
              <span className="stat-value current">{formatCLP(currentAmount)}</span>
            </div>
            <div className="stat-separator">/</div>
            <div className="stat-item">
              <span className="stat-label">Meta</span>
              <span className="stat-value target">{formatCLP(targetAmount)}</span>
            </div>
          </div>

          <div className="progress-bar-container">
            <div className="progress-bar-modern">
              <div
                className="progress-fill-modern"
                style={{
                  width: `${Math.min(percentage, 100)}%`,
                  background: percentage >= 100
                    ? 'linear-gradient(90deg, #10b981, #059669)'
                    : percentage >= 75
                    ? 'linear-gradient(90deg, #3b82f6, #2563eb)'
                    : percentage >= 50
                    ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                    : 'linear-gradient(90deg, #6366f1, #4f46e5)'
                }}
              >
                <div className="progress-shine"></div>
              </div>
            </div>
            <span className="progress-percent-modern">{Math.round(percentage)}%</span>
          </div>

          {/* Información de dinero restante */}
          {goal.status !== 'completed' && (
            <div className="remaining-info-modern">
              <div className="remaining-card">
                <span className="remaining-label">Falta por ahorrar</span>
                <span className="remaining-amount">{formatCLP(remaining)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Información de fecha moderna */}
        {goal.deadline && (
          <div className="deadline-info-modern">
            <div className="deadline-card">
              <Calendar className="deadline-icon" />
              <div className="deadline-content">
                <span className="deadline-label">Fecha límite</span>
                <span className="deadline-date">{goal.deadline}</span>
              </div>
              {daysRemaining !== null && (
                <div className={`days-badge ${isOverdue ? 'overdue' : ''} ${isNearDeadline ? 'warning' : ''}`}>
                  {isOverdue ? (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Vencida
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {daysRemaining}d
                    </span>
                  )}
                </div>
              )}
            </div>
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
          <div className="completed-message-modern">
            <div className="celebration-icon">
              <PartyPopper className="w-8 h-8" />
            </div>
            <div className="celebration-text">
              <h4>¡Meta Completada!</h4>
              <p>Has alcanzado tu objetivo de ahorro</p>
            </div>
          </div>
        )}

        {goal.status === 'cancelled' && (
          <div className="cancelled-message-modern">
            <XCircle className="w-6 h-6" />
            <span>Meta cancelada</span>
          </div>
        )}
      </div>
    </Card>
  );
}