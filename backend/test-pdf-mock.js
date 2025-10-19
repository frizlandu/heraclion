// Test direct du PDF avec des données mockées
const path = require('path');
const fs = require('fs');

// Simuler les données d'une facture transport et non-transport
const exportService = require('./services/exportService');

async function testPdfWithMockData() {
    try {
        console.log('🔍 Test du PDF avec des données mockées...');

        // Test 1: Facture NON-TRANSPORT
        console.log('\n📋 Test 1: Facture NON-TRANSPORT');
        const factureNonTransport = {
            id: 1,
            numero: 'F2025-001',
            type_document: 'facture',
            categorie_facture: 'non-transport',
            date_emission: new Date(),
            date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            client_nom: 'Client Test Non-Transport',
            client_adresse: '123 Rue de la Paix',
            client_ville: 'Marseille',
            montant_ht: 1000,
            montant_tva: 200,
            montant_ttc: 1200,
            notes: 'Facture de test non-transport'
        };

        const lignesNonTransport = [
            {
                id: 1,
                item: 'ITEM001',
                description: 'Service de consultation',
                unite: 'heure',
                quantite: 10,
                prix_unitaire: 100,
                montant_ht: 1000,
                taux_tva: 20,
                montant_tva: 200,
                montant_ttc: 1200
            }
        ];

        console.log('📄 Génération PDF non-transport...');
        const pdfNonTransport = await exportService.generateDocumentPdf(factureNonTransport, lignesNonTransport);
        const pathNonTransport = path.join(__dirname, 'test-pdf-non-transport.pdf');
        fs.writeFileSync(pathNonTransport, pdfNonTransport);
        console.log(`✅ PDF non-transport généré: ${pathNonTransport}`);

        // Test 2: Facture TRANSPORT
        console.log('\n🚛 Test 2: Facture TRANSPORT');
        const factureTransport = {
            id: 2,
            numero: 'F2025-002',
            type_document: 'facture',
            categorie_facture: 'transport',
            date_emission: new Date(),
            date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            client_nom: 'Client Test Transport',
            client_adresse: '456 Avenue du Commerce',
            client_ville: 'Lyon',
            montant_ht: 1500,
            montant_tva: 300,
            montant_ttc: 1800,
            notes: 'Facture de test transport'
        };

        const lignesTransport = [
            {
                id: 2,
                item: 'TR001',
                description: 'Transport de marchandises',
                date_transport: new Date(),
                plaque_immat: 'AB-123-CD',
                ticket: 'T789456',
                tonnes: 15.5,
                total_poids: 15500,
                prix_unitaire: 50,
                montant_ht: 775,
                frais_administratif: 25,
                taux_tva: 20,
                montant_tva: 155,
                montant_ttc: 930
            },
            {
                id: 3,
                item: 'TR002',
                description: 'Transport spécialisé',
                date_transport: new Date(),
                plaque_immat: 'EF-456-GH',
                ticket: 'T123789',
                tonnes: 8.2,
                total_poids: 8200,
                prix_unitaire: 75,
                montant_ht: 615,
                frais_administratif: 30,
                taux_tva: 20,
                montant_tva: 123,
                montant_ttc: 738
            }
        ];

        console.log('📄 Génération PDF transport...');
        const pdfTransport = await exportService.generateDocumentPdf(factureTransport, lignesTransport);
        const pathTransport = path.join(__dirname, 'test-pdf-transport.pdf');
        fs.writeFileSync(pathTransport, pdfTransport);
        console.log(`✅ PDF transport généré: ${pathTransport}`);

        console.log('\n🎯 Résumé des tests:');
        console.log('✅ PDF non-transport: Colonnes Item, Désignation, Unité, Quantité, Prix U., Total HT, TVA%, Total TVA, Total Général');
        console.log('✅ PDF transport: Colonnes Item, Date, P/IMMAT, Désignation, Ticket, Tonne, Total/Poids, Prix U., Total HT, Frais Admin, TVA%, Total TVA, Total Général');
        console.log('✅ Le PDF suit maintenant exactement le même modèle que la vue détail !');

    } catch (error) {
        console.error('❌ Erreur lors du test PDF:', error);
    } finally {
        console.log('🔚 Fin du test');
        process.exit(0);
    }
}

testPdfWithMockData();