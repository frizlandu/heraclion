/**
 * Configuration d'environnement pour les tests
 */

// Variables d'environnement spécifiques aux tests
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.DB_NAME = 'heraclion_test';
process.env.REDIS_DB = 1; // Base de données Redis différente pour les tests
process.env.JWT_SECRET = 'test-secret-key-very-long-and-secure';
process.env.JWT_EXPIRES_IN = '1h';

// Désactiver les logs pendant les tests sauf en cas d'erreur
if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  // console.error reste actif pour le debugging
}