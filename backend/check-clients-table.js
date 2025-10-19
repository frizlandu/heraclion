/**
 * Script pour vérifier la structure de la table clients
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'heraclion',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || ''
});

async function checkClientsTable() {
  try {
    console.log('🔍 Vérification de la structure de la table clients...\n');
    
    // Récupérer la structure de la table clients
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'clients' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Colonnes de la table clients:');
    console.log('=' .repeat(60));
    
    result.rows.forEach(row => {
      console.log(`${row.column_name.padEnd(25)} | ${row.data_type.padEnd(15)} | ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n📊 Nombre de colonnes:', result.rows.length);
    
    // Vérifier si la colonne ville existe
    const hasVille = result.rows.some(row => row.column_name === 'ville');
    console.log('🏙️  Colonne "ville" existe:', hasVille ? '✅ OUI' : '❌ NON');
    
    // Compter les clients existants
    const countResult = await pool.query('SELECT COUNT(*) as total FROM clients');
    console.log('👥 Nombre de clients:', countResult.rows[0].total);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

checkClientsTable();