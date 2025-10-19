const BaseDocument = require('./models/base/BaseDocument');

(async () => {
  try {
    console.log('🔍 Recherche des documents existants...\n');
    
    // Créer une instance pour tester la table factures
    const factureModel = new BaseDocument('factures', 'facture');
    
    const docs = await factureModel.searchDocuments({ limit: 5 });
    
    if (!docs || docs.length === 0) {
      console.log('❌ Aucun document trouvé dans la base de données');
      return;
    }
    
    console.log(`📋 ${docs.length} document(s) trouvé(s):\n`);
    
    docs.forEach((doc, index) => {
      console.log(`📄 Document ${index + 1}:`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Numéro: ${doc.numero_facture || 'N/A'}`);
      console.log(`   Client: ${doc.client_nom || 'Client inconnu'}`);
      console.log(`   Entreprise: ${doc.entreprise_nom || 'Inconnue'}`);
      console.log(`   SIRET: ${doc.entreprise_siret || 'N/A'}`);
      console.log('   ---');
    });
    
  } catch(e) {
    console.log('❌ Erreur:', e.message);
    console.log('📝 Détails:', e);
  } finally {
    process.exit(0);
  }
})();