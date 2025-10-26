import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import TransactionForm from '../components/transactions/TransactionForm';
import TransactionList from '../components/transactions/TransactionList';
import { Plus, Download, Upload, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    dateRange: 'month'
  });

  // Cargar transacciones al montar el componente
  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/transactions`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar las transacciones');
      }
      
      const data = await response.json();
      setTransactions(data.transactions || data);
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
      alert('Error al cargar las transacciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTransaction = async (transactionData) => {
    try {
      if (editingTransaction) {
        // Actualizar en el backend
        const response = await fetch(`${API_URL}/api/transactions/${editingTransaction.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(transactionData)
        });

        if (!response.ok) {
          throw new Error('Error al actualizar la transacción');
        }

        const updatedData = await response.json();
        setTransactions(prev => prev.map(t => 
          t.id === editingTransaction.id ? updatedData.transaction || { ...t, ...updatedData } : t
        ));
      } else {
        // Crear en el backend
        const response = await fetch(`${API_URL}/api/transactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(transactionData)
        });

        if (!response.ok) {
          throw new Error('Error al crear la transacción');
        }

        const data = await response.json();
        const newTransaction = data.transaction || {
          id: Date.now(),
          ...transactionData,
          createdAt: new Date().toISOString()
        };
        setTransactions(prev => [newTransaction, ...prev]);
      }
      
      setShowForm(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('Error al guardar transacción:', error);
      alert('Error al guardar la transacción');
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta transacción?')) {
      return;
    }

    try {
      // Soft delete en el backend
      const response = await fetch(`${API_URL}/api/transactions/${transactionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la transacción');
      }
      
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
    } catch (error) {
      console.error('Error al eliminar transacción:', error);
      alert('Error al eliminar la transacción');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleExport = () => {
    try {
      // Crear CSV con las transacciones filtradas
      const headers = ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto'];
      const csvData = filteredTransactions.map(t => [
        t.date,
        t.type === 'income' ? 'Ingreso' : 'Gasto',
        t.category,
        t.description,
        t.amount
      ]);
      
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `transacciones_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar las transacciones');
    }
  };

  const handleImport = () => {
    alert('Función de importación en desarrollo. Próximamente podrás importar transacciones desde CSV.');
  };

  // Filtrar transacciones
  const filteredTransactions = transactions.filter(transaction => {
    if (filters.type !== 'all' && transaction.type !== filters.type) return false;
    if (filters.category !== 'all' && transaction.category !== filters.category) return false;
    // TODO: Implementar filtro por período de fecha
    return true;
  });

  // Calcular totales
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Categorías únicas para el filtro
  const uniqueCategories = [...new Set(transactions.map(t => t.category))];

  // Función de formateo ULTRA SIMPLE y DIRECTA
  const formatMoney = (amount) => {
    return parseInt(amount || 0).toLocaleString('es-CL');
  };

  return (
    <MainLayout title="Transacciones" balance={balance}>
      <div className="transactions-page">
        {/* Header con Estadísticas */}
        <div className="page-header">
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-icon income">
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Total Ingresos</span>
                <span className="stat-value income">+${formatMoney(totalIncome)}</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon expense">
                <TrendingDown size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Total Gastos</span>
                <span className="stat-value expense">-${formatMoney(totalExpenses)}</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon balance">
                <DollarSign size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Balance</span>
                <span className={`stat-value ${balance >= 0 ? 'income' : 'expense'}`}>
                  ${formatMoney(Math.abs(balance))}
                </span>
              </div>
            </div>
          </div>
          
          <div className="header-actions">
            <Button variant="secondary" onClick={handleImport}>
              <Upload className="icon-sm" />
              Importar
            </Button>
            <Button variant="secondary" onClick={handleExport}>
              <Download className="icon-sm" />
              Exportar
            </Button>
            <Button variant="primary" onClick={() => setShowForm(true)}>
              <Plus className="icon-sm" />
              Nueva Transacción
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Tipo</label>
              <select 
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="all">Todos</option>
                <option value="income">Ingresos</option>
                <option value="expense">Gastos</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Categoría</label>
              <select 
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="all">Todas</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Período</label>
              <select 
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              >
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
                <option value="quarter">Este trimestre</option>
                <option value="year">Este año</option>
                <option value="all">Todo el historial</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Lista de Transacciones */}
        <TransactionList
          transactions={filteredTransactions}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDeleteTransaction}
        />

        {/* Estado Vacío */}
        {!loading && filteredTransactions.length === 0 && (
          <Card className="empty-state">
            <div className="empty-state-content">
              <p className="empty-state-text">
                {transactions.length === 0 
                  ? 'No hay transacciones registradas' 
                  : 'No hay transacciones que coincidan con los filtros'}
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="icon-sm" />
                {transactions.length === 0 ? 'Agregar Primera Transacción' : 'Nueva Transacción'}
              </Button>
            </div>
          </Card>
        )}

        {/* Modal de Transacción */}
        {showForm && (
          <Modal onClose={handleCloseForm}>
            <TransactionForm
              transaction={editingTransaction}
              onSave={handleSaveTransaction}
              onCancel={handleCloseForm}
            />
          </Modal>
        )}
      </div>
    </MainLayout>
  );
}