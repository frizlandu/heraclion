/**
 * Composant pour afficher les totaux de facture - version simple et isolée
 */
import React from 'react';

const TotalFacture = ({ lignes = [] }) => {
  // Calcul direct et simple des totaux
  let total_ht = 0;
  let total_tva = 0;
  let total_ttc = 0;

  lignes.forEach(ligne => {
    const ht = parseFloat(ligne.montant_ht) || 0;
    const tva = parseFloat(ligne.montant_tva) || 0;
    const ttc = parseFloat(ligne.montant_ttc) || 0;
    
    total_ht += ht;
    total_tva += tva;
    total_ttc += ttc;
  });

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="grid grid-cols-3 gap-4 text-right">
        <div>
          <div className="text-sm text-gray-600">Total HT</div>
          <div className="text-lg font-medium text-gray-900">
            {total_ht.toFixed(2)} $
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Total TVA</div>
          <div className="text-lg font-medium text-gray-900">
            {total_tva.toFixed(2)} $
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Total TTC</div>
          <div className="text-xl font-bold text-gray-900">
            {total_ttc.toFixed(2)} $
          </div>
        </div>
      </div>
      
      {/* Debug info */}
      <div className="mt-2 text-xs text-gray-400">
        Lignes: {lignes.length} | Calculé: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default TotalFacture;