#!/usr/bin/env node

/**
 * Script de test pour l'API de configuration PDF
 * Usage: node test-pdf-config-api.js
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const BASE_URL = 'http://localhost:3000/api/v1/pdf-config';

class PdfConfigTester {
  constructor() {
    this.results = [];
  }

  async log(message, success = true) {
    const timestamp = new Date().toISOString();
    const status = success ? '✅' : '❌';
    const logMessage = `${timestamp} ${status} ${message}`;
    
    console.log(logMessage);
    this.results.push({ timestamp, success, message });
  }

  async testEndpoint(name, method, url, data = null) {
    try {
      const config = {
        method,
        url: `${BASE_URL}${url}`,
        timeout: 10000
      };

      if (data) {
        config.data = data;
        config.headers = { 'Content-Type': 'application/json' };
      }

      const response = await axios(config);
      await this.log(`${name}: ${response.status} ${response.statusText}`);
      return response.data;
    } catch (error) {
      await this.log(`${name}: ERREUR - ${error.message}`, false);
      return null;
    }
  }

  async testFileUpload() {
    try {
      // Créer un fichier de test temporaire
      const testImagePath = path.join(__dirname, 'test-logo.png');
      const testImageData = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
        0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
        0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x37, 0x6E,
        0xF9, 0x24, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
        0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);

      await fs.writeFile(testImagePath, testImageData);

      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('logo', await fs.readFile(testImagePath), {
        filename: 'test-logo.png',
        contentType: 'image/png'
      });

      const response = await axios.post(`${BASE_URL}/logos/upload`, formData, {
        headers: formData.getHeaders(),
        timeout: 10000
      });

      await this.log(`Upload logo: ${response.status} ${response.statusText}`);
      
      // Nettoyer le fichier de test
      await fs.unlink(testImagePath);
      
      return response.data;
    } catch (error) {
      await this.log(`Upload logo: ERREUR - ${error.message}`, false);
      return null;
    }
  }

  async runAllTests() {
    await this.log('=== DÉBUT DES TESTS API PDF CONFIG ===');
    
    // Test 1: Récupération de la configuration
    await this.testEndpoint('GET Configuration', 'GET', '');
    
    // Test 2: Liste des templates
    const templatesData = await this.testEndpoint('GET Templates', 'GET', '/templates');
    
    // Test 3: Activation d'un template
    if (templatesData && templatesData.data && templatesData.data.length > 0) {
      const firstTemplate = templatesData.data[0];
      await this.testEndpoint('PUT Activer Template', 'PUT', `/templates/${firstTemplate.id}`);
    }
    
    // Test 4: Liste des logos
    await this.testEndpoint('GET Logos', 'GET', '/logos');
    
    // Test 5: Upload d'un logo de test
    await this.testFileUpload();
    
    // Test 6: Mise à jour de la configuration
    const configUpdate = {
      company: {
        name: 'HERACLION TRANSPORT TEST',
        address: '123 Rue de Test',
        city: '13000 Marseille',
        phone: '04.XX.XX.XX.XX',
        email: 'test@heraclion.fr',
        siret: '123 456 789 00012'
      }
    };
    await this.testEndpoint('PUT Configuration', 'PUT', '', configUpdate);
    
    // Test 7: Génération d'aperçu PDF
    try {
      const response = await axios.post(`${BASE_URL}/preview`, {}, {
        responseType: 'arraybuffer',
        timeout: 15000
      });
      
      if (response.status === 200 && response.data.length > 0) {
        await this.log(`Génération aperçu PDF: ${response.data.length} bytes générés`);
        
        // Sauvegarder le PDF de test
        const testPdfPath = path.join(__dirname, 'test-apercu.pdf');
        await fs.writeFile(testPdfPath, response.data);
        await this.log(`PDF sauvegardé: ${testPdfPath}`);
      }
    } catch (error) {
      await this.log(`Génération aperçu PDF: ERREUR - ${error.message}`, false);
    }
    
    await this.log('=== FIN DES TESTS ===');
    
    // Résumé
    const totalTests = this.results.filter(r => r.message.includes(':')).length;
    const successfulTests = this.results.filter(r => r.success && r.message.includes(':')).length;
    
    console.log(`\n📊 RÉSUMÉ: ${successfulTests}/${totalTests} tests réussis`);
    
    if (successfulTests === totalTests) {
      console.log('🎉 Tous les tests sont passés avec succès!');
      console.log('✨ L\'interface de configuration PDF est prête à être utilisée.');
    } else {
      console.log('⚠️ Certains tests ont échoué. Vérifiez la configuration du serveur.');
    }
    
    return this.results;
  }
}

// Exécution des tests si ce script est appelé directement
if (require.main === module) {
  const tester = new PdfConfigTester();
  
  tester.runAllTests()
    .then(() => {
      console.log('\n🏁 Tests terminés.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur durant les tests:', error);
      process.exit(1);
    });
}

module.exports = PdfConfigTester;