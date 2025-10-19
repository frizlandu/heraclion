import React, { useState, useMemo } from 'react';

const TestCalculs = () => {
  const [lignes, setLignes] = useState([
    {
      id: 1,
      description: 'Test',
      quantite: 1,
      prix_unitaire: 100,
      taux_tva: 20,
      montant_ht: 0,
      montant_tva: 0,
      montant_ttc: 0
    }
  ]);

  // Fonction de calcul identique à FactureForm
  const calculerLigne = (ligne) => {
    const quantite = parseFloat(ligne.quantite) || 0;
    const prix_unitaire = parseFloat(ligne.prix_unitaire) || 0;
    const taux_tva = parseFloat(ligne.taux_tva) || 0;
    
    const montant_ht = quantite * prix_unitaire;
    const montant_tva = montant_ht * (taux_tva / 100);
    const montant_ttc = montant_ht + montant_tva;
    
    return {
      ...ligne,
      quantite: quantite,
      prix_unitaire: prix_unitaire,
      taux_tva: taux_tva,
      montant_ht: parseFloat(montant_ht.toFixed(2)),
      montant_tva: parseFloat(montant_tva.toFixed(2)),
      montant_ttc: parseFloat(montant_ttc.toFixed(2))
    };
  };

  // Totaux avec useMemo
  const totaux = useMemo(() => {
    const calculatedTotaux = lignes.reduce((acc, ligne) => {
      acc.total_ht += ligne.montant_ht || 0;
      acc.total_tva += ligne.montant_tva || 0;
      acc.total_ttc += ligne.montant_ttc || 0;
      return acc;
    }, { total_ht: 0, total_tva: 0, total_ttc: 0 });

    return {
      total_ht: parseFloat(calculatedTotaux.total_ht.toFixed(2)),
      total_tva: parseFloat(calculatedTotaux.total_tva.toFixed(2)),
      total_ttc: parseFloat(calculatedTotaux.total_ttc.toFixed(2))
    };
  }, [lignes]);

  const handleChange = (field, value) => {
    const newLignes = [...lignes];
    newLignes[0] = {
      ...newLignes[0],
      [field]: parseFloat(value) || 0
    };
    
    // Recalculer la ligne
    newLignes[0] = calculerLigne(newLignes[0]);
    
    setLignes(newLignes);
  };

  const forceRecalcul = () => {
    const newLignes = lignes.map(ligne => calculerLigne(ligne));
    setLignes(newLignes);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Test Calculs Facture</h2>
      
      <div className="bg-white p-4 rounded border mb-4">
        <h3 className="font-bold mb-2">Ligne de test</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm">Quantité</label>
            <input
              type="number"
              value={lignes[0].quantite}
              onChange={(e) => handleChange('quantite', e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm">Prix unitaire</label>
            <input
              type="number"
              value={lignes[0].prix_unitaire}
              onChange={(e) => handleChange('prix_unitaire', e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm">TVA %</label>
            <input
              type="number"
              value={lignes[0].taux_tva}
              onChange={(e) => handleChange('taux_tva', e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>
        </div>
        
        <button 
          onClick={forceRecalcul}
          className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        >
          Force Recalcul
        </button>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-semibold">HT:</span> {lignes[0].montant_ht.toFixed(2)} €
          </div>
          <div>
            <span className="font-semibold">TVA:</span> {lignes[0].montant_tva.toFixed(2)} €
          </div>
          <div>
            <span className="font-semibold">TTC:</span> {lignes[0].montant_ttc.toFixed(2)} €
          </div>
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-bold mb-2">Totaux</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600">Total HT</div>
            <div className="text-lg font-bold">{totaux.total_ht.toFixed(2)} €</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total TVA</div>
            <div className="text-lg font-bold">{totaux.total_tva.toFixed(2)} €</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total TTC</div>
            <div className="text-lg font-bold">{totaux.total_ttc.toFixed(2)} €</div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 rounded">
        <h3 className="font-bold mb-2">Debug Info</h3>
        <pre className="text-xs">{JSON.stringify(lignes[0], null, 2)}</pre>
      </div>
    </div>
  );
};

export default TestCalculs;