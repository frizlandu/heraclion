/**
 * API service pour la gestion des proformas
 */
import apiClient from './apiClient';

export const proformasAPI = {
  // Récupérer tous les proformas
  getAll: async () => {
    try {
      // Appel à l'API backend pour récupérer les proformas (limite élevée pour "tous")
      const response = await apiClient.get('/documents?type=proforma&limit=1000');
      if (response.data && response.data.success) {
        return response.data.data || [];
      }
      return response.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des proformas:', error);
      throw error;
    }
  },

  // Récupérer un proforma par ID
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/documents/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du proforma ${id}:`, error);
      throw error;
    }
  },

  // Créer un nouveau proforma
  create: async (proformaData) => {
    try {
      const response = await apiClient.post('/documents', {
        ...proformaData,
        type_document: 'proforma'
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du proforma:', error);
      throw error;
    }
  },

  // Mettre à jour un proforma
  update: async (id, proformaData) => {
    try {
      const response = await apiClient.put(`/documents/${id}`, {
        ...proformaData,
        type_document: 'proforma'
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du proforma ${id}:`, error);
      throw error;
    }
  },

  // Supprimer un proforma
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/documents/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du proforma ${id}:`, error);
      throw error;
    }
  },

  // Générer le PDF d'un proforma
  generatePDF: async (id) => {
    try {
      const response = await apiClient.get(`/documents/${id}/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la génération PDF du proforma ${id}:`, error);
      throw error;
    }
  },

  // Convertir un proforma en facture
  convertToFacture: async (id) => {
    try {
      const response = await apiClient.post(`/documents/${id}/convert-to-facture`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la conversion du proforma ${id} en facture:`, error);
      throw error;
    }
  },

  // Dupliquer un proforma
  duplicate: async (id) => {
    try {
      const response = await apiClient.post(`/documents/${id}/duplicate`, {
        type_document: 'proforma'
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la duplication du proforma ${id}:`, error);
      throw error;
    }
  },

  // Générer un numéro de proforma basé sur l'entreprise
  generateNumber: async (entreprise_id) => {
    try {
      const response = await apiClient.post('/documents/generate-number', {
        entreprise_id,
        type_document: 'proforma'
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la génération du numéro de proforma:', error);
      throw error;
    }
  }
};

export default proformasAPI;