// Test complet du système PDF
const path = require('path');
require('dotenv').config();

// Import des modules
const db = require('./config/database');
const exportService = require('./services/exportService');

async function testCompletePdf() {
    try {
        console.log('🔍 Test complet de génération PDF...');
        
        // Simulation d'une requête comme celle de l'API
        const documentQuery = `
            SELECT d.*, 
                   c.nom as client_nom,
                   c.adresse as client_adresse,
                   c.ville as client_ville,
                   e.nom as entreprise_nom
            FROM documents d
            LEFT JOIN clients c ON d.client_id = c.id
            LEFT JOIN entreprises e ON d.entreprise_id = e.id
            WHERE d.id = $1
        `;
        
        const documentResult = await db.query(documentQuery, [3]);
        
        if (documentResult.rows.length === 0) {
            console.log('❌ Document non trouvé');
            return;
        }

        const document = documentResult.rows[0];
        console.log('📄 Document trouvé:', {
            id: document.id,
            numero: document.numero,
            montant_ht: document.montant_ht,
            montant_ttc: document.montant_ttc,
            type: typeof document.montant_ht,
            type_ttc: typeof document.montant_ttc
        });

        // Récupération des lignes
        const lignesResult = await db.query(
            'SELECT * FROM lignes_documents WHERE document_id = $1',
            [3]
        );
        const lignes = lignesResult.rows;
        console.log('📋 Lignes trouvées:', lignes.length);

        // Génération du PDF
        console.log('🔨 Génération du PDF...');
        const pdfBuffer = await exportService.generateDocumentPdf(document, lignes);
        
        console.log('✅ PDF généré avec succès!');
        console.log('📏 Taille du PDF:', pdfBuffer.length, 'bytes');
        
        // Sauvegarder le PDF
        const fs = require('fs');
        fs.writeFileSync('test-complete.pdf', pdfBuffer);
        console.log('💾 PDF sauvegardé dans test-complete.pdf');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error('📋 Stack:', error.stack);
    } finally {
        // Fermer la connexion DB
        await db.end();
        console.log('🔌 Connexion DB fermée');
    }
}

testCompletePdf();