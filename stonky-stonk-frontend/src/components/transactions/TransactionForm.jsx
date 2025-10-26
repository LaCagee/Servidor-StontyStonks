import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { X } from 'lucide-react';

const CATEGORIES_BY_TYPE = {
  income: [
    'Salario',
    'Freelance',
    'Inversiones',
    'Ventas',
    'Otros Ingresos'
  ],
  expense: [
    'Alimentación',
    'Transporte',
    'Vivienda',
    'Servicios',
    'Entretenimiento',
    'Salud',
    'Educación',
    'Ropa',
    'Otros Gastos'
  ]
};

export default function TransactionForm({ transaction, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Si estamos editando, cargar los datos
  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        amount: transaction.amount.toString(),
        description: transaction.description,
        category: transaction.category,
        date: transaction.date
      });
    }
  }, [transaction]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Resetear categoría si cambia el tipo
      ...(name === 'type' ? { category: '' } : {})
    }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.category) {
      newErrors.category = 'La categoría es requerida';
    }

    if (!formData.date) {
      newErrors.date = 'La fecha es requerida';
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

    // Simular llamada al backend
    await new Promise(resolve => setTimeout(resolve, 500));

    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount)
    };

    onSave(transactionData);
    setLoading(false);
  };

  const categories = CATEGORIES_BY_TYPE[formData.type];

  return (
    <div className="transaction-form">
      <div className="form-header">
        <h2>{transaction ? 'Editar Transacción' : 'Nueva Transacción'}</h2>
        <button className="close-button" onClick={onCancel} type="button">
          <X />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Tipo de Transacción */}
        <div className="form-group">
          <label>Tipo de Transacción</label>
          <div className="type-selector">
            <button
              type="button"
              className={`type-button ${formData.type === 'income' ? 'active income' : ''}`}
              onClick={() => handleChange({ target: { name: 'type', value: 'income' } })}
            >
              Ingreso
            </button>
            <button
              type="button"
              className={`type-button ${formData.type === 'expense' ? 'active expense' : ''}`}
              onClick={() => handleChange({ target: { name: 'type', value: 'expense' } })}
            >
              Gasto
            </button>
          </div>
        </div>

        {/* Monto */}
        <div className="form-group">
          <label htmlFor="amount">Monto</label>
          <div className="input-with-prefix">
            <span className="input-prefix">$</span>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0"
              step="1"
              min="0"
              className={errors.amount ? 'error' : ''}
            />
          </div>
          {errors.amount && <span className="error-message">{errors.amount}</span>}
        </div>

        {/* Descripción */}
        <div className="form-group">
          <label htmlFor="description">Descripción</label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Ej: Compra en supermercado"
            className={errors.description ? 'error' : ''}
          />
          {errors.description && <span className="error-message">{errors.description}</span>}
        </div>

        {/* Categoría */}
        <div className="form-group">
          <label htmlFor="category">Categoría</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={errors.category ? 'error' : ''}
          >
            <option value="">Selecciona una categoría</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <span className="error-message">{errors.category}</span>}
        </div>

        {/* Fecha */}
        <div className="form-group">
          <label htmlFor="date">Fecha</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            max={new Date().toISOString().split('T')[0]}
            className={errors.date ? 'error' : ''}
          />
          {errors.date && <span className="error-message">{errors.date}</span>}
        </div>

        {/* Botones */}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {transaction ? 'Actualizar' : 'Guardar'}
          </Button>
        </div>
      </form>
    </div>
  );
}