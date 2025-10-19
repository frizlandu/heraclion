import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { clientsAPI } from '../../services/clientsAPI';
import { entreprisesAPI } from '../../services/entreprisesAPI';

const ProformaForm = ({ proforma, mode, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  
  const [formData, setFormData] = useState({
    numero_proforma: '',
    date_proforma: new Date().toISOString().split('T')[0],
    client_id: '',
    entreprise_id: '',
    statut: 'EN_ATTENTE',
    montant_ht: 0,
    montant_tva: 0,
    montant_ttc: 0,
    notes: '',
    date_validite: '',
    conditions_paiement: '30 jours net',
    monnaie: 'USD' // Dollar par défaut
  });

  const [lignes, setLignes] = useState([{
    description: '',
    quantite: 1,
    prix_unitaire: 0,
    taux_tva: 20,
    montant_ht: 0,
    montant_tva: 0,
    montant_ttc: 0
  }]);

  // Charger les données nécessaires
  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsResponse, entreprisesResponse] = await Promise.all([
          clientsAPI.getAll(),
          entreprisesAPI.getAll()
        ]);
        
        setClients(clientsResponse.data || clientsResponse || []);
        setEntreprises(entreprisesResponse.data || entreprisesResponse || []);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
      }
    };
    
    loadData();
  }, []);

  // Initialiser le formulaire avec les données du proforma en mode édition
  useEffect(() => {
    if (mode === 'edit' && proforma) {
      setFormData({
        numero_proforma: proforma.numero || '',
        date_proforma: proforma.date_emission ? proforma.date_emission.split('T')[0] : (proforma.date_proforma ? proforma.date_proforma.split('T')[0] : ''),
        client_id: proforma.client_id || '',
        entreprise_id: proforma.entreprise_id || '',
        statut: proforma.statut || 'EN_ATTENTE',
        montant_ht: proforma.montant_ht || 0,
        montant_tva: proforma.montant_tva || 0,
        montant_ttc: proforma.montant_ttc || 0,
        notes: proforma.notes || '',
        description: proforma.description || proforma.notes || '',
        date_validite: proforma.date_echeance ? proforma.date_echeance.split('T')[0] : (proforma.date_validite ? proforma.date_validite.split('T')[0] : ''),
        conditions_paiement: proforma.conditions_paiement || '30 jours net',
        monnaie: proforma.monnaie || 'USD'
      });
      
      // Charger les lignes existantes si disponibles
      if (proforma.lignes && proforma.lignes.length > 0) {
        setLignes(proforma.lignes);
      }
    }
  }, [mode, proforma]);

  // Calculer les montants d'une ligne
  const calculateLigneAmounts = (ligne) => {
    const quantite = parseFloat(ligne.quantite) || 0;
    const prixUnitaire = parseFloat(ligne.prix_unitaire) || 0;
    const tauxTva = parseFloat(ligne.taux_tva) || 0;
    
    const montantHT = quantite * prixUnitaire;
    const montantTVA = montantHT * (tauxTva / 100);
    const montantTTC = montantHT + montantTVA;
    
    return {
      ...ligne,
      montant_ht: montantHT,
      montant_tva: montantTVA,
      montant_ttc: montantTTC
    };
  };

  // Calculer les totaux du proforma
  const calculateTotals = (lignesData) => {
    const totals = lignesData.reduce((acc, ligne) => {
      acc.montant_ht += parseFloat(ligne.montant_ht) || 0;
      acc.montant_tva += parseFloat(ligne.montant_tva) || 0;
      acc.montant_ttc += parseFloat(ligne.montant_ttc) || 0;
      return acc;
    }, { montant_ht: 0, montant_tva: 0, montant_ttc: 0 });

    setFormData(prev => ({
      ...prev,
      ...totals
    }));
  };

  // Gérer les changements dans les lignes
  const handleLigneChange = (index, field, value) => {
    const newLignes = [...lignes];
    newLignes[index] = { ...newLignes[index], [field]: value };
    
    // Recalculer les montants pour cette ligne
    newLignes[index] = calculateLigneAmounts(newLignes[index]);
    
    setLignes(newLignes);
    calculateTotals(newLignes);
  };

  // Ajouter une nouvelle ligne
  const addLigne = () => {
    setLignes([...lignes, {
      description: '',
      quantite: 1,
      prix_unitaire: 0,
      taux_tva: 20,
      montant_ht: 0,
      montant_tva: 0,
      montant_ttc: 0
    }]);
  };

  // Supprimer une ligne
  const removeLigne = (index) => {
    if (lignes.length > 1) {
      const newLignes = lignes.filter((_, i) => i !== index);
      setLignes(newLignes);
      calculateTotals(newLignes);
    }
  };

  // Gérer les changements du formulaire principal
  const handleChange = async (e) => {
    const { name, value } = e.target;
    
    // Si c'est l'entreprise qui change et qu'on est en mode création
    if (name === 'entreprise_id' && value && mode === 'create') {
      try {
        // Importer proformasAPI dynamiquement pour éviter les dépendances circulaires
        const { default: proformasAPI } = await import('../../services/proformasAPI');
        const response = await proformasAPI.generateNumber(parseInt(value));
        
        if (response.success) {
          setFormData(prev => ({ 
            ...prev, 
            [name]: value,
            numero_proforma: response.data.numero
          }));
          return;
        }
      } catch (error) {
        console.error('Erreur lors de la génération du numéro:', error);
        // Continuer avec la mise à jour normale en cas d'erreur
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.client_id) {
      alert('Veuillez sélectionner un client');
      return;
    }
    
    if (!formData.entreprise_id) {
      alert('Veuillez sélectionner une entreprise');
      return;
    }
    
    setLoading(true);
    
    try {
      // Mapper les champs pour correspondre à l'API backend
      const proformaData = {
        ...formData,
        numero: formData.numero_proforma, // Mapping correct du champ
        date_emission: formData.date_proforma || new Date().toISOString().split('T')[0], // Date par défaut si non fournie
        date_echeance: formData.date_validite, // Utiliser date_validite comme date_echeance
        type_document: 'proforma', // S'assurer que le type est correct
        statut: formData.statut || 'EN_ATTENTE', // Statut par défaut
        lignes: lignes.filter(ligne => ligne.description.trim() !== '')
      };
      
      // Supprimer les anciens noms de champs pour éviter la confusion
      delete proformaData.numero_proforma;
      delete proformaData.date_proforma;
      delete proformaData.date_validite;
      
      await onSave(proformaData);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      alert('Erreur lors de la sauvegarde du proforma');
    } finally {
      setLoading(false);
    }
  };

  // Formatage des montants
  const formatCurrency = (amount) => {
    const currency = formData.monnaie || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(parseFloat(amount) || 0);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
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
                {mode === 'create' ? 'Nouveau proforma' : 'Modifier le proforma'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informations principales */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Numéro de proforma
                    </label>
                    <input
                      type="text"
                      name="numero_proforma"
                      value={formData.numero_proforma}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Auto-généré si vide"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date du proforma *
                    </label>
                    <input
                      type="date"
                      name="date_proforma"
                      value={formData.date_proforma}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Client *
                    </label>
                    <select
                      name="client_id"
                      value={formData.client_id}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Sélectionnez un client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Entreprise *
                    </label>
                    <select
                      name="entreprise_id"
                      value={formData.entreprise_id}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Sélectionnez une entreprise</option>
                      {entreprises.map(entreprise => (
                        <option key={entreprise.id} value={entreprise.id}>
                          {entreprise.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Statut
                    </label>
                    <select
                      name="statut"
                      value={formData.statut}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="EN_ATTENTE">En attente</option>
                      <option value="ACCEPTE">Accepté</option>
                      <option value="REFUSE">Refusé</option>
                      <option value="EXPIRE">Expiré</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date de validité
                    </label>
                    <input
                      type="date"
                      name="date_validite"
                      value={formData.date_validite}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Monnaie
                    </label>
                    <select
                      name="monnaie"
                      value={formData.monnaie}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="USD">Dollar américain ($)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="CDF">Franc congolais (FC)</option>
                      <option value="CAD">Dollar canadien (CAD$)</option>
                    </select>
                  </div>
                </div>

                {/* Lignes du proforma */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Lignes du proforma</h4>
                    <button
                      type="button"
                      onClick={addLigne}
                      className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                    >
                      Ajouter une ligne
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qté</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix unit.</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TVA %</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total HT</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {lignes.map((ligne, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={ligne.description}
                                onChange={(e) => handleLigneChange(index, 'description', e.target.value)}
                                className="w-full border-gray-300 rounded text-sm"
                                placeholder="Description de l'article"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={ligne.quantite}
                                onChange={(e) => handleLigneChange(index, 'quantite', e.target.value)}
                                className="w-20 border-gray-300 rounded text-sm"
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={ligne.prix_unitaire}
                                onChange={(e) => handleLigneChange(index, 'prix_unitaire', e.target.value)}
                                className="w-24 border-gray-300 rounded text-sm"
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={ligne.taux_tva}
                                onChange={(e) => handleLigneChange(index, 'taux_tva', e.target.value)}
                                className="w-16 border-gray-300 rounded text-sm"
                                min="0"
                                max="100"
                                step="0.01"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">
                              {formatCurrency(ligne.montant_ht)}
                            </td>
                            <td className="px-4 py-3">
                              {lignes.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeLigne(index)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Supprimer
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totaux */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-end space-x-8">
                    <div className="text-sm">
                      <span className="font-medium">Total HT: </span>
                      <span>{formatCurrency(formData.montant_ht)}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Total TVA: </span>
                      <span>{formatCurrency(formData.montant_tva)}</span>
                    </div>
                    <div className="text-lg font-bold">
                      <span>Total TTC: </span>
                      <span>{formatCurrency(formData.montant_ttc)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes et conditions */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Conditions de paiement
                    </label>
                    <input
                      type="text"
                      name="conditions_paiement"
                      value={formData.conditions_paiement}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Enregistrement...' : (mode === 'create' ? 'Créer le proforma' : 'Modifier le proforma')}
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

export default ProformaForm;