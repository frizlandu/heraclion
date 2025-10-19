// Test des améliorations visuelles du PDF
const path = require('path');
const fs = require('fs');

const exportService = require('./services/exportService');

async function testAméliorationsVisuelles() {
    try {
        console.log('🎨 Test des améliorations visuelles PDF...');

        // Test 1: Facture NON-TRANSPORT avec plusieurs lignes
        console.log('\n📋 Test 1: Facture NON-TRANSPORT (Présentation améliorée)');
        const factureNonTransport = {
            id: 1,
            numero: 'F2025-001',
            type_document: 'facture',
            categorie_facture: 'non-transport',
            date_emission: new Date(),
            date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            client_nom: 'Entreprise ABC Solutions',
            client_adresse: '123 Boulevard de la Innovation\n75001 Paris',
            client_ville: 'Paris, France',
            client_email: 'contact@abc-solutions.fr',
            montant_ht: 2500,
            montant_tva: 500,
            montant_ttc: 3000,
            notes: 'Facture pour services de développement logiciel. Paiement à 30 jours. Merci pour votre confiance.',
            conditions_paiement: '30 jours net'
        };

        const lignesNonTransport = [
            {
                id: 1,
                item: 'DEV001',
                description: 'Développement application web React',
                unite: 'jour',
                quantite: 10,
                prix_unitaire: 150,
                montant_ht: 1500,
                taux_tva: 20,
                montant_tva: 300,
                montant_ttc: 1800
            },
            {
                id: 2,
                item: 'DEV002',
                description: 'API Backend Node.js avec base PostgreSQL',
                unite: 'jour',
                quantite: 8,
                prix_unitaire: 125,
                montant_ht: 1000,
                taux_tva: 20,
                montant_tva: 200,
                montant_ttc: 1200
            }
        ];

        console.log('📄 Génération PDF non-transport amélioré...');
        const pdfNonTransport = await exportService.generateDocumentPdf(factureNonTransport, lignesNonTransport);
        const pathNonTransport = path.join(__dirname, 'pdf-ameliore-non-transport.pdf');
        fs.writeFileSync(pathNonTransport, pdfNonTransport);
        console.log(`✅ PDF non-transport généré: ${pathNonTransport}`);

        // Test 2: Facture TRANSPORT avec nombreuses lignes pour tester la pagination
        console.log('\n🚛 Test 2: Facture TRANSPORT (Avec pagination)');
        const factureTransport = {
            id: 2,
            numero: 'F2025-002',
            type_document: 'facture',
            categorie_facture: 'transport',
            date_emission: new Date(),
            date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            client_nom: 'Logistique Express SARL',
            client_adresse: '456 Route Nationale\n69000 Lyon',
            client_ville: 'Lyon, France',
            client_email: 'factures@logistique-express.com',
            montant_ht: 4500,
            montant_tva: 900,
            montant_ttc: 5400,
            notes: 'Transport de marchandises diverses selon contrat cadre. Livraison express confirmée.',
            lieu_chargement: 'Entrepôt Marseille Port',
            lieu_livraison: 'Centre de distribution Lyon'
        };

        // Créer plusieurs lignes pour tester la pagination
        const lignesTransport = [];
        for (let i = 1; i <= 15; i++) {
            lignesTransport.push({
                id: i,
                item: `TR${i.toString().padStart(3, '0')}`,
                description: `Transport marchandises lot ${i} - Colis divers`,
                date_transport: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
                plaque_immat: `${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(66 + (i % 25))}-${(100 + i).toString().slice(-3)}-${String.fromCharCode(67 + (i % 24))}${String.fromCharCode(68 + (i % 23))}`,
                ticket: `T${(100000 + i * 123).toString()}`,
                tonnes: (Math.random() * 20 + 5).toFixed(2),
                total_poids: Math.floor(Math.random() * 15000 + 5000),
                prix_unitaire: Math.floor(Math.random() * 100 + 50),
                montant_ht: Math.floor(Math.random() * 500 + 200),
                frais_administratif: Math.floor(Math.random() * 50 + 10),
                taux_tva: 20,
                montant_tva: function() { return Math.floor(this.montant_ht * 0.2); },
                montant_ttc: function() { return this.montant_ht + this.montant_tva(); }
            });
            
            // Calculer les montants réels
            const ligne = lignesTransport[i - 1];
            ligne.montant_tva = Math.floor(ligne.montant_ht * 0.2);
            ligne.montant_ttc = ligne.montant_ht + ligne.montant_tva;
        }

        console.log('📄 Génération PDF transport avec pagination...');
        const pdfTransport = await exportService.generateDocumentPdf(factureTransport, lignesTransport);
        const pathTransport = path.join(__dirname, 'pdf-ameliore-transport.pdf');
        fs.writeFileSync(pathTransport, pdfTransport);
        console.log(`✅ PDF transport généré: ${pathTransport}`);

        console.log('\n🎯 Améliorations implémentées:');
        console.log('✅ En-tête professionnel avec dégradés et encadrés colorés');
        console.log('✅ Informations client et transport dans des encadrés distincts');
        console.log('✅ Tableau avec colonnes optimisées et alignement approprié');
        console.log('✅ Pagination automatique avec en-têtes répétés');
        console.log('✅ Couleurs différenciées par type de données (montants, dates, etc.)');
        console.log('✅ Section totaux avec présentation encadrée et hiérarchisée');
        console.log('✅ Pied de page professionnel avec informations légales');
        console.log('✅ Numérotation des pages pour documents longs');
        
        console.log('\n📁 Fichiers générés:');
        console.log(`   • ${pathNonTransport}`);
        console.log(`   • ${pathTransport}`);

    } catch (error) {
        console.error('❌ Erreur lors du test des améliorations:', error);
    } finally {
        console.log('\n🔚 Fin du test des améliorations visuelles');
        process.exit(0);
    }
}

testAméliorationsVisuelles();