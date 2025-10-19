#!/usr/bin/env node

/**
 * Script de test pour vérifier l'affichage des entreprises dans les PDFs
 */

const exportService = require('./services/exportService');
const BaseDocument = require('./models/base/BaseDocument');

class PdfEntrepriseTest {
  async testMultipleEnterprises() {
    console.log('🧪 Test des PDFs multi-entreprises...\n');

    // Simuler des documents de différentes entreprises
    const testDocuments = [
      {
        id: 'TEST-001',
        numero: 'F-2024-001',
        type_document: 'facture',
        date_emission: '2024-10-08',
        
        // Entreprise 1: HERACLION TRANSPORT
        entreprise_nom: 'HERACLION TRANSPORT',
        entreprise_adresse: '123 Avenue de la Logistique',
        entreprise_ville: '13000 Marseille',
        entreprise_telephone: '04.91.XX.XX.XX',
        entreprise_email: 'contact@heraclion.fr',
        entreprise_siret: '123 456 789 00012',
        
        // Client
        client_nom: 'Client Transport SARL',
        client_adresse: '456 Rue du Commerce',
        client_ville: '69000 Lyon',
        client_email: 'contact@client.fr',
        
        montant_total: 1500.00,
        montant_ht: 1250.00,
        tva: 250.00,
        statut: 'validee',
        
        items: [
          {
            designation: 'Transport Marseille-Lyon',
            quantite: 1,
            prix_unitaire: 1250.00,
            montant: 1250.00
          }
        ]
      },
      
      {
        id: 'TEST-002',
        numero: 'F-2024-002',
        type_document: 'facture',
        date_emission: '2024-10-08',
        
        // Entreprise 2: LOGISTICS EXPRESS
        entreprise_nom: 'LOGISTICS EXPRESS',
        entreprise_adresse: '789 Boulevard du Fret',
        entreprise_ville: '31000 Toulouse',
        entreprise_telephone: '05.61.XX.XX.XX',
        entreprise_email: 'info@logistics-express.fr',
        entreprise_siret: '987 654 321 00021',
        
        // Client
        client_nom: 'Entreprise Sud-Ouest',
        client_adresse: '321 Place du Marché',
        client_ville: '33000 Bordeaux',
        client_email: 'commandes@sudouest.fr',
        
        montant_total: 2400.00,
        montant_ht: 2000.00,
        tva: 400.00,
        statut: 'validee',
        
        items: [
          {
            designation: 'Transport express Toulouse-Bordeaux',
            quantite: 2,
            prix_unitaire: 1000.00,
            montant: 2000.00
          }
        ]
      },
      
      {
        id: 'TEST-003',
        numero: 'F-2024-003',
        type_document: 'facture',
        date_emission: '2024-10-08',
        
        // Entreprise 3: NORD TRANSPORT
        entreprise_nom: 'NORD TRANSPORT',
        entreprise_adresse: '456 Rue de Lille',
        entreprise_ville: '59000 Lille',
        entreprise_telephone: '03.20.XX.XX.XX',
        entreprise_email: 'contact@nordtransport.fr',
        entreprise_siret: '456 789 123 00034',
        
        // Client
        client_nom: 'Industries du Nord',
        client_adresse: '159 Avenue de la République',
        client_ville: '62000 Arras',
        client_email: 'facturation@industriesdunord.fr',
        
        montant_total: 3600.00,
        montant_ht: 3000.00,
        tva: 600.00,
        statut: 'validee',
        
        items: [
          {
            designation: 'Transport lourd Lille-Arras',
            quantite: 3,
            prix_unitaire: 1000.00,
            montant: 3000.00
          }
        ]
      }
    ];

    const results = [];

    for (const [index, document] of testDocuments.entries()) {
      try {
        console.log(`📄 Génération PDF ${index + 1}/3 pour ${document.entreprise_nom}...`);
        
        const pdfBuffer = await exportService.generateDocumentPdf(document, document.items);
        
        if (pdfBuffer && pdfBuffer.length > 0) {
          const filename = `test-entreprise-${index + 1}-${document.entreprise_nom.replace(/\s+/g, '-')}.pdf`;
          const fs = require('fs');
          const path = require('path');
          
          const outputPath = path.join(__dirname, 'public', 'exports', filename);
          fs.writeFileSync(outputPath, pdfBuffer);
          
          results.push({
            success: true,
            entreprise: document.entreprise_nom,
            filename,
            path: outputPath,
            size: `${(pdfBuffer.length / 1024).toFixed(1)} KB`
          });
          
          console.log(`  ✅ PDF généré: ${filename} (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);
        } else {
          throw new Error('Buffer PDF vide');
        }
        
      } catch (error) {
        results.push({
          success: false,
          entreprise: document.entreprise_nom,
          error: error.message
        });
        
        console.log(`  ❌ Erreur pour ${document.entreprise_nom}: ${error.message}`);
      }
    }

    // Résumé des résultats
    console.log('\n📊 RÉSUMÉ DES TESTS:');
    console.log('=' .repeat(50));
    
    results.forEach((result, index) => {
      if (result.success) {
        console.log(`✅ ${result.entreprise}`);
        console.log(`   Fichier: ${result.filename}`);
        console.log(`   Taille: ${result.size}\n`);
      } else {
        console.log(`❌ ${result.entreprise}`);
        console.log(`   Erreur: ${result.error}\n`);
      }
    });

    const successCount = results.filter(r => r.success).length;
    console.log(`🎯 Résultat final: ${successCount}/${results.length} PDFs générés avec succès`);
    
    if (successCount === results.length) {
      console.log('🎉 Tous les tests sont passés !');
      console.log('✨ Les PDFs affichent maintenant les bonnes informations d\'entreprise.');
      console.log('📂 Vérifiez les fichiers dans public/exports/');
    } else {
      console.log('⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.');
    }

    return results;
  }

  async testSingleDocumentWithDetails(documentId = null) {
    if (!documentId) {
      console.log('ℹ️  Pour tester un document réel de la base de données:');
      console.log('   node test-pdf-entreprises.js --doc-id=123');
      return;
    }

    try {
      console.log(`🔍 Test du document ID: ${documentId}`);
      
      // Utiliser le modèle pour récupérer un vrai document
      const baseDoc = new BaseDocument('factures', 'facture');
      const document = await baseDoc.findByIdWithItems(documentId);
      
      if (!document) {
        console.log(`❌ Document ${documentId} non trouvé`);
        return;
      }

      console.log(`📋 Document trouvé: ${document.numero}`);
      console.log(`🏢 Entreprise: ${document.entreprise_nom || 'Non définie'}`);
      console.log(`👤 Client: ${document.client_nom || 'Non défini'}`);

      const pdfBuffer = await exportService.generateDocumentPdf(document, document.items);
      
      if (pdfBuffer) {
        const fs = require('fs');
        const path = require('path');
        const filename = `test-real-document-${documentId}.pdf`;
        const outputPath = path.join(__dirname, 'public', 'exports', filename);
        
        fs.writeFileSync(outputPath, pdfBuffer);
        
        console.log(`✅ PDF généré: ${filename}`);
        console.log(`📂 Chemin: ${outputPath}`);
        console.log(`📏 Taille: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
      }

    } catch (error) {
      console.log(`❌ Erreur lors du test: ${error.message}`);
    }
  }
}

// Exécution
if (require.main === module) {
  const tester = new PdfEntrepriseTest();
  
  const args = process.argv.slice(2);
  const docIdArg = args.find(arg => arg.startsWith('--doc-id='));
  
  if (docIdArg) {
    const docId = docIdArg.split('=')[1];
    tester.testSingleDocumentWithDetails(docId)
      .then(() => process.exit(0))
      .catch(error => {
        console.error('Erreur:', error);
        process.exit(1);
      });
  } else {
    tester.testMultipleEnterprises()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('Erreur:', error);
        process.exit(1);
      });
  }
}

module.exports = PdfEntrepriseTest;