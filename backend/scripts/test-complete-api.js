/**
 * Script de test complet pour toutes les routes API
 */
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001/api/v1';

let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// Fonction utilitaire pour les tests
async function test(name, testFunction) {
  testResults.total++;
  try {
    console.log(`\n🧪 Test: ${name}`);
    await testFunction();
    testResults.passed++;
    console.log(`✅ ${name} - RÉUSSI`);
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ name, error: error.message });
    console.log(`❌ ${name} - ÉCHOUÉ: ${error.message}`);
  }
}

// Fonction pour créer un fichier de test temporaire
function createTestFile() {
  const testFilePath = path.join(__dirname, 'test-document.txt');
  fs.writeFileSync(testFilePath, 'Ceci est un document de test pour l\'API Heraclion');
  return testFilePath;
}

async function runTests() {
  console.log('🚀 Démarrage des tests API complets\n');
  console.log('=' .repeat(60));
  
  // Variables pour stocker les IDs créés durant les tests
  let entrepriseId, clientId, stockId, documentId;
  
  // ===== TESTS ENTREPRISES =====
  console.log('\n📊 TESTS DES ENTREPRISES');
  console.log('-'.repeat(30));
  
  await test('GET /entreprises - Liste des entreprises', async () => {
    const response = await axios.get(`${BASE_URL}/entreprises`);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.data.success) throw new Error('Response not successful');
    console.log(`   → ${response.data.data.data.length} entreprises trouvées`);
  });
  
  await test('POST /entreprises - Création d\'une entreprise', async () => {
    const nouvelleEntreprise = {
      nom: 'Test Transport SARL',
      type: 'TRANSPORT',
      adresse: '123 Rue du Test',
      telephone: '0123456789',
      email: 'test@transport.com'
    };
    
    const response = await axios.post(`${BASE_URL}/entreprises`, nouvelleEntreprise);
    if (response.status !== 201) throw new Error(`Status ${response.status}`);
    if (!response.data.success) throw new Error('Response not successful');
    
    entrepriseId = response.data.data.id;
    console.log(`   → Entreprise créée avec ID: ${entrepriseId}`);
  });
  
  await test('GET /entreprises/:id - Récupération d\'une entreprise', async () => {
    const response = await axios.get(`${BASE_URL}/entreprises/${entrepriseId}`);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.data.success) throw new Error('Response not successful');
    console.log(`   → Entreprise: ${response.data.data.nom}`);
  });
  
  await test('PUT /entreprises/:id - Mise à jour d\'une entreprise', async () => {
    const donneesModifiees = {
      nom: 'Test Transport SARL (Modifiée)',
      telephone: '0987654321'
    };
    
    const response = await axios.put(`${BASE_URL}/entreprises/${entrepriseId}`, donneesModifiees);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.data.success) throw new Error('Response not successful');
    console.log(`   → Entreprise mise à jour`);
  });
  
  // ===== TESTS CLIENTS =====
  console.log('\n👥 TESTS DES CLIENTS');
  console.log('-'.repeat(30));
  
  await test('GET /clients - Liste des clients', async () => {
    const response = await axios.get(`${BASE_URL}/clients`);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.data.success) throw new Error('Response not successful');
    console.log(`   → ${response.data.data.data.length} clients trouvés`);
  });
  
  await test('POST /clients - Création d\'un client', async () => {
    const nouveauClient = {
      nom: 'Client Test',
      email: 'client.test@example.com',
      telephone: '0147258369',
      adresse: '456 Avenue du Test'
    };
    
    const response = await axios.post(`${BASE_URL}/clients`, nouveauClient);
    if (response.status !== 201) throw new Error(`Status ${response.status}`);
    if (!response.data.success) throw new Error('Response not successful');
    
    clientId = response.data.data.id;
    console.log(`   → Client créé avec ID: ${clientId}`);
  });
  
  await test('GET /clients/:id - Récupération d\'un client', async () => {
    const response = await axios.get(`${BASE_URL}/clients/${clientId}`);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.data.success) throw new Error('Response not successful');
    console.log(`   → Client: ${response.data.data.nom}`);
  });
  
  await test('GET /clients/:id/stats - Statistiques du client', async () => {
    const response = await axios.get(`${BASE_URL}/clients/${clientId}/stats`);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.data.success) throw new Error('Response not successful');
    console.log(`   → Stats récupérées pour le client`);
  });
  
  // ===== TESTS STOCK =====
  console.log('\n📦 TESTS DU STOCK');
  console.log('-'.repeat(30));
  
  await test('GET /stocks - Liste des articles', async () => {
    const response = await axios.get(`${BASE_URL}/stocks`);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.data.success) throw new Error('Response not successful');
    console.log(`   → ${response.data.data.data.length} articles en stock`);
  });
  
  await test('POST /stocks - Création d\'un article', async () => {
    const nouvelArticle = {
      reference: 'TEST001',
      designation: 'Article de test',
      quantite_stock: 100,
      quantite_min: 10,
      prix_achat: 50.00,
      prix_vente: 75.00,
      taux_tva: 20
    };
    
    const response = await axios.post(`${BASE_URL}/stocks`, nouvelArticle);
    if (response.status !== 201) throw new Error(`Status ${response.status}`);
    if (!response.data.success) throw new Error('Response not successful');
    
    stockId = response.data.data.id;
    console.log(`   → Article créé avec ID: ${stockId}`);
  });
  
  await test('GET /stocks/:id - Récupération d\'un article', async () => {
    const response = await axios.get(`${BASE_URL}/stocks/${stockId}`);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.data.success) throw new Error('Response not successful');
    console.log(`   → Article: ${response.data.data.designation}`);
  });
  
  await test('POST /stocks/:id/mouvements - Mouvement de stock', async () => {
    const mouvement = {
      type_mouvement: 'sortie',
      quantite: 5,
      motif: 'Test de sortie'
    };
    
    const response = await axios.post(`${BASE_URL}/stocks/${stockId}/mouvements`, mouvement);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.data.success) throw new Error('Response not successful');
    console.log(`   → Mouvement de stock enregistré`);
  });
  
  await test('GET /stocks/alertes - Articles en alerte', async () => {
    const response = await axios.get(`${BASE_URL}/stocks/alertes`);
    console.log(`Response status: ${response.status}`);
    console.log(`Response data:`, JSON.stringify(response.data, null, 2));
    
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.data.success) throw new Error('Response not successful');
    console.log(`   → ${response.data.data.length} articles en alerte`);
  });
  
  await test('GET /stocks/valorisation - Valorisation du stock', async () => {
    const response = await axios.get(`${BASE_URL}/stocks/valorisation`);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.data.success) throw new Error('Response not successful');
    console.log(`   → Valorisation calculée: ${response.data.data.valeur_achat}€`);
  });
  
  // ===== TESTS DOCUMENTS =====
  console.log('\n📄 TESTS DES DOCUMENTS');
  console.log('-'.repeat(30));
  
  await test('GET /documents - Liste des documents', async () => {
    const response = await axios.get(`${BASE_URL}/documents`);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.data.success) throw new Error('Response not successful');
    console.log(`   → ${response.data.data.data.length} documents trouvés`);
  });
  
  await test('POST /documents/upload - Upload d\'un document', async () => {
    const testFilePath = createTestFile();
    
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(testFilePath));
      formData.append('type_document', 'autre');
      formData.append('client_id', clientId.toString());
      formData.append('description', 'Document de test API');
      
      const response = await axios.post(`${BASE_URL}/documents/upload`, formData, {
        headers: {
          ...formData.getHeaders()
        }
      });
      
      if (response.status !== 201) throw new Error(`Status ${response.status}`);
      if (!response.data.success) throw new Error('Response not successful');
      
      documentId = response.data.data.id;
      console.log(`   → Document uploadé avec ID: ${documentId}`);
      
    } finally {
      // Nettoyer le fichier de test
      try {
        fs.unlinkSync(testFilePath);
      } catch (error) {
        console.warn('Impossible de supprimer le fichier de test:', error.message);
      }
    }
  });
  
  await test('GET /documents/:id - Récupération d\'un document', async () => {
    const response = await axios.get(`${BASE_URL}/documents/${documentId}`);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.data.success) throw new Error('Response not successful');
    console.log(`   → Document: ${response.data.data.nom_original}`);
  });
  
  await test('PUT /documents/:id - Mise à jour d\'un document', async () => {
    const donneesModifiees = {
      description: 'Document de test API - Modifié',
      tags: 'test,api,heraclion'
    };
    
    const response = await axios.put(`${BASE_URL}/documents/${documentId}`, donneesModifiees);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.data.success) throw new Error('Response not successful');
    console.log(`   → Document mis à jour`);
  });
  
  await test('GET /documents/stats - Statistiques des documents', async () => {
    const response = await axios.get(`${BASE_URL}/documents/stats`);
    console.log(`Response status: ${response.status}`);
    console.log(`Response data:`, JSON.stringify(response.data, null, 2));
    
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.data.success) throw new Error('Response not successful');
    console.log(`   → Stats des documents calculées`);
  });
  
  // ===== TESTS DE RECHERCHE ET FILTRAGE =====
  console.log('\n🔍 TESTS DE RECHERCHE');
  console.log('-'.repeat(30));
  
  await test('GET /entreprises?search=test - Recherche d\'entreprises', async () => {
    const response = await axios.get(`${BASE_URL}/entreprises?search=test`);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.data.success) throw new Error('Response not successful');
    console.log(`   → ${response.data.data.data.length} entreprises trouvées avec "test"`);
  });
  
  await test('GET /clients?search=test - Recherche de clients', async () => {
    const response = await axios.get(`${BASE_URL}/clients?search=test`);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.data.success) throw new Error('Response not successful');
    console.log(`   → ${response.data.data.data.length} clients trouvés avec "test"`);
  });
  
  await test('GET /stocks?search=test - Recherche d\'articles', async () => {
    const response = await axios.get(`${BASE_URL}/stocks?search=test`);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.data.success) throw new Error('Response not successful');
    console.log(`   → ${response.data.data.data.length} articles trouvés avec "test"`);
  });
  
  // ===== NETTOYAGE =====
  console.log('\n🧹 NETTOYAGE DES DONNÉES DE TEST');
  console.log('-'.repeat(30));
  
  await test('DELETE /documents/:id - Suppression du document de test', async () => {
    const response = await axios.delete(`${BASE_URL}/documents/${documentId}`);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.data.success) throw new Error('Response not successful');
    console.log(`   → Document de test supprimé`);
  });
  
  await test('DELETE /entreprises/:id - Suppression de l\'entreprise de test', async () => {
    const response = await axios.delete(`${BASE_URL}/entreprises/${entrepriseId}`);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    if (!response.data.success) throw new Error('Response not successful');
    console.log(`   → Entreprise de test supprimée`);
  });
  
  // ===== RÉSULTATS =====
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSULTATS DES TESTS');
  console.log('='.repeat(60));
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  
  console.log(`\n✅ Tests réussis: ${testResults.passed}/${testResults.total} (${successRate}%)`);
  console.log(`❌ Tests échoués: ${testResults.failed}/${testResults.total}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n🔍 ERREURS DÉTAILLÉES:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.name}`);
      console.log(`   Erreur: ${error.error}`);
    });
  }
  
  if (successRate >= 90) {
    console.log('\n🎉 EXCELLENT! API fonctionnelle à plus de 90%');
  } else if (successRate >= 75) {
    console.log('\n👍 BIEN! API largement fonctionnelle');
  } else {
    console.log('\n⚠️  ATTENTION! Plusieurs problèmes détectés');
  }
  
  console.log(`\n🕐 Tests terminés à: ${new Date().toLocaleString('fr-FR')}`);
}

// Gestion des erreurs globales
process.on('unhandledRejection', (reason, promise) => {
  console.error('Erreur non gérée:', reason);
  process.exit(1);
});

// Exécution des tests
runTests().catch(error => {
  console.error('Erreur lors de l\'exécution des tests:', error);
  process.exit(1);
});