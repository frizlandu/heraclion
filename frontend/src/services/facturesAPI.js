/**
 * API service pour la gestion des factures
 */
import apiClient from './apiClient';

export const facturesAPI = {
  // Récupérer toutes les factures
  getAll: async () => {
    try {
      // Appel à l'API backend pour récupérer toutes les factures fusionnées
      const response = await apiClient.get('/all-factures');
      if (response.data && response.data.success) {
        return response.data.data || [];
      }
      return response.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des factures:', error);
      throw error;
    }
  },

  // Récupérer toutes les factures avec filtres
  getAllWithFilters: async (filters = {}) => {
    try {
      const params = new URLSearchParams({ type: 'facture', ...filters }).toString();
      const response = await apiClient.get(`/documents?${params}`);
      if (response.data && response.data.success) {
        return response.data.data || [];
      }
      return response.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des factures avec filtres:', error);
      throw error;
    }
  },

  // Récupérer une facture par ID
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/documents/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la facture ${id}:`, error);
      throw error;
    }
  },

  // Créer une nouvelle facture
  create: async (factureData) => {
    try {
      const response = await apiClient.post('/documents', {
        ...factureData,
        type: 'facture'
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la facture:', error);
      throw error;
    }
  },

  // Mettre à jour une facture
  update: async (id, factureData) => {
    try {
      const response = await apiClient.put(`/documents/${id}`, factureData);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la facture ${id}:`, error);
      throw error;
    }
  },

  // Supprimer une facture
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/documents/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de la facture ${id}:`, error);
      throw error;
    }
  },

  // Rechercher des factures
  search: async (query) => {
    try {
      const response = await apiClient.get(`/documents/search?q=${encodeURIComponent(query)}&type=facture`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche de factures:', error);
      throw error;
    }
  },

  // Changer le statut d'une facture
  updateStatus: async (id, status) => {
    try {
      const response = await apiClient.patch(`/documents/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors du changement de statut de la facture ${id}:`, error);
      throw error;
    }
  },

  // Générer un PDF de la facture
  generatePDF: async (id) => {
    try {
      const response = await apiClient.get(`/documents/${id}/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la génération PDF de la facture ${id}:`, error);
      throw error;
    }
  },

  // Envoyer une facture par email
  sendByEmail: async (id, emailData) => {
    try {
      const response = await apiClient.post(`/documents/${id}/send`, emailData);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de l'envoi de la facture ${id}:`, error);
      throw error;
    }
  }
};