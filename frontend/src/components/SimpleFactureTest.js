/**
 * Test ultra-simple pour identifier le problème des totaux
 */
import React, { useState } from 'react';

const SimpleFactureTest = () => {
  const [ligne, setLigne] = useState({
    quantite: 1,
    prix_unitaire: 100,
    taux_tva: 20,
    montant_ht: 0,
    montant_tva: 0,
    montant_ttc: 0
  });

  const calculer = () => {
    const ht = ligne.quantite * ligne.prix_unitaire;
    const tva = ht * (ligne.taux_tva / 100);
    const ttc = ht + tva;
    
    setLigne(prev => ({
      ...prev,
      montant_ht: ht,
      montant_tva: tva,
      montant_ttc: ttc
    }));
  };

  const handleChange = (field, value) => {
    const newValue = parseFloat(value) || 0;
    setLigne(prev => {
      const updated = { ...prev, [field]: newValue };
      
      // Recalcul immédiat
      const ht = updated.quantite * updated.prix_unitaire;
      const tva = ht * (updated.taux_tva / 100);
      const ttc = ht + tva;
      
      return {
        ...updated,
        montant_ht: ht,
        montant_tva: tva,
        montant_ttc: ttc
      };
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Test Simple Calculs Facture</h1>
      
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Quantité</label>
            <input
              type="number"
              value={ligne.quantite}
              onChange={(e) => handleChange('quantite', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Prix unitaire (€)</label>
            <input
              type="number"
              step="0.01"
              value={ligne.prix_unitaire}
              onChange={(e) => handleChange('prix_unitaire', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">TVA (%)</label>
            <input
              type="number"
              step="0.01"
              value={ligne.taux_tva}
              onChange={(e) => handleChange('taux_tva', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={calculer}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          Recalculer Manuellement
        </button>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Résultats :</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white p-3 rounded">
              <div className="text-sm text-gray-600">Montant HT</div>
              <div className="text-xl font-bold text-blue-600">
                {ligne.montant_ht.toFixed(2)} €
              </div>
            </div>
            
            <div className="bg-white p-3 rounded">
              <div className="text-sm text-gray-600">TVA</div>
              <div className="text-xl font-bold text-green-600">
                {ligne.montant_tva.toFixed(2)} €
              </div>
            </div>
            
            <div className="bg-white p-3 rounded">
              <div className="text-sm text-gray-600">Total TTC</div>
              <div className="text-xl font-bold text-red-600">
                {ligne.montant_ttc.toFixed(2)} €
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Calcul attendu :</h4>
          <p className="text-sm">
            {ligne.quantite} × {ligne.prix_unitaire}€ = {(ligne.quantite * ligne.prix_unitaire).toFixed(2)}€ HT<br/>
            {ligne.quantite * ligne.prix_unitaire}€ × {ligne.taux_tva}% = {((ligne.quantite * ligne.prix_unitaire) * (ligne.taux_tva / 100)).toFixed(2)}€ TVA<br/>
            {(ligne.quantite * ligne.prix_unitaire).toFixed(2)}€ + {((ligne.quantite * ligne.prix_unitaire) * (ligne.taux_tva / 100)).toFixed(2)}€ = {((ligne.quantite * ligne.prix_unitaire) + ((ligne.quantite * ligne.prix_unitaire) * (ligne.taux_tva / 100))).toFixed(2)}€ TTC
          </p>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Debug Info :</h4>
          <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
            {JSON.stringify(ligne, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default SimpleFactureTest;