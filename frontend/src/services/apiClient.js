/**
 * Client API configuré avec authentification et intercepteurs
 */
import axios from 'axios';

// Configuration de base de l'API
// Utilisation d'une variable d'environnement React pour l'URL complète de l'API
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: process.env.REACT_APP_API_TIMEOUT ? parseInt(process.env.REACT_APP_API_TIMEOUT, 10) : 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et erreurs globales
apiClient.interceptors.response.use(
  (response) => {
    // Retourner les données directement si c'est un succès
    return response;
  },
  (error) => {
    // Gestion des erreurs d'authentification
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Log des erreurs pour le debugging
    console.error('API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
      method: error.config?.method
    });
    
    return Promise.reject(error);
  }
);

export default apiClient;