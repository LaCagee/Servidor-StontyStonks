import { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function GoalForm({ onSave, onCancel, goal = null }) {
  const [formData, setFormData] = useState({
    name: goal?.name || '',
    targetAmount: goal?.targetAmount || '',
    deadline: goal?.deadline || '',
    category: goal?.category || '',
    description: goal?.description || ''
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.name || !formData.targetAmount || !formData.deadline) {
      alert('Por favor, completa los campos obligatorios.');
      setLoading(false);
      return;
    }

    try {
      await onSave({
        ...formData,
        targetAmount: Number(formData.targetAmount)
      });
    } catch (error) {
      console.error('Error al guardar la meta:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Viajes',
    'Tecnología',
    'Educación',
    'Salud',
    'Vivienda',
    'Vehiculo',
    'Emergencia',
    'Otros'
  ];

  return (
    <Modal 
      title={goal ? "Editar Meta" : "Nueva Meta"} 
      onClose={onCancel}
      size="md"
    >
      <form onSubmit={handleSubmit} className="goal-form">
        <Input
          label="Nombre de la Meta"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Ej: Viaje a Europa"
          required
        />

        <Input
          label="Monto Objetivo"
          type="number"
          value={formData.targetAmount}
          onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
          placeholder="0"
          required
        />

        <Input
          label="Fecha Límite"
          type="date"
          value={formData.deadline}
          onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
          required
        />

        <div className="form-group">
          <label>Categoría</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          >
            <option value="">Selecciona una categoría</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Descripción (Opcional)</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe tu meta..."
            rows="3"
          />
        </div>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {goal ? 'Actualizar' : 'Crear'} Meta
          </Button>
        </div>
      </form>
    </Modal>
  );
}