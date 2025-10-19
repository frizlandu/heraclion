/**
 * Script de diagnostic de la base de données
 * Analyser les connexions, timeouts et performances
 */

const db = require('../config/database');

async function runDiagnostic() {
  console.log('🔍 DIAGNOSTIC BASE DE DONNÉES - DÉBUT');
  console.log('=====================================');
  
  try {
    // 1. Tester la connexion basique
    console.log('\n1. Test de connexion basique...');
    const startTime = Date.now();
    const result = await db.query('SELECT NOW() as current_time, version() as pg_version');
    const connectionTime = Date.now() - startTime;
    console.log(`✅ Connexion OK - Temps: ${connectionTime}ms`);
    console.log(`📅 Heure serveur: ${result.rows[0].current_time}`);
    console.log(`🗄️  Version PostgreSQL: ${result.rows[0].pg_version.split(' ')[0]}`);
    
    // 2. Vérifier les statistiques de connexion
    console.log('\n2. Statistiques des connexions actives...');
    const connStats = await db.query(`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections,
        count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
        count(*) FILTER (WHERE application_name LIKE '%node%') as node_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `);
    
    const stats = connStats.rows[0];
    console.log(`📊 Connexions totales: ${stats.total_connections}`);
    console.log(`🔥 Connexions actives: ${stats.active_connections}`);
    console.log(`💤 Connexions idle: ${stats.idle_connections}`);
    console.log(`⚠️  Connexions idle in transaction: ${stats.idle_in_transaction}`);
    console.log(`🟢 Connexions Node.js: ${stats.node_connections}`);
    
    // 3. Vérifier les limites PostgreSQL
    console.log('\n3. Limites et configuration PostgreSQL...');
    const limits = await db.query(`
      SELECT 
        name, 
        setting, 
        unit,
        context,
        short_desc
      FROM pg_settings 
      WHERE name IN (
        'max_connections', 
        'shared_buffers', 
        'work_mem',
        'maintenance_work_mem',
        'checkpoint_timeout',
        'wal_buffers',
        'effective_cache_size'
      )
      ORDER BY name
    `);
    
    limits.rows.forEach(row => {
      console.log(`📋 ${row.name}: ${row.setting}${row.unit || ''} - ${row.short_desc}`);
    });
    
    // 4. Tester les performances sur différentes tables
    console.log('\n4. Test de performances des requêtes...');
    const tables = ['clients', 'documents', 'entreprises', 'lignes_documents'];
    
    for (const table of tables) {
      try {
        const start = Date.now();
        const count = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
        const duration = Date.now() - start;
        console.log(`📊 ${table}: ${count.rows[0].count} enregistrements - ${duration}ms`);
        
        if (duration > 1000) {
          console.log(`⚠️  ALERTE: ${table} prend plus de 1s (${duration}ms)`);
        }
      } catch (error) {
        console.log(`❌ Erreur sur ${table}: ${error.message}`);
      }
    }
    
    // 5. Tester les connexions multiples simultanées
    console.log('\n5. Test de charge avec connexions multiples...');
    const promises = [];
    const numTests = 10;
    
    for (let i = 0; i < numTests; i++) {
      promises.push(
        db.query('SELECT $1 as test_number, pg_sleep(0.1)', [i])
          .then(() => ({ success: true, test: i }))
          .catch(error => ({ success: false, test: i, error: error.message }))
      );
    }
    
    const results = await Promise.all(promises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Tests réussis: ${successful}/${numTests}`);
    if (failed.length > 0) {
      console.log(`❌ Tests échoués: ${failed.length}`);
      failed.forEach(f => console.log(`   Test ${f.test}: ${f.error}`));
    }
    
    // 6. Pool diagnostics
    console.log('\n6. Statistiques du pool de connexions...');
    console.log(`🏊 Pool total size: ${db.pool.totalCount}`);
    console.log(`🔄 Pool idle connections: ${db.pool.idleCount}`);
    console.log(`⏳ Pool waiting count: ${db.pool.waitingCount}`);
    
    // 7. Recommandations
    console.log('\n7. 💡 RECOMMANDATIONS');
    console.log('====================');
    
    if (parseInt(stats.idle_in_transaction) > 0) {
      console.log('⚠️  PROBLÈME: Connexions "idle in transaction" détectées');
      console.log('   Solution: Vérifier que toutes les transactions sont bien fermées');
    }
    
    if (parseInt(stats.total_connections) > 15) {
      console.log('⚠️  ATTENTION: Nombre élevé de connexions');
      console.log('   Solution: Réduire max connections dans le pool ou identifier les fuites');
    }
    
    const maxConn = limits.rows.find(r => r.name === 'max_connections');
    if (maxConn && parseInt(stats.total_connections) > parseInt(maxConn.setting) * 0.8) {
      console.log('🚨 CRITIQUE: Approche de la limite max_connections');
      console.log(`   Connexions actuelles: ${stats.total_connections}/${maxConn.setting}`);
    }
    
    console.log('\n✅ Diagnostic terminé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
    console.error('Stack trace:', error.stack);
  }
  
  console.log('\n=====================================');
  console.log('🔍 DIAGNOSTIC BASE DE DONNÉES - FIN');
}

// Exécuter le diagnostic
runDiagnostic()
  .then(() => {
    console.log('\n👋 Diagnostic terminé. Vous pouvez maintenant analyser les résultats.');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });