// src/components/layout/Navbar.jsx
import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { formatCLP } from '../../utils/currency';
import { useNotifications } from '../../context/NotificationsContext';
import NotificationsPanel from '../notifications/NotificationsPanel';

export default function Navbar({ title, balance, onMenuClick }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useNotifications();
  const notificationRef = useRef(null);

  // Cerrar el dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  return (
    <header className="navbar">
      <div className="flex items-center gap-4 flex-1">
        <button
          className="navbar-menu-btn"
          onClick={onMenuClick}
          aria-label="Abrir menú"
        >
          <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="navbar-title">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Botón de Notificaciones */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Notificaciones"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full border-2 border-gray-900">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown de Notificaciones */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 z-50" style={{ width: '400px', maxWidth: '90vw' }}>
              <NotificationsPanel onClose={() => setShowNotifications(false)} />
            </div>
          )}
        </div>

        <span className="navbar-balance">
          {formatCLP(balance || 0)}
        </span>
      </div>
    </header>
  );
}