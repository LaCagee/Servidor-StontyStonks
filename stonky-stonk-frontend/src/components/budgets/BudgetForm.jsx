import { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function BudgetForm({ onSave, onCancel, budget = null }) {
  const [formData, setFormData] = useState({
    category: budget?.category || '',
    allocatedAmount: budget?.allocatedAmount || '',
    period: budget?.period || 'month',
    startDate: budget?.startDate || new Date().toISOString().split('T')[0],
    endDate: budget?.endDate || ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const categories = [
    'Alimentación',
    'Transporte',
    'Vivienda',
    'Servicios',
    'Entretenimiento',
    'Salud',
    'Educación',
    'Ropa',
    'Otros'
  ];

  const periods = [
    { value: 'week', label: 'Semanal' },
    { value: 'month', label: 'Mensual' },
    { value: 'quarter', label: 'Trimestral' },
    { value: 'year', label: 'Anual' }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.category) {
      newErrors.category = 'La categoría es requerida';
    }

    if (!formData.allocatedAmount || formData.allocatedAmount <= 0) {
      newErrors.allocatedAmount = 'El monto debe ser mayor a 0';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'La fecha de inicio es requerida';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'La fecha de fin es requerida';
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'La fecha de fin debe ser posterior a la de inicio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await onSave({
        ...formData,
        allocatedAmount: Number(formData.allocatedAmount),
        spentAmount: budget?.spentAmount || 0
      });
    } catch (error) {
      console.error('Error al guardar el presupuesto:', error);
      setErrors({ general: 'Error al guardar el presupuesto' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Calcular fecha de fin automáticamente según el período
  const handlePeriodChange = (e) => {
    const period = e.target.value;
    setFormData(prev => ({ ...prev, period }));

    if (formData.startDate) {
      const start = new Date(formData.startDate);
      const endDate = new Date(start);

      switch (period) {
        case 'week':
          endDate.setDate(start.getDate() + 7);
          break;
        case 'month':
          endDate.setMonth(start.getMonth() + 1);
          break;
        case 'quarter':
          endDate.setMonth(start.getMonth() + 3);
          break;
        case 'year':
          endDate.setFullYear(start.getFullYear() + 1);
          break;
        default:
          break;
      }

      setFormData(prev => ({
        ...prev,
        endDate: endDate.toISOString().split('T')[0]
      }));
    }
  };

  return (
    <Modal 
      title={budget ? "Editar Presupuesto" : "Nuevo Presupuesto"} 
      onClose={onCancel}
    >
      <form onSubmit={handleSubmit} className="budget-form">
        {errors.general && (
          <div className="alert alert-error">
            <p>{errors.general}</p>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="category">Categoría</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={errors.category ? 'error' : ''}
            disabled={loading}
          >
            <option value="">Selecciona una categoría</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <span className="error-message">{errors.category}</span>}
        </div>

        <Input
          label="Monto Presupuestado"
          type="number"
          name="allocatedAmount"
          value={formData.allocatedAmount}
          onChange={handleChange}
          placeholder="0"
          error={errors.allocatedAmount}
          disabled={loading}
          min="1"
          step="1000"
        />

        <div className="form-group">
          <label htmlFor="period">Período</label>
          <select
            id="period"
            name="period"
            value={formData.period}
            onChange={handlePeriodChange}
            disabled={loading}
          >
            {periods.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <Input
            label="Fecha de Inicio"
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            error={errors.startDate}
            disabled={loading}
          />

          <Input
            label="Fecha de Fin"
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            error={errors.endDate}
            disabled={loading}
          />
        </div>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {budget ? 'Actualizar' : 'Crear'} Presupuesto
          </Button>
        </div>
      </form>
    </Modal>
  );
}