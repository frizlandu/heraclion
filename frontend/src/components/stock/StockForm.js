import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import stockAPI from '../../services/stockAPI';

const StockForm = ({ article, mode = 'create', onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    designation: '',
    description: '',
    reference: '',
    prix_achat: '',
    prix_vente: '',
    quantite_stock: '',
    seuil_alerte: '',
    unite: 'pièce',
    categorie: '',
    fournisseur: '',
    actif: true
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (mode === 'edit' && article) {
      setFormData({
        designation: article.designation || article.nom || '',
        description: article.description || '',
        reference: article.reference || '',
        prix_achat: article.prix_achat || '',
        prix_vente: article.prix_vente || '',
        quantite_stock: article.quantite_stock || '',
        seuil_alerte: article.seuil_alerte || '',
        unite: article.unite || 'pièce',
        categorie: article.categorie || '',
        fournisseur: article.fournisseur || '',
        actif: article.actif !== undefined ? article.actif : true
      });
    }
  }, [mode, article]);

  // Gérer les changements de champs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Valider le formulaire
  const validateForm = () => {
    const newErrors = {};

    if (!formData.designation.trim()) {
      newErrors.designation = 'La désignation est requise';
    }

    if (!formData.reference.trim()) {
      newErrors.reference = 'La référence est requise';
    }

    if (!formData.prix_achat || parseFloat(formData.prix_achat) < 0) {
      newErrors.prix_achat = 'Le prix d\'achat doit être un nombre positif';
    }

    if (!formData.prix_vente || parseFloat(formData.prix_vente) < 0) {
      newErrors.prix_vente = 'Le prix de vente doit être un nombre positif';
    }

    if (formData.quantite_stock === '' || parseInt(formData.quantite_stock) < 0) {
      newErrors.quantite_stock = 'La quantité doit être un nombre positif ou zéro';
    }

    if (formData.seuil_alerte !== '' && parseInt(formData.seuil_alerte) < 0) {
      newErrors.seuil_alerte = 'Le seuil d\'alerte doit être un nombre positif ou zéro';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Préparer les données
      const dataToSend = {
        ...formData,
        nom: undefined, // on retire nom si présent
        prix_achat: parseFloat(formData.prix_achat),
        prix_vente: parseFloat(formData.prix_vente),
        quantite_stock: parseInt(formData.quantite_stock),
        seuil_alerte: formData.seuil_alerte ? parseInt(formData.seuil_alerte) : null
      };

      if (mode === 'create') {
        await stockAPI.create(dataToSend);
      } else {
        await stockAPI.update(article.id, dataToSend);
      }

      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      
      // Gérer les erreurs de validation du backend
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert(`Erreur lors de la ${mode === 'create' ? 'création' : 'modification'} de l'article`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              onClick={onClose}
              className="bg-white rounded-md text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                {mode === 'create' ? 'Nouvel article' : `Modifier l'article`}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Désignation */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Désignation de l'article *
                    </label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.designation ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ex: Vis acier inoxydable"
                    />
                    {errors.designation && <p className="mt-1 text-sm text-red-600">{errors.designation}</p>}
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Description détaillée de l'article..."
                    />
                  </div>

                  {/* Référence */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Référence *
                    </label>
                    <input
                      type="text"
                      name="reference"
                      value={formData.reference}
                      onChange={handleChange}
                      className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.reference ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ex: REF001"
                    />
                    {errors.reference && <p className="mt-1 text-sm text-red-600">{errors.reference}</p>}
                  </div>

                  {/* Catégorie */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Catégorie
                    </label>
                    <input
                      type="text"
                      name="categorie"
                      value={formData.categorie}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Ex: Visserie"
                    />
                  </div>

                  {/* Prix d'achat */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Prix d'achat ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="prix_achat"
                      value={formData.prix_achat}
                      onChange={handleChange}
                      className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.prix_achat ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.prix_achat && <p className="mt-1 text-sm text-red-600">{errors.prix_achat}</p>}
                  </div>

                  {/* Prix de vente */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Prix de vente ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="prix_vente"
                      value={formData.prix_vente}
                      onChange={handleChange}
                      className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.prix_vente ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.prix_vente && <p className="mt-1 text-sm text-red-600">{errors.prix_vente}</p>}
                  </div>

                  {/* Quantité en stock */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Quantité en stock *
                    </label>
                    <input
                      type="number"
                      name="quantite_stock"
                      value={formData.quantite_stock}
                      onChange={handleChange}
                      className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.quantite_stock ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                    {errors.quantite_stock && <p className="mt-1 text-sm text-red-600">{errors.quantite_stock}</p>}
                  </div>

                  {/* Seuil d'alerte */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Seuil d'alerte
                    </label>
                    <input
                      type="number"
                      name="seuil_alerte"
                      value={formData.seuil_alerte}
                      onChange={handleChange}
                      className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.seuil_alerte ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="5"
                    />
                    {errors.seuil_alerte && <p className="mt-1 text-sm text-red-600">{errors.seuil_alerte}</p>}
                  </div>

                  {/* Unité */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Unité
                    </label>
                    <select
                      name="unite"
                      value={formData.unite}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="pièce">Pièce</option>
                      <option value="kg">Kilogramme</option>
                      <option value="litre">Litre</option>
                      <option value="mètre">Mètre</option>
                      <option value="m²">Mètre carré</option>
                      <option value="m³">Mètre cube</option>
                      <option value="boîte">Boîte</option>
                      <option value="palette">Palette</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>

                  {/* Fournisseur */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Fournisseur
                    </label>
                    <input
                      type="text"
                      name="fournisseur"
                      value={formData.fournisseur}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Nom du fournisseur"
                    />
                  </div>

                  {/* Article actif */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="actif"
                        checked={formData.actif}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Article actif
                      </label>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Décochez pour désactiver temporairement cet article
                    </p>
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Enregistrement...' : (mode === 'create' ? 'Créer' : 'Modifier')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockForm;