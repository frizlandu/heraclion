/**
 * Composant formulaire pour créer/modifier une facture
 */
import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { clientsAPI } from '../../services/clientsAPI';
import { entreprisesAPI } from '../../services/entreprisesAPI';
import TotalFacture from './TotalFacture';

const FactureForm = ({ facture, mode, onSubmit, onCancel, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    numero: '',
    entreprise_id: '',
    categorie_facture: 'non-transport',
    client_id: '',
    client_nom: '',
    client_email: '',
    client_adresse: '',
    date_emission: new Date().toISOString().split('T')[0],
    date_echeance: '',
    description: '',
    statut: 'brouillon',
    type_facture: 'normale',
    lignes: [{
      id: Date.now(), // ID unique pour React keys
      description: '',
      // Champs spécifiques transport
      item: '',
      date_transport: '',
      plaque_immat: '',
      ticket: '',
      tonnes: 0,
      total_poids: 0,
      frais_administratif: 0,
      // Champs standard
      quantite: 1,
      prix_unitaire: 0,
      taux_tva: 20,
      montant_ht: 0,
      montant_tva: 0,
      montant_ttc: 0
    }]
  });

  const [entreprises, setEntreprises] = useState([]);
  const [clients, setClients] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Charger les clients et entreprises au montage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger les clients
        const clientsData = await clientsAPI.getAll();
        if (Array.isArray(clientsData)) {
          setClients(clientsData);
        } else if (clientsData && Array.isArray(clientsData.data)) {
          setClients(clientsData.data);
        } else {
          console.warn('Format de données clients inattendu:', clientsData);
          setClients([]);
        }

        // Charger les entreprises
        const entreprisesData = await entreprisesAPI.getAll();
        if (Array.isArray(entreprisesData)) {
          setEntreprises(entreprisesData);
        } else if (entreprisesData && Array.isArray(entreprisesData.data)) {
          setEntreprises(entreprisesData.data);
        } else {
          console.warn('Format de données entreprises inattendu:', entreprisesData);
          setEntreprises([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setClients([]);
        setEntreprises([]);
      }
    };
    loadData();
  }, []);

  // Initialiser le formulaire avec les données de la facture
  useEffect(() => {
    if (facture && mode === 'edit') {
      setFormData({
        ...facture,
        date_emission: facture.date_emission?.split('T')[0] || new Date().toISOString().split('T')[0],
        date_echeance: facture.date_echeance?.split('T')[0] || '',
        lignes: facture.lignes && facture.lignes.length > 0 ? facture.lignes : [
          {
            id: Date.now(),
            description: '',
            item: '',
            date_transport: '',
            plaque_immat: '',
            ticket: '',
            tonnes: 0,
            total_poids: 0,
            frais_administratif: 0,
            quantite: 1,
            prix_unitaire: 0,
            taux_tva: 20,
            montant_ht: 0,
            montant_tva: 0,
            montant_ttc: 0
          }
        ]
      });
    }
  }, [facture, mode]);

  // Forcer le recalcul des montants au montage et quand les lignes changent
  useEffect(() => {
    setFormData(prev => {
      const newLignes = prev.lignes.map(ligne => {
        const quantite = parseFloat(ligne.quantite) || 0;
        const prixUnitaire = parseFloat(ligne.prix_unitaire) || 0;
        const tauxTva = parseFloat(ligne.taux_tva) || 20;
        const fraisAdministratif = parseFloat(ligne.frais_administratif) || 0;
        
        // Calcul automatique du total/poids pour les factures transport
        const tonnes = parseFloat(ligne.tonnes) || 0;
        const totalPoidsCalcule = tonnes * 1000;
        
        const ligneModifiee = { ...ligne };
        
        // Recalculer les montants si on a des valeurs
        if (quantite > 0 || prixUnitaire > 0) {
          const montants = calculerLigne(quantite, prixUnitaire, tauxTva, fraisAdministratif);
          Object.assign(ligneModifiee, montants);
        }
        
        // Mettre à jour le total/poids si nécessaire
        if (formData.categorie_facture === 'transport' && ligneModifiee.total_poids !== totalPoidsCalcule) {
          ligneModifiee.total_poids = totalPoidsCalcule;
        }
        
        return ligneModifiee;
      });
      
      // Ne mettre à jour que si quelque chose a changé
      const hasChanged = newLignes.some((ligne, index) => {
        const oldLigne = prev.lignes[index];
        return oldLigne && (
          ligne.montant_ht !== oldLigne.montant_ht ||
          ligne.montant_tva !== oldLigne.montant_tva ||
          ligne.montant_ttc !== oldLigne.montant_ttc ||
          ligne.total_poids !== oldLigne.total_poids
        );
      });
      
      return hasChanged ? { ...prev, lignes: newLignes } : prev;
    });
  }, [formData.categorie_facture]);

  // Calculer une ligne
  const calculerLigne = (quantite, prixUnitaire, tauxTva, fraisAdministratif = 0) => {
    const montantBase = quantite * prixUnitaire;
    const montantHt = montantBase + fraisAdministratif;
    const montantTva = montantHt * (tauxTva / 100);
    const montantTtc = montantHt + montantTva;

    return {
      montant_ht: parseFloat(montantHt.toFixed(2)),
      montant_tva: parseFloat(montantTva.toFixed(2)),
      montant_ttc: parseFloat(montantTtc.toFixed(2))
    };
  };

  // Générer le prochain numéro de facture selon le format spécifique
  const genererProchainNumero = (entrepriseId, categorieFacture) => {
    if (!entrepriseId || !categorieFacture) return '';
    
    const entreprise = entreprises.find(e => e.id === parseInt(entrepriseId));
    if (!entreprise) return '';
    
    let prefixEntreprise = '';
    switch (entreprise.nom.toLowerCase()) {
      case 'heraclion':
      case 'héraclion':
        prefixEntreprise = 'HRAKIN';
        break;
      case 'mgt':
      case 'management':
        prefixEntreprise = 'MGT';
        break;
      case 'transkin':
      case 'transport':
        prefixEntreprise = 'TRANSKIN';
        break;
      default:
        prefixEntreprise = entreprise.nom.substring(0, 6).toUpperCase().replace(/\s/g, '');
        break;
    }
    
    const date = new Date();
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const annee = date.getFullYear();
    const compteur = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
    
    if (categorieFacture === 'transport') {
      return `${prefixEntreprise}/${compteur}/T/${mois}/${annee}`;
    } else {
      return `${prefixEntreprise}/${compteur}/${mois}/${annee}`;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleClientChange = (e) => {
    const clientId = e.target.value;
    const client = clients.find(c => c.id === parseInt(clientId));
    
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      client_nom: client ? client.nom : '',
      client_email: client ? client.email : '',
      client_adresse: client ? client.adresse : ''
    }));

    if (errors.client_id) {
      setErrors(prev => ({ ...prev, client_id: '' }));
    }
  };

  const handleEntrepriseChange = (e) => {
    const entrepriseId = e.target.value;
    setFormData(prev => {
      const newData = { ...prev, entreprise_id: entrepriseId };
      if (entrepriseId && prev.categorie_facture) {
        newData.numero = genererProchainNumero(entrepriseId, prev.categorie_facture);
      }
      return newData;
    });
  };

  const handleCategorieChange = (e) => {
    const categorie = e.target.value;
    setFormData(prev => {
      const newData = { ...prev, categorie_facture: categorie };
      if (prev.entreprise_id && categorie) {
        newData.numero = genererProchainNumero(prev.entreprise_id, categorie);
      }
      return newData;
    });
  };

  const handleLigneChange = (index, field, value) => {
    setFormData(prev => {
      const newLignes = [...prev.lignes];
      const ligne = { ...newLignes[index] };
      
      // Mettre à jour le champ modifié avec la bonne conversion
      if (['quantite', 'prix_unitaire', 'taux_tva', 'tonnes', 'total_poids', 'frais_administratif'].includes(field)) {
        ligne[field] = parseFloat(value) || 0;
      } else {
        ligne[field] = value;
      }
      
      // Recalculer les montants si c'est un champ numérique qui affecte le calcul
      if (['quantite', 'prix_unitaire', 'taux_tva', 'frais_administratif'].includes(field)) {
        const quantite = parseFloat(ligne.quantite) || 0;
        const prixUnitaire = parseFloat(ligne.prix_unitaire) || 0;
        const tauxTva = parseFloat(ligne.taux_tva) || 0;
        const fraisAdministratif = parseFloat(ligne.frais_administratif) || 0;
        
        const montants = calculerLigne(quantite, prixUnitaire, tauxTva, fraisAdministratif);
        ligne.montant_ht = montants.montant_ht;
        ligne.montant_tva = montants.montant_tva;
        ligne.montant_ttc = montants.montant_ttc;
      }
      
      // Calcul automatique du TOTAL/POIDS basé sur les tonnes (pour transport)
      if (field === 'tonnes') {
        const tonnes = parseFloat(value) || 0;
        ligne.total_poids = tonnes * 1000;
      }
      
      newLignes[index] = ligne;
      
      return {
        ...prev,
        lignes: newLignes
      };
    });
  };

  const ajouterLigne = () => {
    const nouvelleLigne = {
      id: Date.now() + Math.random(),
      description: '',
      item: '',
      date_transport: '',
      plaque_immat: '',
      ticket: '',
      tonnes: 0,
      total_poids: 0,
      frais_administratif: 0,
      quantite: 1,
      prix_unitaire: 0,
      taux_tva: 20,
      montant_ht: 0,
      montant_tva: 0,
      montant_ttc: 0
    };
    
    setFormData(prev => ({
      ...prev,
      lignes: [...prev.lignes, nouvelleLigne]
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

    if (!formData.entreprise_id) newErrors.entreprise_id = 'L\'entreprise est requise';
    if (!formData.categorie_facture) newErrors.categorie_facture = 'La catégorie est requise';
    if (!formData.numero) newErrors.numero = 'Le numéro est requis';
    if (!formData.client_id) newErrors.client_id = 'Le client est requis';
    if (!formData.date_emission) newErrors.date_emission = 'La date d\'émission est requise';
    if (!formData.date_echeance) newErrors.date_echeance = 'La date d\'échéance est requise';

    // Validation des lignes
    formData.lignes.forEach((ligne, index) => {
      if (!ligne.description) {
        newErrors[`ligne_${index}_description`] = 'La description est requise';
      }
      if (!ligne.quantite || ligne.quantite <= 0) {
        newErrors[`ligne_${index}_quantite`] = 'La quantité doit être supérieure à 0';
      }
      if (!ligne.prix_unitaire || ligne.prix_unitaire <= 0) {
        newErrors[`ligne_${index}_prix_unitaire`] = 'Le prix unitaire doit être supérieur à 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const totaux = formData.lignes.reduce((acc, ligne) => {
        acc.total_ht += parseFloat(ligne.montant_ht) || 0;
        acc.total_tva += parseFloat(ligne.montant_tva) || 0;
        acc.total_ttc += parseFloat(ligne.montant_ttc) || 0;
        return acc;
      }, { total_ht: 0, total_tva: 0, total_ttc: 0 });

      const factureData = {
        ...formData,
        total_ht: parseFloat(totaux.total_ht.toFixed(2)),
        total_tva: parseFloat(totaux.total_tva.toFixed(2)),
        total_ttc: parseFloat(totaux.total_ttc.toFixed(2))
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
      <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white mb-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {mode === 'create' ? 'Nouvelle facture' : 'Modifier la facture'}
          </h3>
          <button
            onClick={onClose || onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sélecteur d'entreprise */}
            <div>
              <label htmlFor="entreprise_id" className="block text-sm font-medium text-gray-700 mb-1">
                Entreprise <span className="text-red-500">*</span>
              </label>
              <select
                id="entreprise_id"
                name="entreprise_id"
                value={formData.entreprise_id}
                onChange={handleEntrepriseChange}
                className={`w-full p-2 border rounded-md ${errors.entreprise_id ? 'border-red-500' : 'border-gray-300'}`}
                autoComplete="off"
              >
                <option value="">Sélectionner une entreprise</option>
                {Array.isArray(entreprises) && entreprises.map(entreprise => (
                  <option key={entreprise.id} value={entreprise.id}>
                    {entreprise.nom}
                  </option>
                ))}
              </select>
              {errors.entreprise_id && <p className="text-red-500 text-xs mt-1">{errors.entreprise_id}</p>}
            </div>

            {/* Sélecteur de catégorie de facture */}
            <div>
              <label htmlFor="categorie_facture" className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                id="categorie_facture"
                name="categorie_facture"
                value={formData.categorie_facture}
                onChange={handleCategorieChange}
                className={`w-full p-2 border rounded-md ${errors.categorie_facture ? 'border-red-500' : 'border-gray-300'}`}
                autoComplete="off"
              >
                <option value="non-transport">Non Transport</option>
                <option value="transport">Transport</option>
              </select>
              {errors.categorie_facture && <p className="text-red-500 text-xs mt-1">{errors.categorie_facture}</p>}
            </div>

            {/* Numéro de facture (généré automatiquement) */}
            <div>
              <label htmlFor="numero" className="block text-sm font-medium text-gray-700 mb-1">
                Numéro de facture
              </label>
              <input
                id="numero"
                type="text"
                name="numero"
                value={formData.numero}
                className={`w-full p-2 border rounded-md bg-gray-50 ${errors.numero ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Sera généré automatiquement"
                autoComplete="off"
                readOnly
              />
              {errors.numero && <p className="text-red-500 text-xs mt-1">{errors.numero}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-1">
                Client <span className="text-red-500">*</span>
              </label>
              <select
                id="client_id"
                name="client_id"
                value={formData.client_id}
                onChange={handleClientChange}
                className={`w-full p-2 border rounded-md ${errors.client_id ? 'border-red-500' : 'border-gray-300'}`}
                autoComplete="off"
              >
                <option value="">Sélectionner un client</option>
                {Array.isArray(clients) && clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.nom}
                  </option>
                ))}
              </select>
              {errors.client_id && <p className="text-red-500 text-xs mt-1">{errors.client_id}</p>}
            </div>

            <div>
              <label htmlFor="date_emission" className="block text-sm font-medium text-gray-700 mb-1">
                Date d'émission <span className="text-red-500">*</span>
              </label>
              <input
                id="date_emission"
                type="date"
                name="date_emission"
                value={formData.date_emission}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${errors.date_emission ? 'border-red-500' : 'border-gray-300'}`}
                autoComplete="off"
              />
              {errors.date_emission && <p className="text-red-500 text-xs mt-1">{errors.date_emission}</p>}
            </div>

            <div>
              <label htmlFor="date_echeance" className="block text-sm font-medium text-gray-700 mb-1">
                Date d'échéance <span className="text-red-500">*</span>
              </label>
              <input
                id="date_echeance"
                type="date"
                name="date_echeance"
                value={formData.date_echeance}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${errors.date_echeance ? 'border-red-500' : 'border-gray-300'}`}
                autoComplete="off"
              />
              {errors.date_echeance && <p className="text-red-500 text-xs mt-1">{errors.date_echeance}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Description de la facture..."
              autoComplete="off"
            />
          </div>

          {/* Lignes de facture */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">Lignes de facture</h4>
              <button
                type="button"
                onClick={ajouterLigne}
                className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
                    <tr key={ligne.id || index}>
                      {/* Item */}
                      <td className="px-2 py-2">
                        <input
                          id={`ligne_${index}_item`}
                          name={`ligne_${index}_item`}
                          type="text"
                          value={ligne.item || ''}
                          onChange={(e) => handleLigneChange(index, 'item', e.target.value)}
                          className="w-16 p-1 border border-gray-300 rounded text-sm"
                          placeholder="Item"
                          autoComplete="off"
                        />
                      </td>
                      
                      {/* Date */}
                      <td className="px-2 py-2">
                        <input
                          id={`ligne_${index}_date_transport`}
                          name={`ligne_${index}_date_transport`}
                          type="date"
                          value={ligne.date_transport || ''}
                          onChange={(e) => handleLigneChange(index, 'date_transport', e.target.value)}
                          className="w-32 p-1 border border-gray-300 rounded text-sm"
                          autoComplete="off"
                        />
                      </td>
                      
                      {/* P/Immat */}
                      <td className="px-2 py-2">
                        <input
                          id={`ligne_${index}_plaque_immat`}
                          name={`ligne_${index}_plaque_immat`}
                          type="text"
                          value={ligne.plaque_immat || ''}
                          onChange={(e) => handleLigneChange(index, 'plaque_immat', e.target.value)}
                          className="w-20 p-1 border border-gray-300 rounded text-sm"
                          placeholder="AB-123-CD"
                          autoComplete="off"
                        />
                      </td>
                      
                      {/* Désignation */}
                      <td className="px-2 py-2">
                        <input
                          id={`ligne_${index}_description`}
                          name={`ligne_${index}_description`}
                          type="text"
                          value={ligne.description}
                          onChange={(e) => handleLigneChange(index, 'description', e.target.value)}
                          className="w-32 p-1 border border-gray-300 rounded text-sm"
                          placeholder="Désignation"
                          autoComplete="off"
                        />
                      </td>
                      
                      {/* Ticket */}
                      <td className="px-2 py-2">
                        <input
                          id={`ligne_${index}_ticket`}
                          name={`ligne_${index}_ticket`}
                          type="text"
                          value={ligne.ticket || ''}
                          onChange={(e) => handleLigneChange(index, 'ticket', e.target.value)}
                          className="w-20 p-1 border border-gray-300 rounded text-sm"
                          placeholder="Ticket"
                          autoComplete="off"
                        />
                      </td>
                      
                      {/* Tonnes */}
                      <td className="px-2 py-2">
                        <input
                          id={`ligne_${index}_tonnes`}
                          name={`ligne_${index}_tonnes`}
                          type="number"
                          value={ligne.tonnes || 0}
                          onChange={(e) => handleLigneChange(index, 'tonnes', e.target.value)}
                          className="w-20 p-1 border border-gray-300 rounded text-sm"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          autoComplete="off"
                        />
                      </td>
                      
                      {/* Total/Poids (automatique) */}
                      <td className="px-2 py-2">
                        <input
                          id={`ligne_${index}_total_poids`}
                          name={`ligne_${index}_total_poids`}
                          type="number"
                          value={ligne.total_poids || 0}
                          className="w-20 p-1 border border-gray-200 rounded text-sm bg-gray-50 text-gray-600"
                          readOnly
                          placeholder="Auto"
                          title="Calculé automatiquement : Tonnes × 1000"
                        />
                      </td>
                      
                      {/* Prix Unit */}
                      <td className="px-2 py-2">
                        <input
                          id={`ligne_${index}_prix_unitaire`}
                          name={`ligne_${index}_prix_unitaire`}
                          type="number"
                          value={ligne.prix_unitaire}
                          onChange={(e) => handleLigneChange(index, 'prix_unitaire', e.target.value)}
                          className="w-20 p-1 border border-gray-300 rounded text-sm"
                          min="0"
                          step="0.01"
                          autoComplete="off"
                        />
                      </td>
                      
                      {/* Frais Administratif */}
                      <td className="px-2 py-2">
                        <input
                          id={`ligne_${index}_frais_administratif`}
                          name={`ligne_${index}_frais_administratif`}
                          type="number"
                          value={ligne.frais_administratif || 0}
                          onChange={(e) => handleLigneChange(index, 'frais_administratif', e.target.value)}
                          className="w-20 p-1 border border-gray-300 rounded text-sm"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          autoComplete="off"
                        />
                      </td>
                      
                      {/* TVA% */}
                      <td className="px-2 py-2">
                        <select
                          id={`ligne_${index}_taux_tva`}
                          name={`ligne_${index}_taux_tva`}
                          value={ligne.taux_tva}
                          onChange={(e) => handleLigneChange(index, 'taux_tva', e.target.value)}
                          className="w-16 p-1 border border-gray-300 rounded text-sm"
                          autoComplete="off"
                        >
                          <option value={0}>0%</option>
                          <option value={5.5}>5.5%</option>
                          <option value={10}>10%</option>
                          <option value={20}>20%</option>
                        </select>
                      </td>
                      
                      {/* Total(HT) */}
                      <td className="px-2 py-2">
                        <div className="w-20 p-1 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded">
                          {(ligne.montant_ht || 0).toFixed(2)} €
                        </div>
                      </td>
                      
                      {/* Total(TVA) */}
                      <td className="px-2 py-2">
                        <div className="w-20 p-1 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded">
                          {(ligne.montant_tva || 0).toFixed(2)} €
                        </div>
                      </td>
                      
                      {/* Total Général (TTC) */}
                      <td className="px-2 py-2">
                        <div className="w-20 p-1 text-sm font-semibold text-gray-900 bg-blue-50 border border-blue-200 rounded">
                          {(ligne.montant_ttc || 0).toFixed(2)} €
                        </div>
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
          </div>

          {/* Totaux */}
          <TotalFacture lignes={formData.lignes} />

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel || onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : (mode === 'create' ? 'Créer la facture' : 'Modifier la facture')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FactureForm;