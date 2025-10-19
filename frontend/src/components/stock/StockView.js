import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const StockView = ({ article, onClose, onEdit, onAdjustStock }) => {
  if (!article) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount) || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStockStatusBadge = () => {
    if (article.quantite_stock <= 0) {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">Rupture de stock</span>;
    } else if (article.quantite_stock <= (article.seuil_alerte || 5)) {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">Stock faible</span>;
    } else {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">Stock OK</span>;
    }
  };

  const calculateStockValue = () => {
    return article.quantite_stock * (article.prix_achat || 0);
  };

  const calculatePotentialRevenue = () => {
    return article.quantite_stock * (article.prix_vente || 0);
  };

  const calculateMarginPerUnit = () => {
    const margin = (article.prix_vente || 0) - (article.prix_achat || 0);
    const marginPercentage = article.prix_achat ? (margin / article.prix_achat) * 100 : 0;
    return { margin, marginPercentage };
  };

  const { margin, marginPercentage } = calculateMarginPerUnit();

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
                <div>
                  <h3 className="text-xl leading-6 font-bold text-gray-900">
                    {article.designation || article.nom}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">{article.reference}</p>
                </div>
                {getStockStatusBadge()}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Informations principales */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Informations générales
                      </h3>
                    </div>
                    <div className="border-t border-gray-200">
                      <dl>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Désignation</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{article.designation || article.nom}</dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Référence</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{article.reference}</dd>
                        </div>
                        {article.description && (
                          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Description</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{article.description}</dd>
                          </div>
                        )}
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Catégorie</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{article.categorie || 'Non définie'}</dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Fournisseur</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{article.fournisseur || 'Non défini'}</dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Unité</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{article.unite || 'pièce'}</dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Statut</dt>
                          <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              article.actif 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {article.actif ? 'Actif' : 'Inactif'}
                            </span>
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Informations de stock */}
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Gestion du stock
                      </h3>
                    </div>
                    <div className="border-t border-gray-200">
                      <dl>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Quantité en stock</dt>
                          <dd className="mt-1 text-lg font-bold text-gray-900 sm:mt-0 sm:col-span-2">
                            {article.quantite_stock} {article.unite || 'pièce'}
                          </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Seuil d'alerte</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {article.seuil_alerte ? `${article.seuil_alerte} ${article.unite || 'pièce'}` : 'Non défini'}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Prix et marges */}
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Tarification
                      </h3>
                    </div>
                    <div className="border-t border-gray-200">
                      <dl>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Prix d'achat unitaire</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatCurrency(article.prix_achat)}</dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Prix de vente unitaire</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatCurrency(article.prix_vente)}</dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Marge unitaire</dt>
                          <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                            <span className={`font-medium ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(margin)} ({marginPercentage.toFixed(1)}%)
                            </span>
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Historique
                      </h3>
                    </div>
                    <div className="border-t border-gray-200">
                      <dl>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Créé le</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(article.created_at)}</dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Modifié le</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(article.updated_at)}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>

                {/* Panneau latéral - Statistiques et actions */}
                <div className="space-y-6">
                  {/* Statistiques rapides */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Statistiques
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-sm font-medium text-blue-800">Valeur du stock</div>
                          <div className="text-2xl font-bold text-blue-900">{formatCurrency(calculateStockValue())}</div>
                          <div className="text-xs text-blue-600">{article.quantite_stock} × {formatCurrency(article.prix_achat)}</div>
                        </div>
                        
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-sm font-medium text-green-800">Chiffre d'affaires potentiel</div>
                          <div className="text-2xl font-bold text-green-900">{formatCurrency(calculatePotentialRevenue())}</div>
                          <div className="text-xs text-green-600">{article.quantite_stock} × {formatCurrency(article.prix_vente)}</div>
                        </div>
                        
                        <div className={`p-4 rounded-lg ${margin >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                          <div className={`text-sm font-medium ${margin >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                            Marge totale potentielle
                          </div>
                          <div className={`text-2xl font-bold ${margin >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                            {formatCurrency(article.quantite_stock * margin)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Actions
                      </h3>
                      
                      <div className="space-y-3">
                        <button
                          onClick={onAdjustStock}
                          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Ajuster le stock
                        </button>
                        
                        <button
                          onClick={onEdit}
                          className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Modifier l'article
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Alerte stock */}
                  {article.quantite_stock <= (article.seuil_alerte || 5) && (
                    <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-orange-700">
                            <strong>Stock faible !</strong><br />
                            Il ne reste que {article.quantite_stock} {article.unite || 'pièce'}(s) en stock.
                            {article.seuil_alerte && ` (Seuil d'alerte : ${article.seuil_alerte})`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Boutons de fermeture */}
              <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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

export default StockView;