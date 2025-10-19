// Vérifier les documents existants
const db = require('./config/database');

async function checkDocuments() {
    try {
        console.log('🔍 Vérification des documents existants...');
        
        const result = await db.query(`
            SELECT d.id, d.numero, d.type_document, d.categorie_facture, 
                   c.nom as client_nom,
                   COUNT(ld.id) as nb_lignes
            FROM documents d
            LEFT JOIN clients c ON d.client_id = c.id
            LEFT JOIN lignes_documents ld ON d.id = ld.document_id
            GROUP BY d.id, d.numero, d.type_document, d.categorie_facture, c.nom
            ORDER BY d.id
            LIMIT 10
        `);
        
        if (result.rows.length === 0) {
            console.log('❌ Aucun document trouvé dans la base');
            return null;
        }
        
        console.log('📄 Documents trouvés:');
        result.rows.forEach((doc, index) => {
            console.log(`  ${index + 1}. ID: ${doc.id} | Numéro: ${doc.numero} | Type: ${doc.type_document} | Catégorie: ${doc.categorie_facture} | Client: ${doc.client_nom} | Lignes: ${doc.nb_lignes}`);
        });
        
        // Retourner le premier document avec des lignes
        const docWithLines = result.rows.find(doc => doc.nb_lignes > 0);
        return docWithLines || result.rows[0];
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        return null;
    }
}

async function main() {
    try {
        const document = await checkDocuments();
        if (document) {
            console.log(`\n🎯 Document recommandé pour le test: ID ${document.id} (${document.nb_lignes} lignes)`);
        }
        process.exit(0);
    } catch (error) {
        console.error('Erreur:', error);
        process.exit(1);
    }
}

main();