/**
 * Point d'entrée principal de l'application Heraclion Backend
 * Serveur Express avec configuration complète
 */




console.log('--- [server.js] Début du chargement de server.js ---');
require('dotenv').config();
console.log('DEBUG (server.js): DB_PASSWORD =', process.env.DB_PASSWORD, '| type:', typeof process.env.DB_PASSWORD);

console.log('Avant require ./app');
const app = require('./app');
console.log('Après require ./app');

console.log('Avant require ./utils/logger');
const { logger } = require('./utils/logger');
console.log('Après require ./utils/logger');

console.log('Avant require ./config/database');
const db = require('./config/database');
console.log('Après require ./config/database');

console.log('Avant require ./routes/users');
const usersRouter = require('./routes/users');
console.log('Après require ./routes/users');

// Port d'écoute (configurable via variable d'environnement PORT, fallback 3000)
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Démarrage du serveur

console.log('Avant require ./wsServer');
const { initWebSocket } = require('./wsServer');
console.log('Après require ./wsServer');

console.log('Avant require ./wsDashboardPush');
const { startDashboardPush, stopDashboardPush } = require('./wsDashboardPush');
console.log('Après require ./wsDashboardPush');

console.log('Avant app.listen');
const server = app.listen(PORT, () => {
  if (process.env.NODE_ENV === 'test') {
  global.server = server;
}

  console.log(`Backend démarré sur le port ${PORT}`);
  logger.info(`🚀 Serveur Heraclion démarré sur le port ${PORT}`);
  logger.info(`📝 Documentation API disponible sur http://localhost:${PORT}/api/docs`);
  logger.info(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
  // Initialiser le serveur WebSocket
  initWebSocket(server);
  // Démarrer le push dashboard WebSocket
  startDashboardPush();
  console.log('Après démarrage complet du serveur (callback app.listen)');
});
console.log('Après app.listen (immédiat)');

// Gestion propre de l'arrêt du serveur
const gracefulShutdown = async (signal) => {
  logger.info(`Réception du signal ${signal}. Arrêt propre du serveur...`);

  server.close(async () => {
    logger.info('Serveur HTTP fermé');

    // Arrêter le push dashboard WebSocket
    stopDashboardPush();

    console.log('Début du chargement de server.js');
    try {
      // Fermer les connexions à la base de données
    console.log('Avant require(app.js)');
      if (db && typeof db.end === 'function') {
    console.log('Après require(app.js)');
        await db.end();
        logger.info('Connexions à la base de données fermées');
    console.log('Avant require(http)');
      }
    console.log('Après require(http)');
      process.exit(0);
    } catch (error) {
    console.log('Avant http.createServer');
      logger.error('Erreur lors de l\'arrêt propre:', error);
    console.log('Après http.createServer');
      process.exit(1);
    }
    console.log('Avant app.listen');
  });

      console.log(`Serveur démarré et écoute sur le port ${PORT}`);
  // Force l'arrêt après 30 secondes
  setTimeout(() => {
    console.log('Après app.listen (ce log ne devrait apparaître que si listen est synchrone)');
    logger.error('Arrêt forcé - timeout de 30s dépassé');
    process.exit(1);
  }, 30000);
};

// Écoute des signaux d'arrêt
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  logger.error('Exception non capturée:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Rejection non gérée:', { reason, promise });
  gracefulShutdown('unhandledRejection');
});

app.use('/api/users', usersRouter);

module.exports = server;
