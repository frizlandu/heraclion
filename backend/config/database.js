const { Pool } = require('pg');

const dbConfig = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'heraclion_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: false,
    max: 10,
    min: 2,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 10000,
    acquireTimeoutMillis: 30000,
    statement_timeout: 30000,
    query_timeout: 30000,
    keepAlive: true,
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
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
};

const environment = process.env.NODE_ENV || 'development';
const config = dbConfig[environment];

const pool = new Pool(config);
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

pool.on('error', (err) => {
  console.error('❌ Erreur client idle:', err.message);
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    console.log(`🔄 Reconnexion ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`);
    setTimeout(async () => {
      try {
        await pool.query('SELECT 1');
        console.log('✅ Reconnexion réussie');
        reconnectAttempts = 0;
      } catch (e) {
        console.error('❌ Échec de reconnexion:', e.message);
      }
    }, 5000 * reconnectAttempts);
  } else {
    console.error('🚨 Trop de tentatives échouées. Arrêt du serveur.');
    process.exit(1);
  }
});

pool.on('connect', () => {
  console.log(`✅ Connecté à ${config.database} [${environment}]`);
});

const isRetryableError = (error) => {
  const retryableCodes = [
    '53300', '57P01', '57P02', '57P03',
    '08000', '08003', '08006', '08001', '08004'
  ];
  return retryableCodes.includes(error.code) ||
         error.message.includes('connection terminated') ||
         error.message.includes('timeout');
};

const query = async (text, params, retries = 3) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 500) {
      console.warn('⚠️ Requête lente', { text: text.slice(0, 100), duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('❌ Erreur requête', { text: text.slice(0, 100), error: error.message, code: error.code, duration, retriesLeft: retries });
    if (retries > 0 && isRetryableError(error)) {
      console.log(`🔄 Retry dans 1s... (${retries} restantes)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return query(text, params, retries - 1);
    }
    throw error;
  }
};

const getClient = async () => {
  const client = await pool.connect();
  const originalQuery = client.query;
  const release = client.release;

  client.query = (...args) => {
    client.lastQuery = args;
    return originalQuery.apply(client, args);
  };

  client.done = () => {
    client.lastQuery = null;
    release.call(client);
  };

  return client;
};

const end = async () => {
  await pool.end();
  console.log('🛑 Pool fermé');
};

const getPoolStats = () => ({
  totalCount: pool.totalCount,
  idleCount: pool.idleCount,
  waitingCount: pool.waitingCount,
  config: {
    max: config.max,
    min: config.min || 0,
    idleTimeoutMillis: config.idleTimeoutMillis,
    connectionTimeoutMillis: config.connectionTimeoutMillis
  }
});

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

// ✅ Monitoring désactivé en test
if (process.env.NODE_ENV !== 'test') {
  console.log('⏱️ Monitoring pool activé');
  setInterval(() => {
    const stats = getPoolStats();
    if (stats.waitingCount > 0) {
      console.warn(`⚠️ ${stats.waitingCount} connexions en attente`);
    }
    if (stats.totalCount > (config.max * 0.8)) {
      console.warn(`⚠️ Pool presque plein: ${stats.totalCount}/${config.max}`);
    }
  }, 5 * 60 * 1000);
}

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
