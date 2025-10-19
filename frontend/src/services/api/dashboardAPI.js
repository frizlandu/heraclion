/**
 * Service API pour le dashboard
 */
import apiClient from './axiosConfig';

export const dashboardAPI = {
  // Récupérer les statistiques générales
  getStats: async () => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  },

  // Récupérer les activités récentes
  getRecentActivities: async (limit = 10) => {
    const response = await apiClient.get('/dashboard/recent-activities', {
      params: { limit }
    });
    return response.data;
  },

  // Récupérer les données pour les graphiques
  getChartData: async (type, period = '30d') => {
    const response = await apiClient.get(`/dashboard/charts/${type}`, {
      params: { period }
    });
    return response.data;
  },

  // Récupérer les alertes
  getAlerts: async () => {
    const response = await apiClient.get('/dashboard/alerts');
    return response.data;
  }
};

export default dashboardAPI;