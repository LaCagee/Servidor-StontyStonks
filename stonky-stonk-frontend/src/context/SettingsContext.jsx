// ============================================
// CONTEXTO DE CONFIGURACIONES GLOBALES
// ============================================
// este contexto maneja las preferencias del usuario y provee funciones de formateo
// que se adaptan automáticamente a la moneda configurada

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { formatCurrency, formatPercentage as formatPerc, getSupportedCurrencies } from '../utils/currencyMulti';

const SettingsContext = createContext(null);

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'https://stonky-backend.blackdune-587dd75b.westus3.azurecontainerapps.io'}/api`;

export const SettingsProvider = ({ children }) => {
  // estado de configuraciones (viene del backend)
  const [settings, setSettings] = useState({
    profile: {
      currency: 'CLP',
      language: 'es'
    },
    notifications: {
      email: true,
      push: true,
      monthlyReports: true,
      budgetAlerts: true
    },
    privacy: {
      dataSharing: false,
      analytics: true
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // obtener token de auth
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  };

  // cargar configuraciones desde el backend
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/settings`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setSettings(response.data.settings);
        // guardar en localStorage como backup
        localStorage.setItem('userSettings', JSON.stringify(response.data.settings));
      }
    } catch (err) {
      console.error('Error cargando configuraciones:', err);

      // intentar cargar desde localStorage
      const cached = localStorage.getItem('userSettings');
      if (cached) {
        try {
          setSettings(JSON.parse(cached));
        } catch (e) {
          console.error('Error parseando settings del localStorage:', e);
        }
      }

      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // actualizar configuraciones en el backend
  const updateSettings = async (section, data) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/settings/${section}`,
        data,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setSettings(response.data.settings);
        // actualizar localStorage
        localStorage.setItem('userSettings', JSON.stringify(response.data.settings));
        return { success: true };
      }
    } catch (err) {
      console.error('Error actualizando configuraciones:', err);
      return { success: false, error: err.message };
    }
  };

  // cargar al montar el componente
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadSettings();
    } else {
      setLoading(false);
    }
  }, [loadSettings]);

  // ==================== FUNCIONES DE FORMATEO CON LA MONEDA DEL USUARIO ====================

  /**
   * Formatea un monto con la moneda del usuario
   * @param {number} value - El valor a formatear
   * @param {Object} options - Opciones de formateo
   * @returns {string} El valor formateado
   */
  const formatMoney = (value, options = {}) => {
    return formatCurrency(value, settings.profile.currency, options);
  };

  /**
   * Formatea un porcentaje
   * @param {number} value - El valor del porcentaje
   * @param {number} decimals - Decimales (default: 1)
   * @returns {string} El porcentaje formateado
   */
  const formatPercentage = (value, decimals = 1) => {
    return formatPerc(value, decimals);
  };

  /**
   * Formatea en formato compacto (K, M)
   * @param {number} value - El valor a formatear
   * @returns {string} El valor en formato compacto
   */
  const formatCompact = (value) => {
    return formatCurrency(value, settings.profile.currency, { compact: true });
  };

  /**
   * Formatea sin símbolo
   * @param {number} value - El valor a formatear
   * @returns {string} El valor sin símbolo
   */
  const formatWithoutSymbol = (value) => {
    return formatCurrency(value, settings.profile.currency, { showSymbol: false });
  };

  // valor del contexto
  const value = {
    settings,
    loading,
    error,
    loadSettings,
    updateSettings,
    // funciones de formateo
    formatMoney,
    formatPercentage,
    formatCompact,
    formatWithoutSymbol,
    // moneda actual
    currency: settings.profile.currency,
    language: settings.profile.language,
    // utilidades
    supportedCurrencies: getSupportedCurrencies()
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// hook personalizado pa usar el contexto mas facil
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings debe usarse dentro de un SettingsProvider');
  }
  return context;
};

export default SettingsContext;
