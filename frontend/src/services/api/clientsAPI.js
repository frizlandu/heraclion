/**
 * Service API pour les clients
 */
import apiClient from './axiosConfig';

export const clientsAPI = {
  // Récupérer tous les clients
  getAll: async (params = {}) => {
    // Utiliser une limite élevée par défaut si non spécifiée
    const defaultParams = { limit: 1000, ...params };
    const response = await apiClient.get('/clients', { params: defaultParams });
    return response.data;
  },

  // Récupérer un client par ID
  getById: async (id) => {
    const response = await apiClient.get(`/clients/${id}`);
    return response.data;
  },

  // Créer un nouveau client
  create: async (clientData) => {
    const response = await apiClient.post('/clients', clientData);
    return response.data;
  },

  // Mettre à jour un client
  update: async (id, clientData) => {
    const response = await apiClient.put(`/clients/${id}`, clientData);
    return response.data;
  },

  // Supprimer un client
  delete: async (id) => {
    const response = await apiClient.delete(`/clients/${id}`);
    return response.data;
  },

  // Rechercher des clients
  search: async (query) => {
    const response = await apiClient.get('/clients/search', {
      params: { q: query }
    });
    return response.data;
  }
};

export default clientsAPI;