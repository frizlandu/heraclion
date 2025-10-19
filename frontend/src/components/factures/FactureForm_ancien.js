/**
 * Version corrigée du formulaire de facture avec calculs forcés
 */
import React, { useState, useEffect, useMemo } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { clientsAPI } from '../../services/clientsAPI';

const FactureFormFixed = ({ facture, mode, onSubmit, onCancel, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    numero: '',
    client_id: '',
    client_nom: '',
    client_email: '',
    client_adresse: '',
    date_emission: new Date().toISOString().split('T')[0],
    date_echeance: '',
    description: '',
    statut: 'brouillon',
    type_facture: 'normale',
    lignes: []
  });
  
  const [clients, setClients] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);

  // Fonction pour créer une ligne par défaut
  const creerLigneDefaut = (id = 1) => ({
    id: id,
    item: '',
    date: '',
    p_immat: '',
    designation: '',
    ticket: '',
    tonnes: 0,
    total_poids: 0,
    prix_unitaire: 0,
    frais_administratif: 0,
    taux_tva: 20,
    total_ht: 0,
    total_tva: 0,
    total_general: 0
  });

  // Calculer les montants d'une ligne
  const calculerLigne = (ligne) => {
    const prixUnitaire = parseFloat(ligne.prix_unitaire) || 0;
    const fraisAdmin = parseFloat(ligne.frais_administratif) || 0;
    const tauxTva = parseFloat(ligne.taux_tva) || 0;
    const tonnes = parseFloat(ligne.tonnes) || 0;
    
    const total_ht = prixUnitaire + fraisAdmin;
    const total_tva = total_ht * (tauxTva / 100);
    const total_general = total_ht + total_tva;
    const total_poids = tonnes * 1000; // 1 tonne = 1000 kg
    
    return {
      ...ligne,
      prix_unitaire: prixUnitaire,
      frais_administratif: fraisAdmin,
      taux_tva: tauxTva,
      tonnes: tonnes,
      total_poids: parseFloat(total_poids.toFixed(0)),
      total_ht: parseFloat(total_ht.toFixed(2)),
      total_tva: parseFloat(total_tva.toFixed(2)),
      total_general: parseFloat(total_general.toFixed(2))
    };
  };

  // Initialiser avec une ligne par défaut
  useEffect(() => {
    if (formData.lignes.length === 0) {
      setFormData(prev => ({
        ...prev,
        lignes: [creerLigneDefaut()]
      }));
    }
  }, [formData.lignes.length]);

  // Charger les clients
  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoadingClients(true);
        const response = await clientsAPI.getAll();
        const clientsData = response.data?.data || response.data || response || [];
        setClients(Array.isArray(clientsData) ? clientsData : []);
      } catch (error) {
        console.error('Erreur lors du chargement des clients:', error);
      } finally {
        setLoadingClients(false);
      }
    };

    loadClients();
  }, []);

  // Pré-remplir le formulaire si on édite une facture
  useEffect(() => {
    if (facture && mode === 'edit') {
      setFormData({
        ...facture,
        lignes: facture.lignes && facture.lignes.length > 0 
          ? facture.lignes.map(ligne => calculerLigne(ligne))
          : [creerLigneDefaut()]
      });
    }
  }, [facture, mode]);

  // Auto-calculer la date d'échéance
  useEffect(() => {
    if (formData.date_emission && !formData.date_echeance) {
      const dateEmission = new Date(formData.date_emission);
      const dateEcheance = new Date(dateEmission);
      dateEcheance.setDate(dateEcheance.getDate() + 30);
      
      setFormData(prev => ({
        ...prev,
        date_echeance: dateEcheance.toISOString().split('T')[0]
      }));
    }
  }, [formData.date_emission, formData.date_echeance]);

  // Totaux calculés automatiquement
  const totaux = useMemo(() => {
    const result = formData.lignes.reduce((acc, ligne) => {
      acc.total_ht += ligne.total_ht || 0;
      acc.total_tva += ligne.total_tva || 0;
      acc.total_general += ligne.total_general || 0;
      return acc;
    }, { total_ht: 0, total_tva: 0, total_general: 0 });

    return {
      total_ht: parseFloat(result.total_ht.toFixed(2)),
      total_tva: parseFloat(result.total_tva.toFixed(2)),
      total_general: parseFloat(result.total_general.toFixed(2))
    };
  }, [formData.lignes]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleClientChange = (e) => {
    const clientId = e.target.value;
    const selectedClient = clients.find(c => c.id === parseInt(clientId, 10) || c.id === clientId);
    
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      client_nom: selectedClient?.nom || '',
      client_email: selectedClient?.email || '',
      client_adresse: selectedClient?.adresse || ''
    }));

    if (errors.client_id) {
      setErrors(prev => ({
        ...prev,
        client_id: undefined
      }));
    }
  };

  const handleLigneChange = (index, field, value) => {
    setFormData(prev => {
      const newLignes = [...prev.lignes];
      
      // Mettre à jour le champ - ne pas convertir les champs texte en nombres
      const textFields = ['item', 'date', 'p_immat', 'designation', 'ticket'];
      newLignes[index] = {
        ...newLignes[index],
        [field]: textFields.includes(field) ? value : (parseFloat(value) || 0)
      };
      
      // Recalculer cette ligne
      newLignes[index] = calculerLigne(newLignes[index]);
      
      return {
        ...prev,
        lignes: newLignes
      };
    });
  };

  const ajouterLigne = () => {
    const newId = Math.max(...formData.lignes.map(l => l.id), 0) + 1;
    setFormData(prev => ({
      ...prev,
      lignes: [...prev.lignes, creerLigneDefaut(newId)]
    }));
  };

  const supprimerLigne = (index) => {
    if (formData.lignes.length > 1) {
      setFormData(prev => ({
        ...prev,
        lignes: prev.lignes.filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.client_id) {
      newErrors.client_id = 'Veuillez sélectionner un client';
    }

    if (!formData.date_emission) {
      newErrors.date_emission = 'La date d\'émission est obligatoire';
    }

    if (!formData.date_echeance) {
      newErrors.date_echeance = 'La date d\'échéance est obligatoire';
    }

    if (!formData.type_facture) {
      newErrors.type_facture = 'Le type de facture est obligatoire';
    }

    if (formData.lignes.length === 0) {
      newErrors.lignes = 'Au moins une ligne est requise';
    }

    const lignesInvalides = formData.lignes.some(ligne => !ligne.description.trim());
    if (lignesInvalides) {
      newErrors.lignes = 'Toutes les lignes doivent avoir une description';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else if (onCancel) {
      onCancel();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const factureData = {
        ...formData,
        montant_total: totaux.total_ttc,
        total_ht: totaux.total_ht,
        total_tva: totaux.total_tva
      };

      if (onSave) {
        await onSave(factureData);
      } else if (onSubmit) {
        await onSubmit(factureData);
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de la sauvegarde de la facture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white mb-4">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {mode === 'create' ? 'Nouvelle facture' : 'Modifier la facture'}
          </h3>
          <button
            type="button"
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="numero" className="block text-sm font-medium text-gray-700">
                Numéro de facture
              </label>
              <input
                type="text"
                id="numero"
                name="numero"
                value={formData.numero}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Auto-généré si vide"
              />
            </div>

            <div>
              <label htmlFor="type_facture" className="block text-sm font-medium text-gray-700">
                Type de facture <span className="text-red-500">*</span>
              </label>
              <select
                id="type_facture"
                name="type_facture"
                value={formData.type_facture}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors.type_facture ? 'border-red-300' : ''
                }`}
              >
                <option value="normale">Facture normale</option>
                <option value="transport">Facture transport</option>
                <option value="non_transport">Facture non transport</option>
              </select>
              {errors.type_facture && (
                <p className="mt-1 text-sm text-red-600">{errors.type_facture}</p>
              )}
            </div>

            <div>
              <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
                Client <span className="text-red-500">*</span>
              </label>
              {loadingClients ? (
                <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-500">
                  Chargement des clients...
                </div>
              ) : (
                <select
                  id="client_id"
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleClientChange}
                  className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    errors.client_id ? 'border-red-300' : ''
                  }`}
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.nom}
                    </option>
                  ))}
                </select>
              )}
              {errors.client_id && (
                <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>
              )}
            </div>

            <div>
              <label htmlFor="statut" className="block text-sm font-medium text-gray-700">
                Statut
              </label>
              <select
                id="statut"
                name="statut"
                value={formData.statut}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="brouillon">Brouillon</option>
                <option value="envoyee">Envoyée</option>
                <option value="payee">Payée</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="date_emission" className="block text-sm font-medium text-gray-700">
                Date d'émission <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="date_emission"
                name="date_emission"
                value={formData.date_emission}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors.date_emission ? 'border-red-300' : ''
                }`}
              />
              {errors.date_emission && (
                <p className="mt-1 text-sm text-red-600">{errors.date_emission}</p>
              )}
            </div>

            <div>
              <label htmlFor="date_echeance" className="block text-sm font-medium text-gray-700">
                Date d'échéance <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="date_echeance"
                name="date_echeance"
                value={formData.date_echeance}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors.date_echeance ? 'border-red-300' : ''
                }`}
              />
              {errors.date_echeance && (
                <p className="mt-1 text-sm text-red-600">{errors.date_echeance}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description générale
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Description ou notes sur la facture"
            />
          </div>

          {/* Lignes de facture */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">Lignes de facture</h4>
              <button
                type="button"
                onClick={ajouterLigne}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Ajouter une ligne
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-md">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">P/Immat</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Désignation</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tonnes</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total/Poids</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prix Unit</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Frais Admin</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">TVA%</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total(HT)</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total(TVA)</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Général</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.lignes.map((ligne, index) => (
                    <tr key={ligne.id}>
                      {/* Item */}
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={ligne.item || ''}
                          onChange={(e) => handleLigneChange(index, 'item', e.target.value)}
                          className="w-16 p-1 border border-gray-300 rounded text-sm"
                          placeholder="Item"
                        />
                      </td>
                      {/* Date */}
                      <td className="px-2 py-2">
                        <input
                          type="date"
                          value={ligne.date || ''}
                          onChange={(e) => handleLigneChange(index, 'date', e.target.value)}
                          className="w-32 p-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      {/* P/Immat */}
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={ligne.p_immat || ''}
                          onChange={(e) => handleLigneChange(index, 'p_immat', e.target.value)}
                          className="w-24 p-1 border border-gray-300 rounded text-sm"
                          placeholder="P/Immat"
                        />
                      </td>
                      {/* Désignation */}
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={ligne.designation || ''}
                          onChange={(e) => handleLigneChange(index, 'designation', e.target.value)}
                          className="w-32 p-1 border border-gray-300 rounded text-sm"
                          placeholder="Désignation"
                        />
                      </td>
                      {/* Ticket */}
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={ligne.ticket || ''}
                          onChange={(e) => handleLigneChange(index, 'ticket', e.target.value)}
                          className="w-20 p-1 border border-gray-300 rounded text-sm"
                          placeholder="Ticket"
                        />
                      </td>
                      {/* Tonnes */}
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={ligne.tonnes || ''}
                          onChange={(e) => handleLigneChange(index, 'tonnes', e.target.value)}
                          className="w-20 p-1 border border-gray-300 rounded text-sm"
                          min="0"
                          step="0.001"
                          placeholder="0"
                        />
                      </td>
                      {/* Total/Poids */}
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={ligne.total_poids || ''}
                          className="w-24 p-1 border border-gray-200 rounded text-sm bg-gray-50"
                          readOnly
                          title="Calculé automatiquement: Tonnes × 1000"
                        />
                      </td>
                      {/* Prix Unit */}
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={ligne.prix_unitaire || ''}
                          onChange={(e) => handleLigneChange(index, 'prix_unitaire', e.target.value)}
                          className="w-24 p-1 border border-gray-300 rounded text-sm"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </td>
                      {/* Frais Admin */}
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={ligne.frais_administratif || ''}
                          onChange={(e) => handleLigneChange(index, 'frais_administratif', e.target.value)}
                          className="w-24 p-1 border border-gray-300 rounded text-sm"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </td>
                      {/* TVA% */}
                      <td className="px-2 py-2">
                        <select
                          value={ligne.taux_tva || 20}
                          onChange={(e) => handleLigneChange(index, 'taux_tva', e.target.value)}
                          className="w-16 p-1 border border-gray-300 rounded text-sm"
                        >
                          <option value={0}>0%</option>
                          <option value={5.5}>5.5%</option>
                          <option value={10}>10%</option>
                          <option value={20}>20%</option>
                        </select>
                      </td>
                      {/* Total(HT) */}
                      <td className="px-2 py-2 text-right font-mono text-sm bg-gray-50">
                        {(ligne.total_ht || 0).toFixed(2)} €
                      </td>
                      {/* Total(TVA) */}
                      <td className="px-2 py-2 text-right font-mono text-sm bg-gray-50">
                        {(ligne.total_tva || 0).toFixed(2)} €
                      </td>
                      {/* Total Général */}
                      <td className="px-2 py-2 text-right font-mono text-sm bg-blue-50 font-semibold">
                        {(ligne.total_general || 0).toFixed(2)} €
                      </td>
                      {/* Actions */}
                      <td className="px-2 py-2">
                        {formData.lignes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => supprimerLigne(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {errors.lignes && (
              <p className="mt-1 text-sm text-red-600">{errors.lignes}</p>
            )}
          </div>

          {/* Totaux */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-right">
              <div>
                <div className="text-sm text-gray-600">Total HT</div>
                <div className="text-lg font-medium text-gray-900">
                  {totaux.total_ht.toFixed(2)} €
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total TVA</div>
                <div className="text-lg font-medium text-gray-900">
                  {totaux.total_tva.toFixed(2)} €
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Général</div>
                <div className="text-xl font-bold text-gray-900">
                  {totaux.total_general.toFixed(2)} €
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </div>
              ) : (
                mode === 'create' ? 'Créer la facture' : 'Modifier la facture'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FactureFormFixed;