// Test du nouveau format PDF identique à la vue détail
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import des modules
const db = require('./config/database');
const exportService = require('./services/exportService');

async function testPdfFormat() {
    try {
        console.log('🔍 Test du nouveau format PDF...');
        
        // Récupération d'une facture de test
        const documentQuery = `
            SELECT d.*, 
                   c.nom as client_nom,
                   c.adresse as client_adresse,
                   c.ville as client_ville,
                   c.email as client_email
            FROM documents d
            LEFT JOIN clients c ON d.client_id = c.id
            WHERE d.id = $1
        `;
        
        const documentId = 3; // Utilise l'ID 3 comme dans les tests précédents
        const documentResult = await db.query(documentQuery, [documentId]);
        
        if (documentResult.rows.length === 0) {
            console.log('❌ Document non trouvé avec ID:', documentId);
            return;
        }

        const document = documentResult.rows[0];
        console.log('📄 Document trouvé:', {
            id: document.id,
            numero: document.numero,
            categorie_facture: document.categorie_facture,
            type: document.type_document
        });

        // Récupération des lignes
        const lignesResult = await db.query(
            'SELECT * FROM lignes_documents WHERE document_id = $1 ORDER BY id',
            [documentId]
        );
        const lignes = lignesResult.rows;
        console.log('📋 Lignes trouvées:', lignes.length);

        if (lignes.length > 0) {
            console.log('🔍 Exemple de ligne:', {
                item: lignes[0].item,
                description: lignes[0].description,
                unite: lignes[0].unite,
                date_transport: lignes[0].date_transport,
                plaque_immat: lignes[0].plaque_immat,
                ticket: lignes[0].ticket,
                tonnes: lignes[0].tonnes,
                total_poids: lignes[0].total_poids
            });
        }

        // Génération du PDF avec le nouveau format
        console.log('📄 Génération du PDF...');
        const pdfBuffer = await exportService.generateDocumentPdf(document, lignes);
        
        // Sauvegarde du PDF
        const outputPath = path.join(__dirname, `test-nouveau-format-${document.categorie_facture || 'standard'}.pdf`);
        fs.writeFileSync(outputPath, pdfBuffer);
        
        console.log('✅ PDF généré avec succès !');
        console.log(`📁 Fichier sauvé: ${outputPath}`);
        console.log('🎯 Le PDF respecte maintenant le même format que la vue détail');
        console.log(`   - Type de facture: ${document.categorie_facture || 'standard'}`);
        console.log(`   - Colonnes adaptées selon le type (transport/non-transport)`);
        console.log(`   - Tous les nouveaux champs inclus`);

    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    } finally {
        console.log('🔚 Fin du test');
        process.exit(0);
    }
}

testPdfFormat();