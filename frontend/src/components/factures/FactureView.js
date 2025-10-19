/**
 * Composant pour afficher les détails d'une facture
 */
import React, { useState } from 'react';
import { 
  XMarkIcon, 
  DocumentArrowDownIcon, 
  EnvelopeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const FactureView = ({ facture, onClose, onGeneratePDF, onSendEmail, onEncaissement }) => {
  const [encaisseLoading, setEncaisseLoading] = useState(false);
  const [encaisseError, setEncaisseError] = useState(null);
  // Fonction pour encaisser la facture
  const handleEncaisser = async () => {
    setEncaisseLoading(true);
    setEncaisseError(null);
    try {
      // 1. Mettre à jour le statut de la facture (à adapter selon ton API)
      await fetch(`/api/documents/${facture.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'payee' })
      });
      // 2. Créer l'opération de caisse
      await fetch('/api/caisse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: facture.date_emission,
          libelle: `Encaissement facture ${facture.numero || facture.id}`,
          type: 'entree',
          categorie: 'Encaissement facture',
          montant: facture.montant_ttc || facture.montant_total || 0
        })
      });
      if (onEncaissement) onEncaissement();
    } catch (err) {
      setEncaisseError('Erreur lors de l\'encaissement');
    } finally {
      setEncaisseLoading(false);
    }
  };
  console.log('FactureView - facture reçue (COMPLÈTE):', {
    facture,
    keys: facture ? Object.keys(facture) : [],
    description: facture?.description,
    notes: facture?.notes,
    lignes: facture?.lignes,
    lignes_documents: facture?.lignes_documents,
    lignesLength: facture?.lignes?.length,
    lignesDocumentsLength: facture?.lignes_documents?.length,
    // DEBUG: Vérifier la catégorie de facture
    categorie_facture: facture?.categorie_facture,
    type_document: facture?.type_document
  });
  
  // DEBUG EXPLICITE pour la catégorie
  console.log('🔍 DEBUG CATEGORIE FACTURE:', {
    categorie_facture_value: facture?.categorie_facture,
    is_transport: facture?.categorie_facture === 'transport',
    is_non_transport: facture?.categorie_facture === 'non-transport',
    tableau_a_afficher: facture?.categorie_facture === 'transport' ? 'TRANSPORT' : 'NON-TRANSPORT'
  });
  
  if (!facture) {
    return null;
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    if (!amount) return '0,00 $';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusConfig = (status) => {
    const statusConfig = {
      'brouillon': { 
        color: 'bg-gray-100 text-gray-800', 
        icon: ClockIcon,
        label: 'Brouillon' 
      },
      'envoyee': { 
        color: 'bg-blue-100 text-blue-800', 
        icon: EnvelopeIcon,
        label: 'Envoyée' 
      },
      'payee': { 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircleIcon,
        label: 'Payée' 
      },
      'en_retard': { 
        color: 'bg-red-100 text-red-800', 
        icon: ExclamationCircleIcon,
        label: 'En retard' 
      }
    };
    return statusConfig[status] || statusConfig['brouillon'];
  };

  const statusConfig = getStatusConfig(facture?.statut);
  const StatusIcon = statusConfig.icon;

  // Debug: Afficher les données de la facture
  console.log('FactureView - Données reçues:', {
    id: facture?.id,
    lignes: facture?.lignes,
    lignesLength: facture?.lignes?.length,
    montant_ht: facture?.montant_ht,
    montant_tva: facture?.montant_tva,
    montant_ttc: facture?.montant_ttc,
    montant_total: facture?.montant_total
  });

  // Calculer les totaux - utiliser les lignes si elles existent et ne sont pas vides, sinon les montants globaux
  const lignesData = facture.lignes || facture.lignes_documents || [];
  const totaux = (lignesData && lignesData.length > 0) 
    ? lignesData.reduce((acc, ligne) => {
        acc.total_ht += parseFloat(ligne.montant_ht) || 0;
        acc.total_tva += parseFloat(ligne.montant_tva) || 0;
        acc.total_ttc += parseFloat(ligne.montant_ttc) || 0;
        return acc;
      }, { total_ht: 0, total_tva: 0, total_ttc: 0 })
    : {
        total_ht: parseFloat(facture?.montant_ht) || 0,
        total_tva: parseFloat(facture?.montant_tva) || 0,
        total_ttc: parseFloat(facture?.montant_total || facture?.montant_ttc) || 0
      };

  console.log('FactureView - Totaux calculés:', totaux);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white mb-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-gray-900">
              Facture {facture.numero || `F${facture.id?.toString().padStart(4, '0')}`}
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {facture?.statut && facture.statut !== 'brouillon' && (
              <>
                <button
                  onClick={() => onGeneratePDF && onGeneratePDF(facture)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  PDF
                </button>
                {facture?.statut && facture.statut !== 'payee' && (
                  <>
                    <button
                      onClick={() => onSendEmail && onSendEmail(facture)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <EnvelopeIcon className="h-4 w-4 mr-2" />
                      Envoyer
                    </button>
                    {/* Bouton Encaisser */}
                    <button
                      onClick={handleEncaisser}
                      className="inline-flex items-center px-3 py-2 border border-green-600 shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      disabled={encaisseLoading}
                    >
                      {encaisseLoading ? 'Encaissement...' : 'Encaisser'}
                    </button>
                    {encaisseError && <span className="text-red-600 ml-2">{encaisseError}</span>}
                  </>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="mt-6 space-y-6">
          {/* Informations client et dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations client */}
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <UserIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h4 className="text-lg font-semibold text-gray-900">Client</h4>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Nom</p>
                  <p className="text-gray-900">{facture.client_nom || 'Non renseigné'}</p>
                </div>
                {facture.client_email && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-gray-900">
                      <a 
                        href={`mailto:${facture.client_email}`}
                        className="text-blue-600 hover:text-blue-500"
                      >
                        {facture.client_email}
                      </a>
                    </p>
                  </div>
                )}
                {facture.client_adresse && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Adresse</p>
                    <p className="text-gray-900 whitespace-pre-line">{facture.client_adresse}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Informations dates et montant */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <CalendarIcon className="h-6 w-6 text-gray-600 mr-2" />
                <h4 className="text-lg font-semibold text-gray-900">Informations</h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Date d'émission:</span>
                  <span className="text-gray-900">{formatDate(facture.date_emission)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Date d'échéance:</span>
                  <span className="text-gray-900">{formatDate(facture.date_echeance)}</span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-5 w-5 text-green-600 mr-1" />
                      <span className="text-sm font-medium text-gray-700">Montant total:</span>
                    </div>
                    <span className="text-xl font-bold text-green-600">
                      {formatAmount(totaux.total_ttc)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {(() => {
            console.log('Condition description:', {
              description: facture.description,
              notes: facture.notes,
              hasDescription: !!facture.description,
              hasNotes: !!facture.notes,
              descriptionType: typeof facture.description,
              notesType: typeof facture.notes
            });
            return facture.notes || facture.description;
          })() && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Description</h4>
              <p className="text-gray-700 whitespace-pre-line">{facture.notes || facture.description}</p>
            </div>
          )}

          {/* Lignes de facture */}
          {(() => {
            const lignes = facture.lignes || facture.lignes_documents || [];
            console.log('Condition tableau (DÉTAILLÉE):', {
              lignesExist: !!facture.lignes,
              lignesLength: facture.lignes?.length,
              lignesDocumentsExist: !!facture.lignes_documents, 
              lignesDocumentsLength: facture.lignes_documents?.length,
              finalLignes: lignes,
              finalLignesLength: lignes?.length,
              shouldShow: lignes && lignes.length > 0
            });
            return lignes && lignes.length > 0;
          })() && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900">Détail des prestations</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {(facture.categorie_facture === 'transport') ? (
                        // Colonnes pour factures TRANSPORT (même ordre que FactureForm.js)
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P/IMMAT</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Désignation</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tonne</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total/Poids</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix unitaire</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total (HT)</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frais Admin</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TVA%</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total (TVA)</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Général</th>
                        </>
                      ) : (
                        // Colonnes pour factures NON-TRANSPORT (même ordre que FactureForm.js)  
                        // Par défaut pour 'non-transport' ou toute autre valeur
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Désignation</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unité</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix unitaire</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total (HT)</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TVA%</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total (TVA)</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Général</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(facture.lignes || facture.lignes_documents || []).map((ligne, index) => (
                      <tr key={ligne.id || index}>
                        {(facture.categorie_facture === 'transport') ? (
                          // Ligne TRANSPORT - Même ordre que FactureForm.js
                          <>
                            {/* Item */}
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {ligne.item || ''}
                            </td>
                            {/* Date */}
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {ligne.date_transport ? new Date(ligne.date_transport).toLocaleDateString('fr-FR') : ''}
                            </td>
                            {/* P/IMMAT */}
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {ligne.plaque_immat || ''}
                            </td>
                            {/* Désignation */}
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {ligne.description || ''}
                            </td>
                            {/* Ticket */}
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {ligne.ticket || ''}
                            </td>
                            {/* Tonne */}
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {ligne.tonnes ? parseFloat(ligne.tonnes).toFixed(2) : '0.00'}
                            </td>
                            {/* Total/Poids */}
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {ligne.total_poids ? parseFloat(ligne.total_poids).toFixed(0) : '0'}
                            </td>
                            {/* Prix unitaire */}
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {formatAmount(ligne.prix_unitaire)}
                            </td>
                            {/* Total (HT) */}
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {formatAmount(ligne.montant_ht)}
                            </td>
                            {/* Frais Admin */}
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {ligne.frais_administratif ? formatAmount(ligne.frais_administratif) : formatAmount(0)}
                            </td>
                            {/* TVA% */}
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {ligne.taux_tva || 0}%
                            </td>
                            {/* Total (TVA) */}
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {formatAmount(ligne.montant_tva)}
                            </td>
                            {/* Total Général */}
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {formatAmount(ligne.montant_ttc)}
                            </td>
                          </>
                        ) : (
                          // Ligne NON-TRANSPORT - Même ordre que FactureForm.js
                          // Par défaut pour 'non-transport' ou toute autre valeur
                          <>
                            {/* Item */}
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {ligne.item || ''}
                            </td>
                            {/* Désignation */}
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {ligne.description || ''}
                            </td>
                            {/* Unité */}
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {ligne.unite || ''}
                            </td>
                            {/* Quantité */}
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {ligne.quantite || '1'}
                            </td>
                            {/* Prix unitaire */}
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {formatAmount(ligne.prix_unitaire)}
                            </td>
                            {/* Total (HT) */}
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {formatAmount(ligne.montant_ht)}
                            </td>
                            {/* TVA% */}
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {ligne.taux_tva || 0}%
                            </td>
                            {/* Total (TVA) */}
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {formatAmount(ligne.montant_tva)}
                            </td>
                            {/* Total Général (TTC) */}
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {formatAmount(ligne.montant_ttc)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Récapitulatif des totaux */}
          <div className="bg-indigo-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Récapitulatif</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total HT:</span>
                <span className="font-medium text-gray-900">{formatAmount(totaux.total_ht)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total TVA:</span>
                <span className="font-medium text-gray-900">{formatAmount(totaux.total_tva)}</span>
              </div>
              <div className="border-t border-indigo-200 pt-2">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total TTC:</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {formatAmount(totaux.total_ttc)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Informations système */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Informations système</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Créée le:</span>
                <span className="ml-2">{formatDate(facture.created_at)}</span>
              </div>
              <div>
                <span className="font-medium">Modifiée le:</span>
                <span className="ml-2">{formatDate(facture.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default FactureView;