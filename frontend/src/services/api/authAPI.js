/**
 * Service d'authentification
 */
import apiClient from './axiosConfig';

export const authAPI = {
  // Connexion
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  // Récupérer le profil utilisateur
  getProfile: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Déconnexion
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Nettoyer le localStorage même en cas d'erreur
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // Vérifier si l'utilisateur est authentifié
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Récupérer le token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Sauvegarder les données d'authentification
  saveAuthData: (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  },

  // Récupérer l'utilisateur connecté
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export default authAPI;