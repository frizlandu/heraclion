/**
 * Test direct des calculs sans interface compliquée
 */
import React, { useState } from 'react';

const TestCalculSimple = () => {
  const [ligne, setLigne] = useState({
    description: 'Test produit',
    quantite: 2,
    prix_unitaire: 100,
    taux_tva: 20,
    montant_ht: 0,
    montant_tva: 0,
    montant_ttc: 0
  });

  const calculerEtMettreAJour = () => {
    const quantite = parseFloat(ligne.quantite) || 0;
    const prixUnitaire = parseFloat(ligne.prix_unitaire) || 0;
    const tauxTva = parseFloat(ligne.taux_tva) || 0;

    const montantHt = quantite * prixUnitaire;
    const montantTva = montantHt * (tauxTva / 100);
    const montantTtc = montantHt + montantTva;

    console.log('🧮 Calcul direct:');
    console.log(`  Quantité: ${quantite}`);
    console.log(`  Prix unitaire: ${prixUnitaire}`);
    console.log(`  Taux TVA: ${tauxTva}%`);
    console.log(`  Montant HT: ${montantHt}`);
    console.log(`  Montant TVA: ${montantTva}`);
    console.log(`  Montant TTC: ${montantTtc}`);

    setLigne(prev => ({
      ...prev,
      montant_ht: parseFloat(montantHt.toFixed(2)),
      montant_tva: parseFloat(montantTva.toFixed(2)),
      montant_ttc: parseFloat(montantTtc.toFixed(2))
    }));
  };

  const handleChange = (field, value) => {
    console.log(`🔄 Changement ${field}: ${value}`);
    setLigne(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">🧪 Test Calcul Simple</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Quantité</label>
          <input
            type="number"
            value={ligne.quantite}
            onChange={(e) => handleChange('quantite', e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Prix unitaire</label>
          <input
            type="number"
            value={ligne.prix_unitaire}
            onChange={(e) => handleChange('prix_unitaire', e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">TVA %</label>
          <select
            value={ligne.taux_tva}
            onChange={(e) => handleChange('taux_tva', e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value={0}>0%</option>
            <option value={5.5}>5.5%</option>
            <option value={10}>10%</option>
            <option value={20}>20%</option>
          </select>
        </div>
        
        <button
          onClick={calculerEtMettreAJour}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          🧮 Calculer
        </button>
        
        <div className="bg-gray-50 p-4 rounded">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Montant HT:</span>
              <span className="font-mono">{ligne.montant_ht.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span>Montant TVA:</span>
              <span className="font-mono">{ligne.montant_tva.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Montant TTC:</span>
              <span className="font-mono">{ligne.montant_ttc.toFixed(2)} €</span>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 p-3 rounded text-xs">
          <strong>Debug:</strong>
          <pre>{JSON.stringify(ligne, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default TestCalculSimple;