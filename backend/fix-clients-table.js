/**
 * Migration pour ajouter les colonnes manquantes à la table clients
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

async function addMissingColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Début de la migration des colonnes manquantes...\n');
    
    await client.query('BEGIN');
    
    // Liste des colonnes à ajouter avec leurs définitions
    const columnsToAdd = [
      { name: 'prenom', definition: 'VARCHAR(100)' },
      { name: 'ville', definition: 'VARCHAR(100)' },
      { name: 'code_postal', definition: 'VARCHAR(10)' },
      { name: 'pays', definition: 'VARCHAR(100) DEFAULT \'France\'' },
      { name: 'type_client', definition: 'VARCHAR(50) DEFAULT \'particulier\'' },
      { name: 'siret', definition: 'VARCHAR(14)' },
      { name: 'tva_intracommunautaire', definition: 'VARCHAR(20)' },
      { name: 'notes', definition: 'TEXT' },
      { name: 'actif', definition: 'BOOLEAN DEFAULT true' },
      { name: 'date_suppression', definition: 'TIMESTAMP' },
      { name: 'updated_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ];
    
    // Vérifier quelles colonnes existent déjà
    const existingColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'clients' 
      AND table_schema = 'public'
    `);
    
    const existingColumnNames = existingColumns.rows.map(row => row.column_name);
    console.log('📋 Colonnes existantes:', existingColumnNames.join(', '));
    
    // Ajouter les colonnes manquantes
    for (const column of columnsToAdd) {
      if (!existingColumnNames.includes(column.name)) {
        console.log(`➕ Ajout de la colonne: ${column.name}`);
        await client.query(`
          ALTER TABLE clients 
          ADD COLUMN ${column.name} ${column.definition}
        `);
      } else {
        console.log(`⏭️  Colonne ${column.name} existe déjà`);
      }
    }
    
    await client.query('COMMIT');
    console.log('\n✅ Migration terminée avec succès !');
    
    // Vérifier le résultat
    const finalColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'clients' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Structure finale de la table clients:');
    console.log('=' .repeat(70));
    finalColumns.rows.forEach(row => {
      console.log(`${row.column_name.padEnd(25)} | ${row.data_type.padEnd(20)} | ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur lors de la migration:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addMissingColumns().catch(console.error);