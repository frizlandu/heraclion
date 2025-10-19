const { Client } = require('pg');

(async () => {
  try {
    console.log('🔍 Vérification de la structure de la table entreprises...\n');

    // Configuration de connexion (basée sur votre config)
    const client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'heraclion',
      user: process.env.DB_USER || 'postgres',
      password: 'maclaine2013'
    });

    await client.connect();
    console.log('✅ Connecté à la base de données\n');

    // Vérifier la structure de la table entreprises
    const structureQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'entreprises'
      ORDER BY ordinal_position;
    `;

    const result = await client.query(structureQuery);
    
    console.log('📋 Structure de la table ENTREPRISES:');
    console.log('=====================================');
    result.rows.forEach(col => {
      console.log(`📄 ${col.column_name} - ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
    });

    // Récupérer quelques exemples d'entreprises
    console.log('\n📊 Exemples d\'entreprises:');
    console.log('===========================');
    const exampleQuery = 'SELECT * FROM entreprises LIMIT 3';
    const examples = await client.query(exampleQuery);
    
    examples.rows.forEach((row, index) => {
      console.log(`\n🏢 Entreprise ${index + 1}:`);
      Object.keys(row).forEach(key => {
        console.log(`   ${key}: ${row[key]}`);
      });
    });

    await client.end();

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    process.exit(0);
  }
})();