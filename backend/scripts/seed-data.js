/**
 * Script d'insertion des données de test pour Heraclion
 */
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function seedData() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Insertion des données de test Heraclion...\n');
    
    // 1. Vérifier et insérer les entreprises
    console.log('📊 Insertion des entreprises...');
    
    // Vérifier si des entreprises existent déjà
    const existingEntreprises = await client.query('SELECT COUNT(*) FROM entreprises');
    if (parseInt(existingEntreprises.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO entreprises (nom, logo, telephone, adresse, reference, autres_coordonnees, prefix_facture, type_entreprise) 
        VALUES 
        ('HERACLION TRANSPORT', 'heraclion_logo.png', '+33 1 23 45 67 89', '123 Rue de la Paix, 75001 Paris', 'REF-HRAKIN', 'Email: contact@heraclion.fr\nSIRET: 12345678901234', 'HRAKIN', 'TRANSPORT'),
        ('MEGATRANS LOGISTICS', 'megatrans_logo.png', '+33 1 98 76 54 32', '456 Avenue des Champs, 69000 Lyon', 'REF-MGT', 'Email: info@megatrans.fr\nSIRET: 98765432109876', 'MGT', 'TRANSPORT'),
        ('TRANSKIN SERVICES', 'transkin_logo.png', '+33 4 56 78 90 12', '789 Boulevard Maritime, 13000 Marseille', 'REF-TRANSKIN', 'Email: admin@transkin.fr\nSIRET: 11223344556677', 'TRANSKIN', 'NON_TRANSPORT'),
        ('CARGO FRANCE', 'cargo_logo.png', '+33 2 34 56 78 90', '321 Port de Commerce, 76000 Le Havre', 'REF-CARGO', 'Email: commercial@cargo-france.fr\nSIRET: 55667788990011', 'CARGO', 'TRANSPORT')
      `);
      console.log('   ✅ 4 entreprises insérées');
    } else {
      console.log('   ⚠️ Entreprises déjà présentes, insertion ignorée');
    }
    
    // 2. Vérifier et insérer les clients
    console.log('👥 Insertion des clients...');
    
    const existingClients = await client.query('SELECT COUNT(*) FROM clients');
    if (parseInt(existingClients.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO clients (nom, adresse, telephone, email) 
        VALUES 
        ('CLIENT TRANSPORT SA', '100 Rue du Commerce, 75002 Paris', '+33 1 11 22 33 44', 'contact@clienttransport.fr'),
        ('LOGISTIQUE MODERNE SARL', '200 Avenue de la Logistique, 69100 Lyon', '+33 4 22 33 44 55', 'info@logistiquemoderne.fr'),
        ('IMPORT EXPORT SARL', '300 Quai des Marchandises, 13001 Marseille', '+33 4 33 44 55 66', 'admin@importexport.fr'),
        ('DISTRIBUTION RAPIDE', '400 Zone Industrielle, 31000 Toulouse', '+33 5 44 55 66 77', 'commercial@distrib-rapide.fr'),
        ('CARGO EXPRESS INTERNATIONAL', '500 Port de Commerce, 76000 Le Havre', '+33 2 55 66 77 88', 'service@cargo-express.fr'),
        ('MARTIN DUPONT PARTICULIER', '15 Rue des Particuliers, 33000 Bordeaux', '+33 5 11 22 33 44', 'martin.dupont@email.fr'),
        ('SOPHIE BERNARD', '25 Avenue des Vignes, 21000 Dijon', '+33 3 22 33 44 55', 'sophie.bernard@email.fr')
      `);
      console.log('   ✅ 7 clients insérés');
    } else {
      console.log('   ⚠️ Clients déjà présents, insertion ignorée');
    }
    
    // 3. Vérifier et insérer des utilisateurs
    console.log('🔐 Insertion des utilisateurs...');
    
    const existingUsers = await client.query('SELECT COUNT(*) FROM utilisateurs');
    if (parseInt(existingUsers.rows[0].count) === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const hashedPassword2 = await bcrypt.hash('gestionnaire123', 10);
      const hashedPassword3 = await bcrypt.hash('comptable123', 10);
      
      await client.query(`
        INSERT INTO utilisateurs (nom, email, password_hash, role, actif) 
        VALUES 
        ('Administrateur Système', 'admin@heraclion.fr', $1, 'ADMIN', true),
        ('Marie Gestionnaire', 'gestionnaire@heraclion.fr', $2, 'GESTIONNAIRE', true),
        ('Pierre Comptable', 'comptable@heraclion.fr', $3, 'COMPTABLE', true),
        ('Julie Commercial', 'commercial@heraclion.fr', $1, 'ADMIN', true)
      `, [hashedPassword, hashedPassword2, hashedPassword3]);
      console.log('   ✅ 4 utilisateurs insérés');
    } else {
      console.log('   ⚠️ Utilisateurs déjà présents, insertion ignorée');
    }
    
    // 4. Vérifier et insérer des articles de stock
    console.log('📦 Insertion des articles de stock...');
    
    const existingStocks = await client.query('SELECT COUNT(*) FROM stocks');
    if (parseInt(existingStocks.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO stocks (reference, designation, quantite_stock, quantite_min, prix_achat, prix_vente) 
        VALUES 
        ('MOT001', 'Pièce détachée moteur V8', 50, 10, 125.50, 245.00),
        ('FIL002', 'Filtre à huile standard HD', 100, 20, 18.75, 35.50),
        ('BAT003', 'Batterie 12V 100Ah EXIDE', 25, 5, 185.00, 350.00),
        ('PNE004', 'Pneu 315/80R22.5 MICHELIN', 40, 8, 280.00, 520.00),
        ('FRE005', 'Kit freinage complet avant', 15, 3, 220.00, 420.00),
        ('HUI006', 'Huile moteur 15W40 (20L)', 80, 15, 45.00, 85.00),
        ('AMO007', 'Amortisseur arrière SACHS', 30, 6, 95.00, 180.00),
        ('COI008', 'Courroie de distribution GATES', 45, 8, 35.00, 68.00)
      `);
      console.log('   ✅ 8 articles de stock insérés');
    } else {
      console.log('   ⚠️ Articles de stock déjà présents, insertion ignorée');
    }
    
    // 5. Vérifier et insérer quelques documents de test
    console.log('📄 Insertion de documents de test...');
    
    const existingDocs = await client.query('SELECT COUNT(*) FROM documents');
    if (parseInt(existingDocs.rows[0].count) === 0) {
      const clientResult = await client.query('SELECT id FROM clients LIMIT 3');
      const clients = clientResult.rows;
      
      if (clients.length > 0) {
        await client.query(`
          INSERT INTO documents (type_document, numero, client_id, date_emission, date_echeance, montant_ht, taux_tva, montant_ttc, statut, notes) 
          VALUES 
          ('facture', 'FACT-2024-001', $1, '2024-01-15', '2024-02-15', 1500.00, 20.00, 1800.00, 'validé', 'Transport de marchandises Paris-Lyon'),
          ('proforma', 'PRO-2024-001', $2, '2024-01-20', '2024-02-20', 2300.00, 20.00, 2760.00, 'brouillon', 'Transport international France-Allemagne'),
          ('facture', 'FACT-2024-002', $3, '2024-01-25', '2024-02-25', 850.00, 20.00, 1020.00, 'envoyé', 'Livraison express régionale')
        `, [clients[0].id, clients[1]?.id || clients[0].id, clients[2]?.id || clients[0].id]);
        console.log('   ✅ 3 documents de test insérés');
      }
    } else {
      console.log('   ⚠️ Documents déjà présents, insertion ignorée');
    }
    
    console.log('✅ Données de test insérées avec succès !\n');
    
    // Afficher un résumé détaillé
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM entreprises) as entreprises,
        (SELECT COUNT(*) FROM clients) as clients,
        (SELECT COUNT(*) FROM utilisateurs) as utilisateurs,
        (SELECT COUNT(*) FROM stocks) as articles_stock,
        (SELECT COUNT(*) FROM documents) as documents
    `);
    
    console.log('📈 Résumé des données insérées :');
    console.log(`   - 🏢 Entreprises : ${stats.rows[0].entreprises}`);
    console.log(`   - 👥 Clients : ${stats.rows[0].clients}`);
    console.log(`   - 🔐 Utilisateurs : ${stats.rows[0].utilisateurs}`);
    console.log(`   - 📦 Articles stock : ${stats.rows[0].articles_stock}`);
    console.log(`   - 📄 Documents : ${stats.rows[0].documents}`);
    
    // Afficher les comptes utilisateurs créés
    console.log('\n🔑 Comptes utilisateurs créés :');
    console.log('   - admin@heraclion.fr / admin123 (Administrateur)');
    console.log('   - gestionnaire@heraclion.fr / gestionnaire123 (Gestionnaire)');
    console.log('   - comptable@heraclion.fr / comptable123 (Comptable)');
    console.log('   - commercial@heraclion.fr / admin123 (Commercial)');
    
    console.log('\n🚀 Prêt pour les tests API !');
    console.log('   Utilisez : npm run test:api');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des données:', error.message);
    if (error.code === '23505') {
      console.log('⚠️  Certaines données existent déjà (normal)');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécuter le script
if (require.main === module) {
  seedData().catch(console.error);
}

module.exports = { seedData };