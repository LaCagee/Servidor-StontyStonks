import { Edit2, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import Card from '../ui/Card';

export default function TransactionList({ transactions, loading, onEdit, onDelete }) {
  if (loading) {
    return (
      <Card className="transaction-list">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando transacciones...</p>
        </div>
      </Card>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Función ULTRA SIMPLE: convierte a entero y formatea
  const formatMoney = (amount) => {
    return parseInt(amount || 0).toLocaleString('es-CL');
  };

  return (
    <Card className="transaction-list">
      <div className="list-header">
        <h3>Historial de Transacciones</h3>
        <span className="transaction-count">
          {transactions.length} {transactions.length === 1 ? 'transacción' : 'transacciones'}
        </span>
      </div>

      <div className="transactions-container">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="transaction-item">
            <div className="transaction-icon">
              {transaction.type === 'income' ? (
                <ArrowDownCircle className="icon-income" size={24} />
              ) : (
                <ArrowUpCircle className="icon-expense" size={24} />
              )}
            </div>

            <div className="transaction-info">
              <div className="transaction-main">
                <h4 className="transaction-description">{transaction.description}</h4>
                <span className={`transaction-amount ${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : '-'}${formatMoney(transaction.amount)}
                </span>
              </div>
              <div className="transaction-meta">
                <span className="transaction-category">{transaction.category}</span>
                <span className="transaction-separator">•</span>
                <span className="transaction-date">{formatDate(transaction.date)}</span>
              </div>
            </div>

            <div className="transaction-actions">
              <button
                className="action-button edit"
                onClick={() => onEdit(transaction)}
                title="Editar"
                type="button"
              >
                <Edit2 size={18} />
              </button>
              <button
                className="action-button delete"
                onClick={() => onDelete(transaction.id)}
                title="Eliminar"
                type="button"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}