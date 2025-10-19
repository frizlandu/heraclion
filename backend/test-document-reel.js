const exportService = require('./services/exportService');

(async () => {
  try {
    console.log('🔍 Test avec des documents existants...\n');

    // Test avec quelques IDs de documents potentiels
    const testIds = [1, 2, 3, 4, 5];
    
    for (const id of testIds) {
      try {
        console.log(`📄 Test du document ID ${id}...`);
        
        // Récupérer d'abord le document par son ID
        const BaseDocument = require('./models/base/BaseDocument');
        const factureModel = new BaseDocument('factures', 'facture');
        const document = await factureModel.findById(id);
        
        if (!document) {
          throw new Error(`Document ${id} non trouvé dans la base`);
        }
        
        console.log(`     ℹ️  Document trouvé: ${document.numero_facture || 'N/A'} - Entreprise: ${document.entreprise_nom || 'Inconnue'}`);
        
        // Générer le PDF avec le document trouvé
        const pdfBuffer = await exportService.generateDocumentPdf(document, []);
        
        if (pdfBuffer && pdfBuffer.length > 0) {
          const fs = require('fs');
          const path = require('path');
          
          const filename = `test-document-reel-${id}.pdf`;
          const filepath = path.join(__dirname, 'public', 'exports', filename);
          
          fs.writeFileSync(filepath, pdfBuffer);
          const size = (pdfBuffer.length / 1024).toFixed(1);
          
          console.log(`  ✅ PDF généré: ${filename} (${size} KB)`);
          console.log(`     📂 Chemin: ${filepath}\n`);
          
          // On s'arrête au premier document trouvé pour le tester
          break;
        }
        
      } catch (error) {
        console.log(`  ❌ Document ${id} non trouvé ou erreur: ${error.message}`);
        continue;
      }
    }
    
    console.log('🎯 Test terminé !');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('📝 Détails:', error);
  } finally {
    process.exit(0);
  }
})();