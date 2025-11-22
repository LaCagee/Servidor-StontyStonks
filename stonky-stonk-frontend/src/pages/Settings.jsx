// aca traemos todo lo que necesitamos
import { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { User, Bell, Shield, CreditCard, Download, Trash2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext'; // pa las configuraciones globales

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'https://stonky-backend.blackdune-587dd75b.westus3.azurecontainerapps.io'}/api`;

export default function Settings() {
  // usamos el hook del contexto de settings
  const { settings: globalSettings, loadSettings, updateSettings: updateGlobalSettings } = useSettings();

  // estado local de configuraciones (copia editable)
  const [settings, setSettings] = useState({
    profile: {
      name: '',
      email: '',
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
  const [saving, setSaving] = useState(false);
  const [balance, setBalance] = useState(0);

  const token = localStorage.getItem('token');
  const axiosConfig = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  // Cargar el balance desde el dashboard
  const loadBalance = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/overview`, axiosConfig);
      if (response.data.overview?.balance) {
        setBalance(response.data.overview.balance.currentBalance || 0);
      }
    } catch (err) {
      console.error('Error al cargar balance:', err);
    }
  };

  // cargar datos del usuario al iniciar
  useEffect(() => {
    loadBalance();
    const loadUserData = async () => {
      setLoading(true);

      const userData = JSON.parse(localStorage.getItem('user') || '{}');

      // combinar datos del usuario con configuraciones del contexto
      const mergedSettings = {
        profile: {
          name: userData.name || 'Usuario',
          email: userData.email || 'usuario@ejemplo.com',
          currency: globalSettings.profile.currency,
          language: globalSettings.profile.language
        },
        notifications: globalSettings.notifications,
        privacy: globalSettings.privacy
      };

      setSettings(mergedSettings);
      setLoading(false);
    };

    loadUserData();
  }, [globalSettings]); // recarga cuando cambian las settings globales

  // funcion pa guardar configuraciones (solo preferencias: currency, language, notificaciones, privacidad)
  const handleSaveSettings = async (section, data) => {
    setSaving(true);

    try {
      // actualizar estado local inmediatamente (optimistic update)
      setSettings(prev => ({
        ...prev,
        [section]: { ...prev[section], ...data }
      }));

      // guardar en el backend via el contexto global
      const result = await updateGlobalSettings(section, data);

      if (result.success) {
        alert('✅ Configuración guardada exitosamente');

        // recargar configuraciones del contexto pa asegurar sincronización
        await loadSettings();
      } else {
        throw new Error(result.error || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error al guardar configuraciones:', error);
      alert('❌ Error al guardar la configuración. Intenta nuevamente.');

      // revertir cambios en caso de error
      await loadSettings();
    } finally {
      setSaving(false);
    }
  };

  // funcion separada pa actualizar datos del perfil de usuario (nombre)
  const handleSaveProfile = async () => {
    setSaving(true);

    try {
      // actualizar nombre si cambió
      const userData = JSON.parse(localStorage.getItem('user') || '{}');

      if (settings.profile.name !== userData.name) {
        const nameResponse = await axios.put(
          `${API_BASE_URL}/users/profile/name`,
          { name: settings.profile.name },
          axiosConfig
        );

        if (nameResponse.data && nameResponse.data.user) {
          // actualizar localStorage con los datos nuevos
          localStorage.setItem('user', JSON.stringify(nameResponse.data.user));
        }
      }

      // guardar preferencias (currency y language) en settings
      await handleSaveSettings('profile', {
        currency: settings.profile.currency,
        language: settings.profile.language
      });

      alert('✅ Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      alert('❌ Error al actualizar perfil. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  // exportar todos los datos del usuario en formato CSV
  const handleExportData = async () => {
    try {
      // traer todas las transacciones del usuario
      const response = await axios.get(`${API_BASE_URL}/transactions?limit=10000`, axiosConfig);
      const transactions = response.data.transactions || [];

      if (transactions.length === 0) {
        alert('No hay datos para exportar');
        return;
      }

      // crear CSV con los datos
      const csvHeaders = ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto'];
      const csvRows = transactions.map(t => [
        new Date(t.date).toLocaleDateString('es-CL'),
        t.type === 'income' ? 'Ingreso' : 'Gasto',
        t.category?.name || 'Sin categoría',
        t.description || '',
        t.amount
      ]);

      // convertir a string CSV
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // crear blob y descargar
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `stonky-datos-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('✅ Datos exportados exitosamente');
    } catch (error) {
      console.error('Error al exportar datos:', error);
      alert('❌ Error al exportar datos. Intenta nuevamente.');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
      // TODO: Reemplazar con llamada DELETE al backend
      console.log('Eliminando cuenta...');
      alert('Función de eliminación en desarrollo');
    }
  };

  if (loading) {
    return (
      <MainLayout title="Configuración" balance={balance}>
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Cargando configuración...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Configuración" balance={balance}>
      <div className="settings-page">
        <div className="settings-header">
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Gestiona tu cuenta y preferencias</p>
        </div>

        <div className="settings-grid">
          {/* Perfil de Usuario */}
          <Card title="Perfil de Usuario" icon={<User className="card-icon" />}>
            <div className="settings-form">
              <Input
                label="Nombre"
                value={settings.profile.name}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  profile: { ...prev.profile, name: e.target.value }
                }))}
              />
              
              <Input
                label="Correo Electrónico"
                type="email"
                value={settings.profile.email}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  profile: { ...prev.profile, email: e.target.value }
                }))}
              />
              
              <div className="form-row">
                <div className="form-group">
                  <label>Moneda</label>
                  <select 
                    value={settings.profile.currency}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      profile: { ...prev.profile, currency: e.target.value }
                    }))}
                  >
                    <option value="CLP">Peso Chileno (CLP)</option>
                    <option value="USD">Dólar Americano (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Idioma</label>
                  <select 
                    value={settings.profile.language}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      profile: { ...prev.profile, language: e.target.value }
                    }))}
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <Button
                variant="primary"
                loading={saving}
                onClick={handleSaveProfile}
              >
                Guardar Cambios
              </Button>
            </div>
          </Card>

          {/* Notificaciones */}
          <Card title="Notificaciones" icon={<Bell className="card-icon" />}>
            <div className="settings-list">
              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Notificaciones por Email</span>
                  <span className="setting-description">Recibe resúmenes y alertas por correo</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.notifications.email}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, email: e.target.checked }
                    }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Notificaciones Push</span>
                  <span className="setting-description">Alertas en tiempo real en la aplicación</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.notifications.push}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, push: e.target.checked }
                    }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Reportes Mensuales</span>
                  <span className="setting-description">Resumen mensual de tus finanzas</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.notifications.monthlyReports}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, monthlyReports: e.target.checked }
                    }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <Button 
                variant="primary"
                loading={saving}
                onClick={() => handleSaveSettings('notifications', settings.notifications)}
              >
                Guardar Preferencias
              </Button>
            </div>
          </Card>

          {/* Privacidad y Seguridad */}
          <Card title="Privacidad y Seguridad" icon={<Shield className="card-icon" />}>
            <div className="settings-list">
              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Compartir Datos Anónimos</span>
                  <span className="setting-description">Ayúdanos a mejorar la aplicación</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.privacy.dataSharing}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, dataSharing: e.target.checked }
                    }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Análisis de Datos</span>
                  <span className="setting-description">Habilita análisis inteligente</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.privacy.analytics}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, analytics: e.target.checked }
                    }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <Button 
                variant="primary"
                loading={saving}
                onClick={() => handleSaveSettings('privacy', settings.privacy)}
              >
                Actualizar Configuración
              </Button>
            </div>
          </Card>

          {/* Gestión de Datos */}
          <Card title="Gestión de Datos" icon={<CreditCard className="card-icon" />}>
            <div className="data-management">
              <div className="data-action">
                <div className="action-info">
                  <h4>Exportar Datos</h4>
                  <p>Descarga todos tus datos en formato CSV</p>
                </div>
                <Button variant="secondary" onClick={handleExportData}>
                  <Download className="icon-sm" />
                  Exportar
                </Button>
              </div>
              
              <div className="data-action dangerous">
                <div className="action-info">
                  <h4>Eliminar Cuenta</h4>
                  <p>Elimina permanentemente tu cuenta y todos tus datos</p>
                </div>
                <Button variant="danger" onClick={handleDeleteAccount}>
                  <Trash2 className="icon-sm" />
                  Eliminar Cuenta
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}