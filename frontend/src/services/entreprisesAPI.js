/**
 * API service pour la gestion des entreprises
 */
import apiClient from './apiClient';

export const entreprisesAPI = {
  // Récupérer toutes les entreprises
  getAll: async () => {
    try {
      const response = await apiClient.get('/entreprises');
      if (response.data && response.data.success) {
        return response.data.data || [];
      }
      return response.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des entreprises:', error);
      throw error;
    }
  },

  // Récupérer une entreprise par ID
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/entreprises/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'entreprise ${id}:`, error);
      throw error;
    }
  },

  // Créer une nouvelle entreprise
  create: async (data) => {
    try {
      const response = await apiClient.post('/entreprises', data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'entreprise:', error);
      throw error;
    }
  },

  // Mettre à jour une entreprise
  update: async (id, data) => {
    try {
      const response = await apiClient.put(`/entreprises/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'entreprise:', error);
      throw error;
    }
  },

  // Supprimer une entreprise
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/entreprises/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'entreprise:', error);
      throw error;
    }
  },

  // Générer le prochain numéro de facture pour une entreprise et catégorie
  genererProchainNumero: async (entrepriseId, categorieFacture) => {
    try {
      const response = await apiClient.post(`/entreprises/${entrepriseId}/prochain-numero`, {
        categorie_facture: categorieFacture
      });
      if (response.data && response.data.numero) {
        return response.data.numero;
      }
      throw new Error('Numéro non retourné par l\'API');
    } catch (error) {
      console.error('Erreur lors de la génération du numéro:', error);
      throw error;
    }
  }
};