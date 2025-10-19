/**
 * Script de migration pour ajouter la colonne categorie_facture
 */
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'heraclion',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'maclaine2013'
});

async function addCategorieFactureColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Ajout de la colonne categorie_facture à la table documents...');
    
    // Vérifier si la colonne existe déjà
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'documents' 
      AND column_name = 'categorie_facture'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ La colonne categorie_facture existe déjà');
      return;
    }
    
    // Ajouter la colonne
    await client.query(`
      ALTER TABLE documents 
      ADD COLUMN categorie_facture VARCHAR(20) DEFAULT 'transport'
    `);
    
    console.log('✅ Colonne categorie_facture ajoutée avec succès');
    
    // Vérifier que la colonne a bien été ajoutée
    const verify = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'documents' 
      AND column_name = 'categorie_facture'
    `);
    
    if (verify.rows.length > 0) {
      console.log('✅ Vérification réussie:', verify.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de la colonne:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await addCategorieFactureColumn();
    console.log('🎉 Migration terminée avec succès');
    process.exit(0);
  } catch (error) {
    console.error('💥 Échec de la migration:', error.message);
    process.exit(1);
  }
}

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
  main();
}

module.exports = { addCategorieFactureColumn };