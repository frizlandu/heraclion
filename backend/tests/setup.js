/**
 * Configuration globale pour tous les tests Jest
 */

const { v4: uuidv4 } = require('uuid');

// Configuration globale avant tous les tests
beforeAll(async () => {
  // Génération d'un ID unique pour cette session de test
  global.testSessionId = uuidv4();
  
  // Configuration du timeout global
  jest.setTimeout(10000);
  
  // Mock des services externes par défaut
  mockExternalServices();
  
  console.log(`Starting test session: ${global.testSessionId}`);
});

// Nettoyage après tous les tests
afterAll(async () => {
  // Nettoyage des ressources
  await cleanupTestResources();
  
  console.log(`Test session completed: ${global.testSessionId}`);
});

// Nettoyage entre chaque test
beforeEach(() => {
  // Reset des mocks
  jest.clearAllMocks();
  
  // Reset des timers si utilisés
  jest.clearAllTimers();
  
  // Génération d'un ID unique pour chaque test
  global.currentTestId = uuidv4();
});

afterEach(() => {
  // Nettoyage spécifique après chaque test si nécessaire
});

/**
 * Mock des services externes
 */
function mockExternalServices() {
  // Mock du service email
  jest.mock('../services/emailService', () => ({
    sendEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'test-123' }),
    sendRelance: jest.fn().mockResolvedValue({ success: true }),
    sendEcheanceReminder: jest.fn().mockResolvedValue({ success: true }),
    sendPeriodicReport: jest.fn().mockResolvedValue({ success: true })
  }));
  
  // Mock du service de notification
  jest.mock('../services/notificationService', () => ({
    createNotification: jest.fn().mockResolvedValue({ id: 1 }),
    sendSystemAlert: jest.fn().mockResolvedValue({ success: true }),
    markAsRead: jest.fn().mockResolvedValue({ success: true })
  }));
  
  // Mock des jobs
  jest.mock('../jobs/scheduler', () => ({
    start: jest.fn(),
    stop: jest.fn(),
    runJobManually: jest.fn().mockResolvedValue({ success: true }),
    getJobsStatus: jest.fn().mockReturnValue({ running: false, jobs: [] })
  }));
}

/**
 * Nettoyage des ressources de test
 */
async function cleanupTestResources() {
  // Fermeture des connexions base de données si ouvertes
  if (global.testDbConnection) {
    await global.testDbConnection.close();
  }
  
  // Nettoyage des fichiers temporaires créés pendant les tests
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    const tempDir = path.join(__dirname, '../temp/test');
    const files = await fs.readdir(tempDir);
    
    for (const file of files) {
      if (file.startsWith('test-')) {
        await fs.unlink(path.join(tempDir, file));
      }
    }
  } catch (error) {
    // Ignore les erreurs de nettoyage
  }
}

/**
 * Utilitaires globaux pour les tests
 */

// Générateur de données de test
global.testHelpers = {
  // Génère un utilisateur de test
  createTestUser: (overrides = {}) => ({
    id: Math.floor(Math.random() * 1000),
    nom: 'Test',
    prenom: 'User',
    email: `test-${uuidv4()}@example.com`,
    role: 'UTILISATEUR',
    entreprises_ids: [1],
    entreprise_principale_id: 1,
    actif: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  }),
  
  // Génère un client de test
  createTestClient: (overrides = {}) => ({
    id: Math.floor(Math.random() * 1000),
    nom: `Client Test ${uuidv4().substr(0, 8)}`,
    contact_principal: 'Contact Test',
    email: `client-${uuidv4()}@example.com`,
    telephone: '01 23 45 67 89',
    adresse: '123 Rue de Test',
    code_postal: '75001',
    ville: 'Paris',
    pays: 'France',
    entreprise_id: 1,
    actif: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  }),
  
  // Génère une entreprise de test
  createTestEntreprise: (overrides = {}) => ({
    id: Math.floor(Math.random() * 1000),
    nom: `Entreprise Test ${uuidv4().substr(0, 8)}`,
    prefix_facture: 'TEST',
    type_entreprise: 'TRANSPORT',
    telephone: '01 98 76 54 32',
    adresse: '456 Avenue Test',
    actif: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  }),
  
  // Génère un document de test
  createTestDocument: (overrides = {}) => ({
    id: Math.floor(Math.random() * 1000),
    numero: `TEST-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    type_document: 'FACTURE',
    client_id: 1,
    entreprise_id: 1,
    date_emission: new Date(),
    date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    statut: 'BROUILLON',
    sous_total: 1000.00,
    montant_tva: 200.00,
    total_ttc: 1200.00,
    items: [{
      id: 1,
      description: 'Service de test',
      quantite: 1,
      prix_unitaire: 1000.00,
      taux_tva: 20,
      montant_ht: 1000.00,
      montant_tva: 200.00,
      montant_ttc: 1200.00
    }],
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  }),
  
  // Génère un token JWT de test
  createTestToken: (userId = 1, role = 'UTILISATEUR') => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { 
        userId, 
        role, 
        entreprises: [1],
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  },
  
  // Simule une requête Express
  mockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...overrides
  }),
  
  // Simule une réponse Express
  mockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
  },
  
  // Utilitaire pour attendre un délai
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Validation des schémas Joi
  validateSchema: (schema, data) => {
    const { error, value } = schema.validate(data);
    return { error, value };
  }
};

// Matchers Jest personnalisés
expect.extend({
  // Matcher pour vérifier qu'un objet a une structure de réponse API valide
  toBeValidApiResponse(received) {
    const pass = received && 
      typeof received === 'object' && 
      'success' in received && 
      typeof received.success === 'boolean';
    
    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid API response`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid API response with 'success' boolean property`,
        pass: false,
      };
    }
  },
  
  // Matcher pour vérifier qu'une date est récente
  toBeRecentDate(received, withinMs = 5000) {
    const now = new Date();
    const receivedDate = new Date(received);
    const diff = Math.abs(now - receivedDate);
    
    const pass = diff <= withinMs;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be within ${withinMs}ms of now`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within ${withinMs}ms of now (difference: ${diff}ms)`,
        pass: false,
      };
    }
  }
});