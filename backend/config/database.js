/**
 * Configuration de la base de données
 */

const { Pool } = require('pg');

// Configuration de la base de données selon l'environnement
const dbConfig = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'heraclion_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: false,
    max: 10,                    // Réduire le nombre max de connexions
    min: 2,                     // Maintenir au moins 2 connexions
    idleTimeoutMillis: 60000,   // 60s avant fermeture idle
    connectionTimeoutMillis: 10000, // 10s timeout (au lieu de 2s)
    acquireTimeoutMillis: 30000,    // 30s pour obtenir une connexion
    statement_timeout: 30000,       // 30s timeout pour les requêtes
    query_timeout: 30000,           // 30s timeout global
    keepAlive: true,               // Maintenir les connexions vivantes
    keepAliveInitialDelayMillis: 10000,
  },
  test: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'heraclion_test',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: false,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 2000,
  },
  production: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
};


const environment = process.env.NODE_ENV || 'development';
const config = dbConfig[environment];

// Diagnostic temporaire : afficher le mot de passe et son type
console.log('DB_PASSWORD:', process.env.DB_PASSWORD, typeof process.env.DB_PASSWORD);

// Pool de connexions
const pool = new Pool(config);

// Compteur de reconnexions
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Gestion des erreurs du pool avec reconnexion automatique
pool.on('error', (err, client) => {
  console.error('❌ Erreur inattendue sur le client idle:', err.message);
  console.error('Code erreur:', err.code);
  
  // Ne pas tuer le processus, tenter de reconnecter
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    console.log(`🔄 Tentative de reconnexion ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`);
    
    setTimeout(async () => {
      try {
        await pool.query('SELECT 1'); // Test de connexion
        console.log('✅ Reconnexion réussie');
        reconnectAttempts = 0; // Reset du compteur
      } catch (reconnectErr) {
        console.error('❌ Échec de reconnexion:', reconnectErr.message);
      }
    }, 5000 * reconnectAttempts); // Délai croissant
  } else {
    console.error('🚨 CRITIQUE: Trop de tentatives de reconnexion échouées');
    console.error('🛑 Arrêt du serveur pour éviter la corruption des données');
    process.exit(1);
  }
});

// Gestion de la connexion
pool.on('connect', () => {
  console.log(`Connecté à la base de données ${config.database} en mode ${environment}`);
});

/**
 * Exécuter une requête avec retry automatique
 * @param {string} text - Requête SQL
 * @param {Array} params - Paramètres de la requête
 * @param {number} retries - Nombre de tentatives restantes
 * @returns {Promise} Résultat de la requête
 */
const query = async (text, params, retries = 3) => {
  const start = Date.now();
  
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log uniquement les requêtes lentes (>500ms)
    if (duration > 500) {
      console.warn('⚠️  Requête lente détectée', { 
        text: text.substring(0, 100) + '...', 
        duration, 
        rows: res.rowCount 
      });
    } else {
      console.debug('Requête exécutée', { 
        text: text.substring(0, 50) + '...', 
        duration, 
        rows: res.rowCount 
      });
    }
    
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('❌ Erreur lors de l\'exécution de la requête', { 
      text: text.substring(0, 100) + '...', 
      error: error.message,
      code: error.code,
      duration,
      retriesLeft: retries
    });
    
    // Retry pour certaines erreurs de connexion
    if (retries > 0 && isRetryableError(error)) {
      console.log(`🔄 Nouvelle tentative dans 1s... (${retries} restantes)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return query(text, params, retries - 1);
    }
    
    throw error;
  }
};

/**
 * Vérifier si une erreur justifie un retry
 * @param {Error} error - L'erreur à analyser
 * @returns {boolean} - True si l'erreur est récupérable
 */
const isRetryableError = (error) => {
  const retryableCodes = [
    '53300', // too_many_connections
    '57P01', // admin_shutdown
    '57P02', // crash_shutdown
    '57P03', // cannot_connect_now
    '08000', // connection_exception
    '08003', // connection_does_not_exist
    '08006', // connection_failure
    '08001', // sqlclient_unable_to_establish_sqlconnection
    '08004', // sqlserver_rejected_establishment_of_sqlconnection
  ];
  
  return retryableCodes.includes(error.code) || 
         error.message.includes('connection terminated') ||
         error.message.includes('Connection terminated') ||
         error.message.includes('timeout');
};

/**
 * Obtenir un client pour les transactions
 * @returns {Promise} Client de la base de données
 */
const getClient = async () => {
  const client = await pool.connect();
  const query = client.query;
  const done = client.release;
  
  // Patch pour logger les requêtes
  client.query = (...args) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };
  
  // Améliorer la méthode done
  client.done = () => {
    client.lastQuery = null;
    done.call(client);
  };
  
  return client;
};

/**
 * Fermer le pool de connexions
 */
const end = async () => {
  await pool.end();
  console.log('Pool de connexions fermé');
};

/**
 * Monitoring du pool de connexions
 */
const getPoolStats = () => {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
    config: {
      max: config.max,
      min: config.min || 0,
      idleTimeoutMillis: config.idleTimeoutMillis,
      connectionTimeoutMillis: config.connectionTimeoutMillis
    }
  };
};

/**
 * Diagnostic rapide de la base de données
 */
const healthCheck = async () => {
  try {
    const start = Date.now();
    const result = await pool.query('SELECT NOW() as server_time, current_database() as db_name');
    const duration = Date.now() - start;
    
    return {
      healthy: true,
      duration,
      serverTime: result.rows[0].server_time,
      database: result.rows[0].db_name,
      poolStats: getPoolStats()
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      code: error.code,
      poolStats: getPoolStats()
    };
  }
};

// Monitoring automatique toutes les 5 minutes
setInterval(async () => {
  const stats = getPoolStats();
  
  // Alertes si problèmes détectés
  if (stats.waitingCount > 0) {
    console.warn(`⚠️  ${stats.waitingCount} connexions en attente`);
  }
  
  if (stats.totalCount > (config.max * 0.8)) {
    console.warn(`⚠️  Pool presque plein: ${stats.totalCount}/${config.max} connexions`);
  }
  
  // Log périodique des stats (optionnel, commenté par défaut)
  // console.log('📊 Pool stats:', stats);
}, 5 * 60 * 1000); // 5 minutes

module.exports = {
  pool,
  query,
  getClient,
  end,
  config,
  getPoolStats,
  healthCheck,
  isRetryableError
};