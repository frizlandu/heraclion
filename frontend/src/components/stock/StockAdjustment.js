import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import stockAPI from '../../services/stockAPI';

const StockAdjustment = ({ article, onClose, onSuccess }) => {
  const [adjustmentType, setAdjustmentType] = useState('add'); // 'add' ou 'remove'
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Types d'ajustement prédéfinis
  const adjustmentReasons = {
    add: [
      'Réception de marchandise',
      'Retour client',
      'Correction d\'inventaire',
      'Production interne',
      'Autre (préciser)'
    ],
    remove: [
      'Vente',
      'Perte/Vol',
      'Détérioration',
      'Retour fournisseur',
      'Correction d\'inventaire',
      'Autre (préciser)'
    ]
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!quantity || parseInt(quantity) <= 0) {
      setError('Veuillez saisir une quantité valide');
      return;
    }

    if (!reason.trim()) {
      setError('Veuillez indiquer la raison de l\'ajustement');
      return;
    }

    // Vérifier qu'on ne peut pas retirer plus que le stock disponible
    if (adjustmentType === 'remove' && parseInt(quantity) > article.quantite_stock) {
      setError(`Impossible de retirer ${quantity} articles. Stock disponible: ${article.quantite_stock}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const adjustmentData = {
        type: adjustmentType,
        quantity: parseInt(quantity),
        reason: reason.trim(),
        date: new Date().toISOString()
      };

      await stockAPI.adjustStock(article.id, adjustmentData);
      onSuccess();
    } catch (err) {
      console.error('Erreur lors de l\'ajustement:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'ajustement du stock');
    } finally {
      setLoading(false);
    }
  };

  const calculateNewStock = () => {
    if (!quantity || parseInt(quantity) <= 0) return article.quantite_stock;
    
    const qty = parseInt(quantity);
    return adjustmentType === 'add' 
      ? article.quantite_stock + qty
      : Math.max(0, article.quantite_stock - qty);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount) || 0);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
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
                Ajuster le stock
              </h3>

              {/* Informations de l'article */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-sm font-medium text-gray-900">{article.designation || article.nom}</div>
                <div className="text-sm text-gray-500">{article.reference}</div>
                <div className="mt-2">
                  <span className="text-lg font-bold text-gray-900">
                    Stock actuel: {article.quantite_stock} {article.unite || 'pièce'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Valeur: {formatCurrency(article.quantite_stock * article.prix_achat)}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type d'ajustement */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Type d'ajustement
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAdjustmentType('add');
                        setReason('');
                        setError('');
                      }}
                      className={`relative rounded-lg border p-4 flex flex-col items-center space-y-2 focus:outline-none ${
                        adjustmentType === 'add'
                          ? 'border-green-500 ring-2 ring-green-500 bg-green-50'
                          : 'border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <PlusIcon className={`h-6 w-6 ${adjustmentType === 'add' ? 'text-green-600' : 'text-gray-400'}`} />
                      <div className={`text-sm font-medium ${adjustmentType === 'add' ? 'text-green-900' : 'text-gray-900'}`}>
                        Ajouter
                      </div>
                      <div className="text-xs text-gray-500">Entrée de stock</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAdjustmentType('remove');
                        setReason('');
                        setError('');
                      }}
                      className={`relative rounded-lg border p-4 flex flex-col items-center space-y-2 focus:outline-none ${
                        adjustmentType === 'remove'
                          ? 'border-red-500 ring-2 ring-red-500 bg-red-50'
                          : 'border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <MinusIcon className={`h-6 w-6 ${adjustmentType === 'remove' ? 'text-red-600' : 'text-gray-400'}`} />
                      <div className={`text-sm font-medium ${adjustmentType === 'remove' ? 'text-red-900' : 'text-gray-900'}`}>
                        Retirer
                      </div>
                      <div className="text-xs text-gray-500">Sortie de stock</div>
                    </button>
                  </div>
                </div>

                {/* Quantité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quantité {adjustmentType === 'add' ? 'à ajouter' : 'à retirer'}
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="number"
                      min="1"
                      max={adjustmentType === 'remove' ? article.quantite_stock : undefined}
                      value={quantity}
                      onChange={(e) => {
                        setQuantity(e.target.value);
                        setError('');
                      }}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Entrez la quantité"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">{article.unite || 'pièce'}</span>
                    </div>
                  </div>
                  {adjustmentType === 'remove' && (
                    <p className="mt-1 text-sm text-gray-500">
                      Maximum: {article.quantite_stock} {article.unite || 'pièce'}
                    </p>
                  )}
                </div>

                {/* Nouveau stock (preview) */}
                {quantity && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-sm text-blue-800">
                      <strong>Nouveau stock:</strong> {calculateNewStock()} {article.unite || 'pièce'}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {adjustmentType === 'add' ? '+' : '-'}{quantity} {article.unite || 'pièce'}
                    </div>
                  </div>
                )}

                {/* Raison */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Raison de l'ajustement
                  </label>
                  <div className="mt-1">
                    <select
                      value={reason}
                      onChange={(e) => {
                        setReason(e.target.value);
                        setError('');
                      }}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Sélectionnez une raison</option>
                      {adjustmentReasons[adjustmentType].map((reasonOption) => (
                        <option key={reasonOption} value={reasonOption}>
                          {reasonOption}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Champ texte libre si "Autre" est sélectionné */}
                  {reason === 'Autre (préciser)' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Précisez la raison..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Message d'erreur */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                        <div className="mt-2 text-sm text-red-700">
                          {error}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
                    disabled={loading || !quantity || !reason}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      adjustmentType === 'add'
                        ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                        : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    }`}
                  >
                    {loading ? 'Ajustement...' : (
                      adjustmentType === 'add' ? 'Ajouter au stock' : 'Retirer du stock'
                    )}
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

export default StockAdjustment;