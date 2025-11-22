import { useNotifications } from '../../context/NotificationsContext';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Target,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

export default function NotificationsPanel({ onClose }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const getIcon = (iconName) => {
    const icons = {
      'target': Target,
      'clock': Clock,
      'alert-circle': AlertCircle,
      'alert-triangle': AlertTriangle,
      'trending-up': TrendingUp,
      'trending-down': TrendingDown,
      'bell': Bell,
      'check': CheckCircle
    };
    return icons[iconName] || Bell;
  };

  const getColorClass = (color) => {
    const colors = {
      success: 'bg-green-500/20 text-green-400 border-green-500/30',
      warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      error: 'bg-red-500/20 text-red-400 border-red-500/30',
      info: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    };
    return colors[color] || colors.info;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      critical: { text: 'Crítico', color: 'bg-red-500' },
      high: { text: 'Alto', color: 'bg-orange-500' },
      medium: { text: 'Medio', color: 'bg-yellow-500' },
      low: { text: 'Bajo', color: 'bg-blue-500' }
    };
    return labels[priority] || labels.medium;
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
      if (onClose) onClose();
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 max-w-md w-full max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Notificaciones</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-green-400 hover:text-green-300 transition-colors"
            >
              Marcar todas como leídas
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto p-2">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <CheckCircle className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">No hay notificaciones</p>
            <p className="text-sm mt-1">Todo está bajo control</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const Icon = getIcon(notification.icon);
              const priority = getPriorityLabel(notification.priority);

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    p-4 rounded-lg border cursor-pointer transition-all duration-200
                    hover:scale-[1.02] hover:shadow-lg
                    ${getColorClass(notification.color)}
                    ${notification.read ? 'opacity-60' : ''}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white text-sm truncate">
                          {notification.title}
                        </h4>
                        <span className={`${priority.color} text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0`}>
                          {priority.text}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {notification.message}
                      </p>
                      {notification.actionable && (
                        <div className="mt-2">
                          <span className="text-xs text-green-400 font-medium">
                            Click para ver detalles →
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-700 bg-gray-900">
          <button
            onClick={() => {
              navigate('/analysis');
              if (onClose) onClose();
            }}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
          >
            Ver todos los insights
          </button>
        </div>
      )}
    </div>
  );
}
