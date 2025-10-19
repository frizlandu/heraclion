import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ProformaView = ({ proforma, onClose }) => {
  if (!proforma) return null;

  const formatCurrency = (amount, currency = 'USD') => {
    if (!currency) currency = proforma?.monnaie || 'USD';
    
    // Pour le franc congolais, utiliser un formatage personnalisé
    if (currency === 'CDF') {
      const formattedAmount = parseFloat(amount || 0).toFixed(2);
      return `${formattedAmount} FC`;
    }
    
    const locale = currency === 'EUR' ? 'fr-FR' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(parseFloat(amount) || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusBadge = (statut) => {
    const statusConfig = {
      'EN_ATTENTE': { label: 'En attente', class: 'bg-yellow-100 text-yellow-800' },
      'ACCEPTE': { label: 'Accepté', class: 'bg-green-100 text-green-800' },
      'REFUSE': { label: 'Refusé', class: 'bg-red-100 text-red-800' },
      'EXPIRE': { label: 'Expiré', class: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[statut] || statusConfig['EN_ATTENTE'];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
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
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Détails du proforma #{proforma.numero}
                </h3>
                {getStatusBadge(proforma.statut)}
              </div>

              {/* Informations principales */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Informations générales
                  </h3>
                </div>
                <div className="border-t border-gray-200">
                  <dl>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Numéro de proforma
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {proforma.numero}
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Date d'émission
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {formatDate(proforma.date_emission || proforma.date_proforma)}
                      </dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Date d'échéance
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {formatDate(proforma.date_echeance || proforma.date_validite)}
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Client
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {proforma.client_nom || 'Non spécifié'}
                      </dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Entreprise
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {proforma.entreprise_nom || 'Non spécifiée'}
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Monnaie
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {proforma.monnaie || 'USD'}
                      </dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Conditions de paiement
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {proforma.conditions_paiement || 'Non spécifiées'}
                      </dd>
                    </div>
                    {proforma.notes && (
                      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">
                          Notes
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {proforma.notes}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {/* Lignes du proforma - Tableau similaire au formulaire */}
              {proforma.lignes && proforma.lignes.length > 0 ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Détail des lignes
                    </h3>
                  </div>
                  <div className="border-t border-gray-200">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qté</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix unit.</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TVA %</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total HT</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {proforma.lignes.map((ligne, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {ligne.description}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {ligne.quantite}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {formatCurrency(ligne.prix_unitaire, proforma.monnaie)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {ligne.taux_tva}%
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {formatCurrency(ligne.montant_ht, proforma.monnaie)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Détail des lignes
                    </h3>
                    <p className="text-sm text-gray-500 mt-2">Aucune ligne n'a été ajoutée à ce proforma.</p>
                  </div>
                </div>
              )}

              {/* Totaux */}
              <div className="bg-gray-50 px-4 py-5 sm:px-6 rounded-lg mb-6">
                <div className="flex justify-end space-x-8">
                  <div className="text-sm">
                    <span className="font-medium">Total HT: </span>
                    <span>{formatCurrency(proforma.montant_ht, proforma.monnaie)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Total TVA: </span>
                    <span>{formatCurrency(proforma.montant_tva, proforma.monnaie)}</span>
                  </div>
                  <div className="text-lg font-bold">
                    <span>Total TTC: </span>
                    <span>{formatCurrency(proforma.montant_ttc, proforma.monnaie)}</span>
                  </div>
                </div>
              </div>

              {/* Informations de suivi */}
              <div className="bg-gray-50 rounded-lg p-4 mt-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Créé le: </span>
                    <span className="text-sm text-gray-900">
                      {formatDate(proforma.created_at)}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Modifié le: </span>
                    <span className="text-sm text-gray-900">
                      {formatDate(proforma.updated_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bouton de fermeture */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={onClose}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProformaView;