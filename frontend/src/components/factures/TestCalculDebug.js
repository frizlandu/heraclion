/**
 * Composant de test pour déboguer les calculs de facture
 */
import React, { useState } from 'react';

const TestCalculDebug = () => {
  const [lignes, setLignes] = useState([
    {
      description: 'Produit test',
      quantite: 2,
      prix_unitaire: 100,
      taux_tva: 20,
      montant_ht: 0,
      montant_tva: 0,
      montant_ttc: 0
    }
  ]);

  const calculerLigne = (quantite, prixUnitaire, tauxTva) => {
    const montantHt = quantite * prixUnitaire;
    const montantTva = montantHt * (tauxTva / 100);
    const montantTtc = montantHt + montantTva;

    return {
      montant_ht: parseFloat(montantHt.toFixed(2)),
      montant_tva: parseFloat(montantTva.toFixed(2)),
      montant_ttc: parseFloat(montantTtc.toFixed(2))
    };
  };

  const handleChange = (index, field, value) => {
    console.log(`🔄 Changement: ${field} = ${value}`);
    
    setLignes(prev => {
      const newLignes = [...prev];
      const ligne = { ...newLignes[index] };
      
      ligne[field] = parseFloat(value) || 0;
      
      // Recalculer si nécessaire
      if (['quantite', 'prix_unitaire', 'taux_tva'].includes(field)) {
        const montants = calculerLigne(ligne.quantite, ligne.prix_unitaire, ligne.taux_tva);
        console.log('📊 Montants calculés:', montants);
        Object.assign(ligne, montants);
      }
      
      newLignes[index] = ligne;
      console.log('🏷️  Nouvelle ligne:', ligne);
      
      return newLignes;
    });
  };

  // Calcul des totaux
  const totaux = lignes.reduce((acc, ligne) => {
    acc.total_ht += ligne.montant_ht || 0;
    acc.total_tva += ligne.montant_tva || 0;
    acc.total_ttc += ligne.montant_ttc || 0;
    return acc;
  }, { total_ht: 0, total_tva: 0, total_ttc: 0 });

  console.log('💰 Totaux calculés:', totaux);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔧 Test Debug Calculs</h1>
      
      <div className="bg-white shadow rounded-lg p-6">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Qté</th>
              <th className="p-3 text-left">Prix Unit.</th>
              <th className="p-3 text-left">TVA %</th>
              <th className="p-3 text-left">HT</th>
              <th className="p-3 text-left">TVA</th>
              <th className="p-3 text-left">TTC</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne, index) => (
              <tr key={index}>
                <td className="p-3">
                  <input
                    type="text"
                    value={ligne.description}
                    onChange={(e) => handleChange(index, 'description', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    value={ligne.quantite}
                    onChange={(e) => handleChange(index, 'quantite', e.target.value)}
                    className="w-20 p-2 border rounded"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    value={ligne.prix_unitaire}
                    onChange={(e) => handleChange(index, 'prix_unitaire', e.target.value)}
                    className="w-24 p-2 border rounded"
                  />
                </td>
                <td className="p-3">
                  <select
                    value={ligne.taux_tva}
                    onChange={(e) => handleChange(index, 'taux_tva', e.target.value)}
                    className="w-20 p-2 border rounded"
                  >
                    <option value={0}>0%</option>
                    <option value={5.5}>5.5%</option>
                    <option value={10}>10%</option>
                    <option value={20}>20%</option>
                  </select>
                </td>
                <td className="p-3 font-mono text-right">
                  {ligne.montant_ht?.toFixed(2) || '0.00'} €
                </td>
                <td className="p-3 font-mono text-right">
                  {ligne.montant_tva?.toFixed(2) || '0.00'} €
                </td>
                <td className="p-3 font-mono text-right">
                  {ligne.montant_ttc?.toFixed(2) || '0.00'} €
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 bg-gray-50 p-4 rounded">
          <div className="grid grid-cols-3 gap-4 text-right">
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

        <div className="mt-4 p-4 bg-blue-50 rounded">
          <h3 className="font-bold">Debug Info:</h3>
          <pre className="text-xs mt-2">
            {JSON.stringify(lignes, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default TestCalculDebug;