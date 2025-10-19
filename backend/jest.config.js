/**
 * Configuration Jest pour les tests
 */

module.exports = {
  // Environnement de test
  testEnvironment: 'node',
  
  // Répertoires des tests
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  
  // Fichiers à ignorer
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/'
  ],
  
  // Configuration de couverture
  collectCoverage: true,
  collectCoverageFrom: [
    'models/**/*.js',
    'services/**/*.js',
    'utils/**/*.js',
    'middleware/**/*.js',
    'routes/**/*.js',
    'validators/**/*.js',
    'jobs/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**',
    '!server.js',
    '!app.js'
  ],
  
  // Seuils de couverture
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Formats de rapport de couverture
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],
  
  // Répertoire de sortie des rapports
  coverageDirectory: '<rootDir>/coverage',
  
  // Setup et teardown
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Timeout par défaut pour les tests
  testTimeout: 10000,
  
  // Variables d'environnement pour les tests
  setupFiles: ['<rootDir>/tests/env.js'],
  
  // Extensions de fichiers à traiter
  moduleFileExtensions: ['js', 'json'],
  
  // Chemins de modules
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@models/(.*)$': '<rootDir>/models/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
    '^@middleware/(.*)$': '<rootDir>/middleware/$1',
    '^@validators/(.*)$': '<rootDir>/validators/$1'
  },
  
  // Options de verbosité
  verbose: true,
  
  // Nettoyage des mocks entre les tests
  clearMocks: true,
  
  // Restauration des mocks après chaque test
  restoreMocks: true,
  
  // Détection des fuites mémoire
  detectLeaks: true,
  
  // Détection des handles ouverts
  detectOpenHandles: true,
  
  // Force la fermeture des processus après les tests
  forceExit: true
};