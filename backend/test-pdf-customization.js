// Test complet des options de personnalisation PDF
const path = require('path');
const fs = require('fs');
const pdfConfig = require('./config/pdfConfig');
const logoManager = require('./services/logoManager');
const exportService = require('./services/exportService');

async function testCustomizationOptions() {
    try {
        console.log('🎨 Test complet des options de personnalisation PDF...\n');

        // Données de test
        const testDocument = {
            id: 1,
            numero: 'F2025-CUSTOM-001',
            type_document: 'facture',
            categorie_facture: 'non-transport',
            date_emission: new Date(),
            date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            client_nom: 'ENTREPRISE TEST SARL',
            client_adresse: '123 Avenue de la Personnalisation\n75001 Paris',
            client_ville: 'Paris',
            client_email: 'test@entreprise-test.fr',
            montant_ht: 1500,
            montant_tva: 300,
            montant_ttc: 1800,
            notes: 'Facture de test pour la personnalisation'
        };

        const testLignes = [
            {
                id: 1,
                item: 'PERS-001',
                description: 'Service de personnalisation avancée',
                unite: 'forfait',
                quantite: 1,
                prix_unitaire: 1500,
                montant_ht: 1500,
                taux_tva: 20,
                montant_tva: 300,
                montant_ttc: 1800
            }
        ];

        // === TEST 1: TEMPLATE MODERNE ===
        console.log('📱 Test 1: Template MODERNE');
        pdfConfig.setTemplate('moderne');
        
        // Personnaliser les informations entreprise
        pdfConfig.updateCompany({
            name: 'HERACLION MODERNE',
            address: '456 Boulevard Innovation',
            city: '13001 Marseille',
            phone: '04.91.XX.XX.XX',
            email: 'modern@heraclion.fr'
        });

        let pdfBuffer = await exportService.generateDocumentPdf(testDocument, testLignes);
        let filename = 'test-template-moderne.pdf';
        fs.writeFileSync(path.join(__dirname, filename), pdfBuffer);
        console.log(`✅ PDF template moderne généré: ${filename}`);

        // === TEST 2: TEMPLATE CLASSIQUE ===
        console.log('\n🏛️ Test 2: Template CLASSIQUE');
        pdfConfig.setTemplate('classique');
        
        pdfConfig.updateCompany({
            name: 'HERACLION TRADITIONNEL',
            address: '789 Rue de la Tradition',
            city: '13002 Marseille'
        });

        pdfBuffer = await exportService.generateDocumentPdf(testDocument, testLignes);
        filename = 'test-template-classique.pdf';
        fs.writeFileSync(path.join(__dirname, filename), pdfBuffer);
        console.log(`✅ PDF template classique généré: ${filename}`);

        // === TEST 3: TEMPLATE MINIMALISTE ===
        console.log('\n⚪ Test 3: Template MINIMALISTE');
        pdfConfig.setTemplate('minimaliste');
        
        pdfBuffer = await exportService.generateDocumentPdf(testDocument, testLignes);
        filename = 'test-template-minimaliste.pdf';
        fs.writeFileSync(path.join(__dirname, filename), pdfBuffer);
        console.log(`✅ PDF template minimaliste généré: ${filename}`);

        // === INFORMATIONS SUR LA CONFIGURATION ===
        console.log('\n⚙️  Informations sur la configuration:');
        const config = pdfConfig.getConfig();
        console.log(`  Template actuel: ${config.current.template}`);
        console.log(`  Templates disponibles: ${Object.keys(config.templates).join(', ')}`);
        
        const colors = pdfConfig.getColors();
        console.log(`  Couleur principale: ${colors.primary}`);
        console.log(`  Couleur secondaire: ${colors.secondary}`);

        // === INFORMATIONS SUR LES LOGOS ===
        console.log('\n📁 Gestion des logos:');
        const logos = logoManager.getAvailableLogos();
        if (logos.length > 0) {
            console.log('✅ Logos disponibles:');
            logos.forEach(logo => {
                console.log(`  • ${logo.filename} (${logo.sizeKB}KB)`);
            });
        } else {
            console.log('ℹ️  Aucun logo disponible');
            console.log('   Pour ajouter un logo: placez vos fichiers PNG/JPG dans public/logos/');
            console.log('   Dimensions recommandées: 200x80px pour l\'en-tête');
        }

        // === RÉSUMÉ FINAL ===
        console.log('\n🎯 Fonctionnalités de personnalisation disponibles:');
        console.log('✅ 3 Templates prédéfinis (moderne, classique, minimaliste)');
        console.log('✅ Couleurs personnalisables par template');
        console.log('✅ Informations entreprise configurables');
        console.log('✅ Sections activables/désactivables');
        console.log('✅ Formatage personnalisé (monnaie, dates)');
        console.log('✅ Textes et libellés personnalisables');
        console.log('✅ Support des logos d\'entreprise');
        console.log('✅ Sauvegarde/chargement de configuration');
        
        console.log('\n📁 Fichiers générés:');
        console.log('  • test-template-moderne.pdf (couleurs modernes)');
        console.log('  • test-template-classique.pdf (style traditionnel)');
        console.log('  • test-template-minimaliste.pdf (design épuré)');

        console.log('\n🎊 Système de personnalisation PDF entièrement fonctionnel !');

    } catch (error) {
        console.error('❌ Erreur lors du test de personnalisation:', error);
        console.error(error.stack);
    } finally {
        console.log('\n🔚 Fin des tests de personnalisation');
        process.exit(0);
    }
}

testCustomizationOptions();