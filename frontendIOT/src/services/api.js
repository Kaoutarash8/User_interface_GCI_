/**
 * Service API pour communiquer avec le backend FastAPI
 */
import axios from 'axios';

// URL de base de l'API backend
const API_BASE_URL = 'http://localhost:8000';

// Création de l'instance axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour auto-login en cas d'erreur 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ Session expirée, tentative de reconnexion automatique...");
      try {
        // Tentative de reconnexion automatique
        const loginResult = await login("admin123");
        if (loginResult.success) {
          console.log("✅ Reconnexion automatique réussie");
          // Retry la requête originale
          return api.request(error.config);
        }
      } catch (loginError) {
        console.error("❌ Échec de la reconnexion automatique");
      }
    }
    return Promise.reject(error);
  }
);

// ==================== AUTHENTIFICATION ====================

/**
 * Connexion avec le mot de passe
 */
export const login = async (password) => {
  try {
    const response = await api.post('/auth/login', { password });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Erreur de connexion',
    };
  }
};

/**
 * Déconnexion
 */
export const logout = async () => {
  try {
    const response = await api.post('/auth/logout');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Erreur de déconnexion',
    };
  }
};

/**
 * Changer le mot de passe
 */
export const changePassword = async (oldPassword, newPassword) => {
  try {
    const response = await api.post('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Erreur lors du changement de mot de passe',
    };
  }
};

// ==================== TEMPÉRATURE ====================

/**
 * Récupérer les données du dashboard
 */
export const getDashboard = async () => {
  try {
    const response = await api.get('/temperature/dashboard');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Erreur lors de la récupération du dashboard',
    };
  }
};

/**
 * Récupérer la dernière mesure de température
 */
export const getLatestTemperature = async () => {
  try {
    const response = await api.get('/temperature/data/latest');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Erreur lors de la récupération de la température',
    };
  }
};

/**
 * Créer une nouvelle mesure de température
 */
export const createTemperatureData = async (data) => {
  try {
    const response = await api.post('/temperature/data', data);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Erreur lors de la création de la mesure',
    };
  }
};

/**
 * Récupérer toutes les mesures de température
 */
export const getAllTemperatureData = async (limit = 100) => {
  try {
    const response = await api.get(`/temperature/data/all?limit=${limit}`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Erreur lors de la récupération des données',
    };
  }
};

// ==================== PRÉDICTIONS ====================

/**
 * Récupérer la dernière prédiction
 */
export const getLatestPrediction = async () => {
  try {
    const response = await api.get('/temperature/prediction/latest');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Erreur lors de la récupération de la prédiction',
    };
  }
};

/**
 * Créer une nouvelle prédiction
 */
export const createPrediction = async (data) => {
  try {
    const response = await api.post('/temperature/prediction', data);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Erreur lors de la création de la prédiction',
    };
  }
};

// ==================== TEMPÉRATURE DE CONFORT ====================

/**
 * Sauvegarder la température de confort
 */
export const setComfortTemp = async (comfortTemp) => {
  try {
    const response = await api.post('/temperature/comfort', {
      comfort_temperature: comfortTemp
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Erreur lors de la sauvegarde de la température de confort',
    };
  }
};

/**
 * Récupérer la température de confort actuelle
 */
export const getComfortTemp = async () => {
  try {
    const response = await api.get('/temperature/comfort/current');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Erreur lors de la récupération de la température de confort',
    };
  }
};

// ==================== CONTRÔLES MANUELS ====================

/**
 * Sauvegarder les contrôles manuels
 */
export const setManualControl = async (controls) => {
  try {
    const response = await api.post('/temperature/manual-control', {
      heater_on: controls.heater_on,
      fan_on: controls.fan_on,
      heater_level: controls.heater_level,
      fan_level: controls.fan_level
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Erreur lors de la sauvegarde des contrôles manuels',
    };
  }
};

// ==================== DONNÉES TEMPORELLES ====================

/**
 * Récupérer les données réelles des 24 dernières heures
 */
export const get24hRealData = async () => {
  try {
    const response = await api.get('/temperature/24h/real');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Erreur lors de la récupération des données 24h réelles',
    };
  }
};

/**
 * Récupérer les prédictions des 24 prochaines heures
 */
export const get24hPredictions = async () => {
  try {
    const response = await api.get('/temperature/24h/predictions');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Erreur lors de la récupération des prédictions 24h',
    };
  }
};

// ==================== MODE ====================

/**
 * Récupérer le mode actuel
 */
export const getCurrentMode = async () => {
  try {
    const response = await api.get('/history/mode/current');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Erreur lors de la récupération du mode',
    };
  }
};

/**
 * Changer le mode (1 = AUTO, 0 = MANUEL)
 */
export const setMode = async (mode) => {
  try {
    const response = await api.post('/history/mode', { mode });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Erreur lors du changement de mode',
    };
  }
};

// ==================== HISTORIQUE ====================

/**
 * Récupérer l'historique complet
 */
export const getHistory = async (year = null, month = null, day = null) => {
  try {
    let url = '/history/all';
    const params = [];
    if (year) params.push(`year=${year}`);
    if (month) params.push(`month=${month}`);
    if (day) params.push(`day=${day}`);
    if (params.length > 0) url += '?' + params.join('&');
    
    const response = await api.get(url);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Erreur lors de la récupération de l\'historique',
    };
  }
};

/**
 * Récupérer l'historique des modes
 */
export const getModeHistory = async (limit = 100) => {
  try {
    const response = await api.get(`/history/mode/all?limit=${limit}`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Erreur lors de la récupération de l\'historique des modes',
    };
  }
};

// ==================== FONCTION D'AUTO-LOGIN ====================

/**
 * Connexion automatique au démarrage
 */
export const autoLogin = async () => {
  try {
    const result = await login("admin123");
    if (result.success) {
      console.log("✅ Auto-login réussi");
    } else {
      console.warn("⚠️ Auto-login échoué:", result.error);
    }
    return result;
  } catch (error) {
    console.error("❌ Erreur lors de l'auto-login:", error);
    return { success: false, error: error.message };
  }
};

export default api;