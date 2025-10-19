import React, { useState } from 'react';
import proformasAPI from '../services/proformasAPI';

const TestProformaCreate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const testCreateProforma = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const testData = {
        type_document: 'proforma',
        numero: 'FRONTEND-TEST-001',
        client_id: 1,
        entreprise_id: 1,
        date_emission: new Date().toISOString().split('T')[0],
        monnaie: 'USD',
        montant_ht: 500,
        montant_ttc: 600,
        statut: 'EN_ATTENTE',
        lignes: [
          {
            description: 'Test ligne 1',
            quantite: 1,
            prix_unitaire: 500,
            montant_ht: 500,
            montant_ttc: 600
          }
        ]
      };
      
      console.log('Test - Données à envoyer:', testData);
      const response = await proformasAPI.create(testData);
      console.log('Test - Réponse reçue:', response);
      
      setResult({ success: true, data: response });
      
    } catch (error) {
      console.error('Test - Erreur:', error);
      setResult({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
      <h3 className="text-lg font-semibold text-red-700 mb-3">Test de création de proforma</h3>
      
      <button
        onClick={testCreateProforma}
        disabled={isLoading}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
      >
        {isLoading ? 'Test en cours...' : 'Tester création proforma'}
      </button>
      
      {result && (
        <div className="mt-4">
          {result.success ? (
            <div className="text-green-700">
              ✅ Succès! Document créé avec l'ID: {result.data?.data?.id}
            </div>
          ) : (
            <div className="text-red-700">
              ❌ Erreur: {result.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestProformaCreate;