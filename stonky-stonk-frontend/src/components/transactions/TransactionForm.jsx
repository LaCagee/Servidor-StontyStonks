import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { X, Lightbulb } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3000/api';

export default function TransactionForm({ transaction, categories = [], onSave, onCancel }) {
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    categoryId: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [suggestingCategory, setSuggestingCategory] = useState(false);

  // Si estamos editando, cargar los datos
  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        amount: transaction.amount.toString(),
        description: transaction.description,
        categoryId: transaction.categoryId.toString(),
        date: transaction.date
      });
    }
  }, [transaction]);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Resetear categoría si cambia el tipo
      ...(name === 'type' ? { categoryId: '' } : {})
    }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Manejar cambio de tipo con switch
  const handleTypeToggle = () => {
    const newType = formData.type === 'expense' ? 'income' : 'expense';
    setFormData(prev => ({
      ...prev,
      type: newType,
      categoryId: '' // Resetear categoría
    }));
  };

  // Obtener sugerencia de categoría
  const handleGetCategorySuggestion = async () => {
    if (!formData.description.trim()) {
      alert('Por favor, escribe una descripción primero');
      return;
    }

    setSuggestingCategory(true);
    try {
      const headers = getHeaders();

      if (!headers.Authorization) {
        throw new Error('No hay token de autenticación');
      }

      const encodedDescription = encodeURIComponent(formData.description);
      const url = `${API_BASE_URL}/suggestions/best?description=${encodedDescription}&type=${formData.type}`;

      console.log('💡 Solicitando sugerencia de categoría:', url);

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener sugerencia');
      }

      const data = await response.json();
      console.log('✅ Sugerencia recibida:', data);

      if (data.suggestion && data.suggestion.categoryId) {
        setFormData(prev => ({
          ...prev,
          categoryId: data.suggestion.categoryId.toString()
        }));
        console.log('✅ Categoría sugerida:', data.suggestion.categoryName);
      } else {
        alert('No se pudo obtener una sugerencia. Por favor, selecciona manualmente.');
      }
    } catch (error) {
      console.error('❌ Error al obtener sugerencia:', error);
      alert('Error al obtener sugerencia: ' + error.message);
    } finally {
      setSuggestingCategory(false);
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

    if (!formData.categoryId) {
      newErrors.categoryId = 'La categoría es requerida';
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

    // Preparar datos para enviar según la API
    const transactionData = {
      type: formData.type,
      amount: parseFloat(formData.amount),
      description: formData.description,
      categoryId: parseInt(formData.categoryId),
      date: formData.date
    };

    onSave(transactionData);
    setLoading(false);
  };

  // Filtrar categorías por tipo seleccionado
  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  return (
    <div className="transaction-form">
      <div className="form-header">
        <h2>{transaction ? 'Editar Transacción' : 'Nueva Transacción'}</h2>
        <button className="close-button" onClick={onCancel} type="button">
          <X />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Tipo de Transacción - SWITCH */}
        <div className="form-group">
          <label>Tipo de Transacción</label>
          <div className="type-switch-container">
            <button
              type="button"
              className={`type-switch ${formData.type === 'expense' ? 'active' : ''}`}
              onClick={handleTypeToggle}
            >
              <span className="switch-label">Gasto</span>
              
            </button>
            <div className="type-switch-toggle">
              <div className={`toggle-slider ${formData.type === 'income' ? 'income' : 'expense'}`}></div>
            </div>
            <button
              type="button"
              className={`type-switch ${formData.type === 'income' ? 'active' : ''}`}
              onClick={handleTypeToggle}
            >
              
              <span className="switch-label">Ingreso</span>
            </button>
          </div>
          <div className="type-indicator">
            {formData.type === 'expense' ? ' Registrando un Gasto' : ' Registrando un Ingreso'}
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

        {/* Categoría con Botón de Sugerencia */}
        <div className="form-group">
          <div className="category-header">
            <label htmlFor="categoryId">Categoría</label>
            <button
              type="button"
              className="btn-suggestion"
              onClick={handleGetCategorySuggestion}
              disabled={suggestingCategory || !formData.description.trim()}
              title={formData.description.trim() ? 'Obtener sugerencia automática' : 'Escribe una descripción primero'}
            >
              <Lightbulb size={16} />
              {suggestingCategory ? 'Sugiriendo...' : 'Sugerir'}
            </button>
          </div>
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            className={errors.categoryId ? 'error' : ''}
          >
            <option value="">Selecciona una categoría</option>
            {filteredCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {errors.categoryId && <span className="error-message">{errors.categoryId}</span>}
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