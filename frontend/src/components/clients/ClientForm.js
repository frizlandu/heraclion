/**
 * Composant formulaire pour créer/modifier un client
 */
import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ClientForm = ({ client, mode, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    adresse: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (client && mode === 'edit') {
      setFormData({
        nom: client.nom || '',
        email: client.email || '',
        telephone: client.telephone || '',
        adresse: client.adresse || ''
      });
    }
  }, [client, mode]);

  const validateForm = () => {
    const newErrors = {};

    // Validation du nom (obligatoire)
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est obligatoire';
    } else if (formData.nom.length < 2) {
      newErrors.nom = 'Le nom doit contenir au moins 2 caractères';
    }

    // Validation de l'email (obligatoire)
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est obligatoire';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    // Validation du téléphone (optionnel mais format valide si renseigné)
    if (formData.telephone && !/^[\d\s\-+()]{8,}$/.test(formData.telephone.replace(/\s/g, ''))) {
      newErrors.telephone = 'Format de téléphone invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Supprimer l'erreur du champ si l'utilisateur commence à corriger
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nom: '',
      email: '',
      telephone: '',
      adresse: ''
    });
    setErrors({});
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {mode === 'create' ? 'Nouveau client' : 'Modifier le client'}
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Nom */}
          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nom"
              name="nom"
              value={formData.nom}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                errors.nom ? 'border-red-300' : ''
              }`}
              placeholder="Nom du client"
              autocomplete="organization"
            />
            {errors.nom && (
              <p className="mt-1 text-sm text-red-600">{errors.nom}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                errors.email ? 'border-red-300' : ''
              }`}
              placeholder="email@exemple.com"
              autocomplete="email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Téléphone */}
          <div>
            <label htmlFor="telephone" className="block text-sm font-medium text-gray-700">
              Téléphone
            </label>
            <input
              type="tel"
              id="telephone"
              name="telephone"
              value={formData.telephone}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                errors.telephone ? 'border-red-300' : ''
              }`}
              placeholder="+33 1 23 45 67 89"
              autocomplete="tel"
            />
            {errors.telephone && (
              <p className="mt-1 text-sm text-red-600">{errors.telephone}</p>
            )}
          </div>

          {/* Adresse */}
          <div>
            <label htmlFor="adresse" className="block text-sm font-medium text-gray-700">
              Adresse
            </label>
            <textarea
              id="adresse"
              name="adresse"
              rows={3}
              value={formData.adresse}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Adresse complète du client"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </div>
              ) : (
                mode === 'create' ? 'Créer' : 'Modifier'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;