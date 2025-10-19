/**
 * Hook personnalisé pour la gestion de la configuration PDF
 * Centralise toute la logique API et l'état
 */
import { useState, useEffect, useCallback } from 'react';

export const usePdfConfig = () => {
  const [config, setConfig] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [logos, setLogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiRequest = useCallback(async (url, options = {}) => {
    try {
      // Construire l'URL complète avec le bon port
      const fullUrl = url.startsWith('http') ? url : `http://localhost:3001${url}`;
      const response = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const loadConfiguration = useCallback(async () => {
    try {
      const data = await apiRequest('/api/v1/pdf-config');
      setConfig(data.data);
      return data.data;
    } catch (err) {
      console.error('Erreur lors du chargement de la configuration:', err);
    }
  }, [apiRequest]);

  const loadTemplates = useCallback(async () => {
    try {
      const data = await apiRequest('/api/v1/pdf-config/templates');
      setTemplates(data.data);
      return data.data;
    } catch (err) {
      console.error('Erreur lors du chargement des templates:', err);
    }
  }, [apiRequest]);

  const loadLogos = useCallback(async () => {
    try {
      const data = await apiRequest('/api/v1/pdf-config/logos');
      setLogos(data.data.logos);
      return data.data.logos;
    } catch (err) {
      console.error('Erreur lors du chargement des logos:', err);
    }
  }, [apiRequest]);

  const activateTemplate = useCallback(async (templateId) => {
    try {
      await apiRequest(`/api/v1/pdf-config/templates/${templateId}`, {
        method: 'PUT',
      });
      
      // Recharger les données après activation
      await Promise.all([loadTemplates(), loadConfiguration()]);
      
      return { success: true, message: `Template "${templateId}" activé avec succès` };
    } catch (err) {
      return { success: false, message: 'Erreur lors de l\'activation du template' };
    }
  }, [apiRequest, loadTemplates, loadConfiguration]);

  const updateConfiguration = useCallback(async (newConfig) => {
    try {
      await apiRequest('/api/v1/pdf-config', {
        method: 'PUT',
        body: JSON.stringify(newConfig),
      });
      
      await loadConfiguration();
      return { success: true, message: 'Configuration mise à jour avec succès' };
    } catch (err) {
      return { success: false, message: 'Erreur lors de la mise à jour de la configuration' };
    }
  }, [apiRequest, loadConfiguration]);

  const uploadLogo = useCallback(async (file) => {
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('http://localhost:3001/api/v1/pdf-config/logos/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      await loadLogos();
      return { success: true, message: 'Logo uploadé avec succès' };
    } catch (err) {
      return { success: false, message: 'Erreur lors de l\'upload du logo' };
    }
  }, [loadLogos]);

  const activateLogo = useCallback(async (filename) => {
    try {
      await apiRequest(`/api/v1/pdf-config/logos/${filename}/activate`, {
        method: 'PUT',
      });
      
      await Promise.all([loadConfiguration(), loadLogos()]);
      return { success: true, message: 'Logo activé avec succès' };
    } catch (err) {
      return { success: false, message: 'Erreur lors de l\'activation du logo' };
    }
  }, [apiRequest, loadConfiguration, loadLogos]);

  const deleteLogo = useCallback(async (filename) => {
    try {
      await apiRequest(`/api/v1/pdf-config/logos/${filename}`, {
        method: 'DELETE',
      });
      
      await Promise.all([loadLogos(), loadConfiguration()]);
      return { success: true, message: 'Logo supprimé avec succès' };
    } catch (err) {
      return { success: false, message: 'Erreur lors de la suppression du logo' };
    }
  }, [apiRequest, loadLogos, loadConfiguration]);

  const generatePreview = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/v1/pdf-config/preview', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      // Créer un blob et un URL pour télécharger le PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'preview-document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, message: 'Aperçu PDF généré avec succès' };
    } catch (err) {
      return { success: false, message: 'Erreur lors de la génération de l\'aperçu' };
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          loadConfiguration(),
          loadTemplates(),
          loadLogos(),
        ]);
      } catch (err) {
        console.error('Erreur lors du chargement initial:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [loadConfiguration, loadTemplates, loadLogos]);

  return {
    // État
    config,
    templates,
    logos,
    loading,
    error,
    
    // Actions
    activateTemplate,
    updateConfiguration,
    uploadLogo,
    activateLogo,
    deleteLogo,
    generatePreview,
    
    // Rechargement manuel
    refresh: () => Promise.all([loadConfiguration(), loadTemplates(), loadLogos()]),
  };
};

export default usePdfConfig;