// ============================================
// CONTROLADOR: SETTINGS (Configuraciones)
// ============================================
// aca manejamos todas las operaciones de configuración del usuario

const { Settings } = require('../models');

// ==================== GET: Obtener configuración del usuario ====================
exports.getSettings = async (req, res) => {
  try {
    const userId = req.userId; // viene del middleware auth

    // buscamos la configuración del usuario
    let settings = await Settings.findOne({
      where: { userId }
    });

    // si no existe, creamos una con valores por defecto
    if (!settings) {
      settings = await Settings.create({
        userId,
        currency: 'CLP',
        language: 'es',
        emailNotifications: true,
        pushNotifications: true,
        monthlyReports: true,
        budgetAlerts: true,
        dataSharing: false,
        analytics: true
      });
    }

    res.json({
      success: true,
      settings: {
        profile: {
          currency: settings.currency,
          language: settings.language
        },
        notifications: {
          email: settings.emailNotifications,
          push: settings.pushNotifications,
          monthlyReports: settings.monthlyReports,
          budgetAlerts: settings.budgetAlerts
        },
        privacy: {
          dataSharing: settings.dataSharing,
          analytics: settings.analytics
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener configuraciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar la configuración',
      error: error.message
    });
  }
};

// ==================== PUT: Actualizar configuración completa ====================
exports.updateSettings = async (req, res) => {
  try {
    const userId = req.userId;
    const { profile, notifications, privacy } = req.body;

    // buscamos la configuración del usuario
    let settings = await Settings.findOne({
      where: { userId }
    });

    // si no existe, la creamos
    if (!settings) {
      settings = await Settings.create({
        userId,
        currency: profile?.currency || 'CLP',
        language: profile?.language || 'es',
        emailNotifications: notifications?.email !== undefined ? notifications.email : true,
        pushNotifications: notifications?.push !== undefined ? notifications.push : true,
        monthlyReports: notifications?.monthlyReports !== undefined ? notifications.monthlyReports : true,
        budgetAlerts: notifications?.budgetAlerts !== undefined ? notifications.budgetAlerts : true,
        dataSharing: privacy?.dataSharing !== undefined ? privacy.dataSharing : false,
        analytics: privacy?.analytics !== undefined ? privacy.analytics : true
      });
    } else {
      // actualizamos los campos que vienen en el request
      if (profile) {
        if (profile.currency) settings.currency = profile.currency;
        if (profile.language) settings.language = profile.language;
      }

      if (notifications !== undefined) {
        if (notifications.email !== undefined) settings.emailNotifications = notifications.email;
        if (notifications.push !== undefined) settings.pushNotifications = notifications.push;
        if (notifications.monthlyReports !== undefined) settings.monthlyReports = notifications.monthlyReports;
        if (notifications.budgetAlerts !== undefined) settings.budgetAlerts = notifications.budgetAlerts;
      }

      if (privacy !== undefined) {
        if (privacy.dataSharing !== undefined) settings.dataSharing = privacy.dataSharing;
        if (privacy.analytics !== undefined) settings.analytics = privacy.analytics;
      }

      await settings.save();
    }

    res.json({
      success: true,
      message: 'Configuración actualizada exitosamente',
      settings: {
        profile: {
          currency: settings.currency,
          language: settings.language
        },
        notifications: {
          email: settings.emailNotifications,
          push: settings.pushNotifications,
          monthlyReports: settings.monthlyReports,
          budgetAlerts: settings.budgetAlerts
        },
        privacy: {
          dataSharing: settings.dataSharing,
          analytics: settings.analytics
        }
      }
    });

  } catch (error) {
    console.error('Error al actualizar configuraciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la configuración',
      error: error.message
    });
  }
};

// ==================== PATCH: Actualizar solo una sección ====================
exports.updateSettingsSection = async (req, res) => {
  try {
    const userId = req.userId;
    const { section } = req.params; // 'profile', 'notifications' o 'privacy'
    const data = req.body;

    // validar que la sección sea válida
    const validSections = ['profile', 'notifications', 'privacy'];
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: 'Sección inválida. Debe ser: profile, notifications o privacy'
      });
    }

    let settings = await Settings.findOne({
      where: { userId }
    });

    // si no existe, crear config por defecto primero
    if (!settings) {
      settings = await Settings.create({
        userId,
        currency: 'CLP',
        language: 'es',
        emailNotifications: true,
        pushNotifications: true,
        monthlyReports: true,
        budgetAlerts: true,
        dataSharing: false,
        analytics: true
      });
    }

    // actualizar solo la sección especificada
    switch (section) {
      case 'profile':
        if (data.currency) settings.currency = data.currency;
        if (data.language) settings.language = data.language;
        break;

      case 'notifications':
        if (data.email !== undefined) settings.emailNotifications = data.email;
        if (data.push !== undefined) settings.pushNotifications = data.push;
        if (data.monthlyReports !== undefined) settings.monthlyReports = data.monthlyReports;
        if (data.budgetAlerts !== undefined) settings.budgetAlerts = data.budgetAlerts;
        break;

      case 'privacy':
        if (data.dataSharing !== undefined) settings.dataSharing = data.dataSharing;
        if (data.analytics !== undefined) settings.analytics = data.analytics;
        break;
    }

    await settings.save();

    res.json({
      success: true,
      message: `Sección '${section}' actualizada exitosamente`,
      settings: {
        profile: {
          currency: settings.currency,
          language: settings.language
        },
        notifications: {
          email: settings.emailNotifications,
          push: settings.pushNotifications,
          monthlyReports: settings.monthlyReports,
          budgetAlerts: settings.budgetAlerts
        },
        privacy: {
          dataSharing: settings.dataSharing,
          analytics: settings.analytics
        }
      }
    });

  } catch (error) {
    console.error('Error al actualizar sección:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la sección',
      error: error.message
    });
  }
};

// ==================== POST: Crear configuración inicial (usado al registrarse) ====================
exports.createDefaultSettings = async (userId) => {
  try {
    const settings = await Settings.create({
      userId,
      currency: 'CLP',
      language: 'es',
      emailNotifications: true,
      pushNotifications: true,
      monthlyReports: true,
      budgetAlerts: true,
      dataSharing: false,
      analytics: true
    });

    return settings;
  } catch (error) {
    console.error('Error al crear configuración por defecto:', error);
    throw error;
  }
};
