/**
 * API service pour la gestion du stock
 */
import apiClient from './apiClient';

export const stockAPI = {
  // Récupérer tous les articles en stock
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Paramètres de pagination
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      // Paramètres de recherche et filtrage
      if (params.search) queryParams.append('search', params.search);
      if (params.alerte) queryParams.append('alerte', params.alerte);
      if (params.categorie) queryParams.append('categorie', params.categorie);
      if (params.actif !== undefined) queryParams.append('actif', params.actif);
      
      // Paramètres de tri
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      
      const response = await apiClient.get(`/stocks?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des articles:', error);
      throw error;
    }
  },

  // Récupérer un article par ID
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/stocks/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'article ${id}:`, error);
      throw error;
    }
  },

  // Créer un nouvel article
  create: async (stockData) => {
    try {
      const response = await apiClient.post('/stocks', stockData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'article:', error);
      throw error;
    }
  },

  // Mettre à jour un article
  update: async (id, stockData) => {
    try {
      const response = await apiClient.put(`/stocks/${id}`, stockData);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'article ${id}:`, error);
      throw error;
    }
  },

  // Supprimer un article
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/stocks/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'article ${id}:`, error);
      throw error;
    }
  },

  // Ajuster le stock (entrée/sortie)
  adjustStock: async (id, adjustmentData) => {
    try {
      // Adapter les données au format attendu par l'API backend
      const backendData = {
        type_mouvement: adjustmentData.type === 'add' ? 'entree' : 'sortie',
        quantite: adjustmentData.quantity,
        motif: adjustmentData.reason
      };
      
      const response = await apiClient.post(`/stocks/${id}/mouvements`, backendData);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de l'ajustement du stock ${id}:`, error);
      throw error;
    }
  },

  // Récupérer l'historique des mouvements
  getMovements: async (id, params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      const response = await apiClient.get(`/stocks/${id}/movements?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des mouvements pour l'article ${id}:`, error);
      throw error;
    }
  },

  // Récupérer les statistiques du stock
  getStatistics: async () => {
    try {
      const response = await apiClient.get('/stocks/valorisation');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  },

  // Exporter le stock en Excel
  exportToExcel: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.alerte) queryParams.append('alerte', params.alerte);
      if (params.categorie) queryParams.append('categorie', params.categorie);
      
      const response = await apiClient.get(`/stocks/export/excel?${queryParams.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      throw error;
    }
  },

  // Importer des articles depuis Excel
  importFromExcel: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post('/stocks/import/excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'import Excel:', error);
      throw error;
    }
  }
};

export default stockAPI;