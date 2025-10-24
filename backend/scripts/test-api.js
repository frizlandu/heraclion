/**
 * Script de test des endpoints API Heraclion
 */
const axios = require('axios');

const API_BASE = 'https://heraclion.onrender.com/api/v1';
const API_DOCS = 'https://heraclion.onrender.com/api/v1/docs';

// Configuration axios avec timeout
axios.defaults.timeout = 5000;

async function testAPI() {
  console.log('🧪 Tests complets de l\'API Heraclion Backend\n');
  console.log('🌐 URL de base :', API_BASE);
  console.log('📚 Documentation :', API_DOCS);
  console.log('─'.repeat(60));
  
  let passedTests = 0;
  let totalTests = 0;
  
  try {
    // Test 1: Santé du serveur
    totalTests++;
    console.log('\n1️⃣ Test de santé du serveur...');
    try {
  const health = await axios.get(`https://heraclion.onrender.com/api/health`);
      console.log('✅ Serveur en ligne :', health.data.status || 'OK');
      if (health.data.uptime) {
        console.log(`   ⏱️  Uptime: ${Math.round(health.data.uptime)}s`);
      }
      passedTests++;
    } catch (error) {
      console.log('❌ Serveur inaccessible :', error.message);
    }
    
    // Test 2: Documentation Swagger
    totalTests++;
    console.log('\n2️⃣ Test accès documentation...');
    try {
  const docs = await axios.get('https://heraclion.onrender.com/api/docs');
      console.log('✅ Documentation Swagger accessible');
      passedTests++;
    } catch (error) {
      console.log('⚠️ Documentation non accessible :', error.message);
    }
    
    // Test 3: Liste des entreprises
    totalTests++;
    console.log('\n3️⃣ Test liste des entreprises...');
    try {
      const entreprises = await axios.get(`${API_BASE}/entreprises`);
      const data = entreprises.data.data || entreprises.data;
      console.log(`✅ ${data.length} entreprise(s) trouvée(s)`);
      if (data.length > 0) {
        data.slice(0, 3).forEach(e => {
          console.log(`   🏢 ${e.nom} (${e.prefix_facture}) - ${e.type_entreprise}`);
        });
      }
      passedTests++;
    } catch (error) {
      console.log('❌ Erreur entreprises :', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // Test 4: Liste des clients
    totalTests++;
    console.log('\n4️⃣ Test liste des clients...');
    try {
      const clients = await axios.get(`${API_BASE}/clients`);
      const data = clients.data.data || clients.data;
      console.log(`✅ ${data.length} client(s) trouvé(s)`);
      if (data.length > 0) {
        data.slice(0, 3).forEach(c => {
          console.log(`   👤 ${c.nom} - ${c.type_client || 'N/A'} (${c.ville || 'N/A'})`);
        });
      }
      passedTests++;
    } catch (error) {
      console.log('❌ Erreur clients :', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // Test 5: Liste du stock
    totalTests++;
    console.log('\n5️⃣ Test liste du stock...');
    try {
      const stocks = await axios.get(`${API_BASE}/stocks`);
      const data = stocks.data.data || stocks.data;
      console.log(`✅ ${data.length} article(s) en stock`);
      if (data.length > 0) {
        data.slice(0, 3).forEach(s => {
          console.log(`   📦 ${s.reference}: ${s.designation} (Stock: ${s.quantite_stock}, Prix: ${s.prix_vente}€)`);
        });
      }
      passedTests++;
    } catch (error) {
      console.log('❌ Erreur stock :', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // Test 6: Liste des documents
    totalTests++;
    console.log('\n6️⃣ Test liste des documents...');
    try {
      const documents = await axios.get(`${API_BASE}/documents`);
      const data = documents.data.data || documents.data;
      console.log(`✅ ${data.length} document(s) trouvé(s)`);
      if (data.length > 0) {
        data.slice(0, 3).forEach(d => {
          console.log(`   📄 ${d.numero} (${d.type_document}) - ${d.montant_ttc}€ - ${d.statut}`);
        });
      }
      passedTests++;
    } catch (error) {
      console.log('❌ Erreur documents :', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // Test 7: Création d'un client
    totalTests++;
    console.log('\n7️⃣ Test création d\'un nouveau client...');
    try {
      const newClient = await axios.post(`${API_BASE}/clients`, {
        nom: 'CLIENT TEST API',
        adresse: '999 Rue de Test API, 75000 Paris',
        telephone: '+33 1 00 00 00 00',
        email: `test-api-${Date.now()}@heraclion-test.com`,
        type_client: 'particulier',
        ville: 'Paris',
        code_postal: '75000',
        pays: 'France'
      });
      console.log('✅ Client créé avec succès :', newClient.data.nom || 'Client test');
      passedTests++;
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('⚠️ Client existe déjà ou conflit (normal)');
        passedTests++;
      } else {
        console.log('❌ Erreur création client :', error.response?.status, error.response?.data?.message || error.message);
      }
    }
    
    // Test 8: Authentification
    totalTests++;
    console.log('\n8️⃣ Test authentification...');
    let authToken = null;
    try {
      const login = await axios.post(`${API_BASE}/auth/login`, {
        email: 'admin@heraclion.fr',
        password: 'admin123'
      });
      
      if (login.data.data?.token) {
        authToken = login.data.data.token;
        console.log('✅ Connexion réussie pour :', login.data.data.user?.nom || 'Utilisateur');
        console.log('   🔑 Token JWT généré');
        passedTests++;
      } else {
        console.log('⚠️ Connexion sans token (à vérifier)');
      }
    } catch (error) {
      console.log('⚠️ Authentification à implémenter :', error.response?.status || error.message);
    }
    
    // Test 9: Route protégée (si token disponible)
    if (authToken) {
      totalTests++;
      console.log('\n9️⃣ Test route protégée avec token...');
      try {
        const protectedData = await axios.get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ Accès aux données protégées réussi');
        console.log('   👤 Utilisateur :', protectedData.data.data?.nom || 'Utilisateur authentifié');
        passedTests++;
      } catch (error) {
        console.log('❌ Erreur route protégée :', error.response?.status, error.response?.data?.message || error.message);
      }
    }
    
    // Test 10: Statistiques dashboard
    totalTests++;
    console.log('\n🔟 Test statistiques dashboard...');
    try {
      const stats = await axios.get(`${API_BASE}/dashboard/stats`);
      console.log('✅ Statistiques récupérées');
      const data = stats.data.data || stats.data;
      if (data.total_clients) {
        console.log(`   📊 Total clients: ${data.total_clients}`);
      }
      if (data.total_factures) {
        console.log(`   📊 Total factures: ${data.total_factures}`);
      }
      passedTests++;
    } catch (error) {
      console.log('⚠️ Statistiques à implémenter :', error.response?.status || error.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale lors des tests :', error.message);
  }
  
  // Résumé des tests
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('═'.repeat(60));
  console.log(`✅ Tests réussis : ${passedTests}/${totalTests}`);
  console.log(`📈 Taux de réussite : ${Math.round((passedTests/totalTests)*100)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Tous les tests sont passés ! API entièrement fonctionnelle.');
  } else if (passedTests >= totalTests * 0.7) {
    console.log('✅ API majoritairement fonctionnelle. Quelques endpoints à implémenter.');
  } else {
    console.log('⚠️ Plusieurs endpoints nécessitent une implémentation.');
  }
  
  console.log('\n📋 PROCHAINES ÉTAPES RECOMMANDÉES :');
  console.log('   1. 🌐 Accéder à la documentation : http://localhost:3001/api/docs');
  console.log('   2. 🔧 Implémenter les controllers manquants');
  console.log('   3. 🔐 Finaliser le système d\'authentification JWT');
  console.log('   4. 📄 Créer les routes pour factures/proformas');
  console.log('   5. 🧪 Lancer les tests unitaires : npm test');
  console.log('   6. 📊 Configurer le dashboard avec statistiques');
  
  console.log('\n🔗 LIENS UTILES :');
  console.log(`   - API Health : ${API_BASE}/health`);
  console.log(`   - Documentation : ${API_DOCS}`);
  console.log(`   - Entreprises : ${API_BASE}/entreprises`);
  console.log(`   - Clients : ${API_BASE}/clients`);
  console.log(`   - Stock : ${API_BASE}/stocks`);
  
  return { passedTests, totalTests, successRate: (passedTests/totalTests)*100 };
}

// Auto-exécution si appelé directement
if (require.main === module) {
  testAPI()
    .then(result => {
      if (result.successRate < 50) {
        process.exit(1); // Échec si moins de 50% de réussite
      }
    })
    .catch(error => {
      console.error('❌ Erreur fatale lors des tests :', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.log('\n💡 SOLUTION : Assurez-vous que le serveur est démarré avec :');
        console.log('   npm start');
        console.log('   ou');
        console.log('   npm run dev');
      }
      process.exit(1);
    });
}
afterAll(() => {
  if (global.server && typeof global.server.close === 'function') {
    global.server.close();
  }
});


module.exports = { testAPI };