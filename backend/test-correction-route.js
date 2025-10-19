const Document = require('./models/base/BaseDocument');
const exportService = require('./services/exportService');

(async () => {
  try {
    console.log('🔧 Test de la correction de la route PDF...\n');

    // Simulation de la requête SQL corrigée de la route
    const documentQuery = `
      SELECT d.*, 
             c.nom as client_nom, 
             c.adresse as client_adresse, 
             c.ville as client_ville,
             c.telephone as client_telephone,
             c.email as client_email,
             e.nom as entreprise_nom,
             e.adresse as entreprise_adresse,
             e.ville as entreprise_ville,
             e.telephone as entreprise_telephone,
             e.email as entreprise_email,
             e.siret as entreprise_siret
      FROM documents d
      LEFT JOIN clients c ON d.client_id = c.id
      JOIN entreprises e ON d.entreprise_id = e.id
      WHERE d.id = $1
    `;

    // Créer une instance du modèle Document
    const docModel = new Document('documents', 'document');
    
    console.log('📋 Test avec les documents ID 1 à 5...\n');
    
    // Tester plusieurs IDs
    for (let id = 1; id <= 5; id++) {
      try {
        console.log(`📄 Test document ID ${id}:`);
        
        // Simuler l'exécution de la requête corrigée
        const documentResult = await docModel.query(documentQuery, [id]);
        
        if (!documentResult.rows || documentResult.rows.length === 0) {
          console.log(`  ❌ Document ${id} non trouvé`);
          continue;
        }

        const document = documentResult.rows[0];
        
        // Vérifier que les données d'entreprise sont bien récupérées
        console.log(`  ✅ Document trouvé: ${document.numero || 'N/A'}`);
        console.log(`  🏢 Entreprise: ${document.entreprise_nom || 'NON TROUVÉE'}`);
        console.log(`  📄 SIRET: ${document.entreprise_siret || 'NON TROUVÉ'}`);
        
        if (document.entreprise_nom && document.entreprise_nom !== 'HERACLION TRANSPORT') {
          console.log(`  🎯 PARFAIT ! Entreprise différente de HERACLION détectée !`);
        }
        
        // Récupérer les lignes (vides pour ce test)
        const lignesResult = await docModel.query(
          'SELECT * FROM lignes_documents WHERE document_id = $1 ORDER BY id',
          [id]
        );
        const lignes = lignesResult.rows || [];

        // Tenter de générer le PDF
        const pdfBuffer = await exportService.generateDocumentPdf(document, lignes);
        
        if (pdfBuffer && pdfBuffer.length > 0) {
          const fs = require('fs');
          const path = require('path');
          
          const filename = `test-correction-${id}-${document.entreprise_nom || 'UNKNOWN'}.pdf`;
          const filepath = path.join(__dirname, 'public', 'exports', filename.replace(/[^a-zA-Z0-9.-]/g, '_'));
          
          fs.writeFileSync(filepath, pdfBuffer);
          const size = (pdfBuffer.length / 1024).toFixed(1);
          
          console.log(`  ✅ PDF généré: ${path.basename(filepath)} (${size} KB)`);
        }
        
        console.log('  ---\n');
        
        // S'arrêter au premier succès
        break;
        
      } catch (error) {
        console.log(`  ❌ Erreur document ${id}: ${error.message}`);
        continue;
      }
    }
    
    console.log('🎯 Test terminé !');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  } finally {
    process.exit(0);
  }
})();