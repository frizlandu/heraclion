/**
 * API service pour la gestion des clients
 */
import apiClient from './apiClient';

export const clientsAPI = {
  // Récupérer tous les clients
  getAll: async () => {
    try {
      // Utiliser une limite élevée pour récupérer tous les clients
      const response = await apiClient.get('/clients?limit=1000');
      // L'API retourne { success: true, data: { data: [...], total: ... } }
      if (response.data && response.data.success) {
        return response.data.data || [];
      }
      return response.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      throw error;
    }
  },

  // Récupérer un client par ID
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/clients/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du client ${id}:`, error);
      throw error;
    }
  },

  // Créer un nouveau client
  create: async (clientData) => {
    try {
      const response = await apiClient.post('/clients', clientData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
      throw error;
    }
  },

  // Mettre à jour un client
  update: async (id, clientData) => {
    try {
      const response = await apiClient.put(`/clients/${id}`, clientData);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du client ${id}:`, error);
      throw error;
    }
  },

  // Supprimer un client
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/clients/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du client ${id}:`, error);
      throw error;
    }
  },

  // Rechercher des clients
  search: async (query) => {
    try {
      const response = await apiClient.get(`/clients/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche de clients:', error);
      throw error;
    }
  }
};