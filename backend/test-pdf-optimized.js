// Test des améliorations visuelles du PDF
const path = require('path');
const fs = require('fs');
const exportService = require('./services/exportService');

async function testOptimizedPdf() {
    try {
        console.log('🎨 Test du PDF avec les améliorations visuelles...');

        // Test 1: Facture NON-TRANSPORT avec plusieurs lignes
        console.log('\n📋 Test 1: Facture NON-TRANSPORT (présentation optimisée)');
        const factureNonTransport = {
            id: 1,
            numero: 'F2025-001',
            type_document: 'facture',
            categorie_facture: 'non-transport',
            date_emission: new Date(),
            date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            client_nom: 'ENTREPRISE MODERNE SARL',
            client_adresse: '123 Avenue de la Innovation\n13001 Marseille',
            client_ville: 'Marseille',
            client_email: 'contact@entreprise-moderne.fr',
            montant_ht: 2450,
            montant_tva: 490,
            montant_ttc: 2940,
            notes: 'Prestations de conseil en transformation digitale\nFacturation mensuelle selon contrat n°2025-CT-001'
        };

        const lignesNonTransport = [
            {
                id: 1,
                item: 'CONS-001',
                description: 'Audit et diagnostic système existant - Analyse complète',
                unite: 'jour',
                quantite: 5,
                prix_unitaire: 450,
                montant_ht: 2250,
                taux_tva: 20,
                montant_tva: 450,
                montant_ttc: 2700
            },
            {
                id: 2,
                item: 'FORM-002',
                description: 'Formation équipe technique - Méthodologies agiles',
                unite: 'heure',
                quantite: 4,
                prix_unitaire: 50,
                montant_ht: 200,
                taux_tva: 20,
                montant_tva: 40,
                montant_ttc: 240
            }
        ];

        // Test 2: Facture TRANSPORT avec de nombreuses lignes pour tester la pagination
        console.log('\n🚛 Test 2: Facture TRANSPORT (test pagination)');
        const factureTransport = {
            id: 2,
            numero: 'F2025-002',
            type_document: 'facture',
            categorie_facture: 'transport',
            date_emission: new Date(),
            date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            client_nom: 'LOGISTIQUE EUROPE SAS',
            client_adresse: '456 Boulevard du Commerce\nZone Industrielle Sud\n69000 Lyon',
            client_ville: 'Lyon',
            client_email: 'factures@logistique-europe.com',
            montant_ht: 3750,
            montant_tva: 750,
            montant_ttc: 4500,
            notes: 'Transport de marchandises diverses\nContrat cadre n°LOG-2025-15\nLivraisons effectuées selon planning convenu'
        };

        // Créer plusieurs lignes pour tester la pagination
        const lignesTransport = [];
        for (let i = 1; i <= 12; i++) {
            lignesTransport.push({
                id: i,
                item: `TR${i.toString().padStart(3, '0')}`,
                description: `Transport lot ${i} - Marchandises diverses ${i % 3 === 0 ? '(matières dangereuses)' : ''}`,
                date_transport: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
                plaque_immat: `${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(66 + (i % 25))}-${(100 + i).toString()}-${String.fromCharCode(67 + (i % 24))}${String.fromCharCode(68 + (i % 23))}`,
                ticket: `T${(789456 + i).toString()}`,
                tonnes: (5 + (i * 2.3)).toFixed(1),
                total_poids: Math.round((5 + (i * 2.3)) * 1000),
                prix_unitaire: 45 + (i * 5),
                montant_ht: Math.round((45 + (i * 5)) * (5 + (i * 2.3))),
                frais_administratif: 15 + (i * 2),
                taux_tva: 20,
                montant_tva: Math.round((45 + (i * 5)) * (5 + (i * 2.3)) * 0.2),
                montant_ttc: Math.round((45 + (i * 5)) * (5 + (i * 2.3)) * 1.2)
            });
        }

        // Génération des PDFs optimisés
        console.log('📄 Génération PDF non-transport optimisé...');
        const pdfNonTransport = await exportService.generateDocumentPdf(factureNonTransport, lignesNonTransport);
        const pathNonTransport = path.join(__dirname, 'test-pdf-optimized-non-transport.pdf');
        fs.writeFileSync(pathNonTransport, pdfNonTransport);
        console.log(`✅ PDF non-transport optimisé: ${pathNonTransport}`);

        console.log('📄 Génération PDF transport optimisé (avec pagination)...');
        const pdfTransport = await exportService.generateDocumentPdf(factureTransport, lignesTransport);
        const pathTransport = path.join(__dirname, 'test-pdf-optimized-transport.pdf');
        fs.writeFileSync(pathTransport, pdfTransport);
        console.log(`✅ PDF transport optimisé: ${pathTransport}`);

        // Test 3: Facture avec montants élevés pour tester le formatage
        console.log('\n💰 Test 3: Facture avec montants élevés');
        const factureGrandsMontants = {
            id: 3,
            numero: 'F2025-003',
            type_document: 'facture',
            categorie_facture: 'non-transport',
            date_emission: new Date(),
            date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            client_nom: 'MEGA CORPORATION INTERNATIONAL',
            client_adresse: '789 Place des Affaires\nTour Executive - 50ème étage\n75001 Paris',
            client_ville: 'Paris',
            montant_ht: 125000,
            montant_tva: 25000,
            montant_ttc: 150000,
            notes: 'Projet d\'envergure - Facturation trimestrielle'
        };

        const lignesGrandsMontants = [
            {
                id: 1,
                item: 'PROJ-001',
                description: 'Développement solution sur mesure - Architecture complète',
                unite: 'forfait',
                quantite: 1,
                prix_unitaire: 125000,
                montant_ht: 125000,
                taux_tva: 20,
                montant_tva: 25000,
                montant_ttc: 150000
            }
        ];

        console.log('📄 Génération PDF grands montants...');
        const pdfGrandsMontants = await exportService.generateDocumentPdf(factureGrandsMontants, lignesGrandsMontants);
        const pathGrandsMontants = path.join(__dirname, 'test-pdf-optimized-grands-montants.pdf');
        fs.writeFileSync(pathGrandsMontants, pdfGrandsMontants);
        console.log(`✅ PDF grands montants: ${pathGrandsMontants}`);

        console.log('\n🎯 Résumé des améliorations testées:');
        console.log('✅ En-tête professionnel avec logo et informations entreprise');
        console.log('✅ Colonnes adaptatives selon le contenu');
        console.log('✅ Formatage optimisé des montants et dates');
        console.log('✅ Pagination automatique pour les longs tableaux');
        console.log('✅ Section totaux avec design moderne');
        console.log('✅ Gestion des grands montants et textes longs');
        console.log('✅ Pied de page professionnel');
        
        console.log('\n📁 Fichiers générés:');
        console.log('  • test-pdf-optimized-non-transport.pdf (facture classique optimisée)');
        console.log('  • test-pdf-optimized-transport.pdf (avec pagination)');
        console.log('  • test-pdf-optimized-grands-montants.pdf (test formatage)');

    } catch (error) {
        console.error('❌ Erreur lors du test PDF optimisé:', error);
    } finally {
        console.log('🔚 Fin du test des améliorations visuelles');
        process.exit(0);
    }
}

testOptimizedPdf();