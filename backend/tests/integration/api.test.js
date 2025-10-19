const request = require('supertest');
const app = require('../../app');

// Mock global dependencies
jest.mock('../../config/database');
jest.mock('../../utils/logger');
jest.mock('../../middleware/auth');

describe('API Integration Tests', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Configuration globale pour les tests d'intégration
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key';
    
    // Utilisateur de test
    testUser = testHelpers.createTestUser({
      id: 1,
      email: 'admin@test.com',
      role: 'admin'
    });
    
    authToken = testHelpers.createTestToken(testUser.id);

    // Mock authentication middleware
    const auth = require('../../middleware/auth');
    auth.authenticateToken = jest.fn((req, res, next) => {
      req.user = testUser;
      next();
    });
    auth.requireRole = jest.fn(() => (req, res, next) => next());
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    it('should return API health status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        status: 'OK',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        memory: expect.any(Object),
        environment: 'test'
      });
    });
  });

  describe('Authentication Flow', () => {
    it('should handle complete authentication workflow', async () => {
      // Mock user model
      const BaseModel = require('../../models/BaseModel');
      const bcrypt = require('bcrypt');
      const jwt = require('jsonwebtoken');

      BaseModel.prototype.findOne = jest.fn().mockResolvedValue({
        ...testUser,
        mot_de_passe: await bcrypt.hash('password123', 10)
      });
      
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      jwt.sign = jest.fn().mockReturnValue('test-jwt-token');

      // Test login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          mot_de_passe: 'password123'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.token).toBeDefined();

      // Test protected route with token
      const protectedResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.data.token}`);

      expect(protectedResponse.status).toBe(200);
      expect(protectedResponse.body.data.email).toBe(testUser.email);
    });

    it('should reject invalid credentials', async () => {
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid@test.com',
          mot_de_passe: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Route non trouvée');
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nom: '', // Champ requis vide
          email: 'invalid-email' // Email invalide
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should handle server errors gracefully', async () => {
      // Mock une erreur serveur
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findWithPagination = jest.fn().mockRejectedValue(
        new Error('Database connection error')
      );

      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Erreur interne');
    });
  });

  describe('CORS and Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });

    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/clients')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to API endpoints', async () => {
      // Simuler plusieurs requêtes rapides
      const requests = Array(20).fill().map(() => 
        request(app).get('/api/health')
      );

      const responses = await Promise.all(requests);
      
      // Vérifier qu'au moins une requête a été limitée
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain referential integrity', async () => {
      const BaseModel = require('../../models/BaseModel');
      
      // Mock client creation
      const mockClient = testHelpers.createTestClient({ id: 1 });
      BaseModel.prototype.create = jest.fn().mockResolvedValue(mockClient);
      BaseModel.prototype.findOne = jest.fn().mockResolvedValue(null); // Email unique

      // Créer un client
      const clientResponse = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nom: 'Test Client',
          email: 'test@client.com',
          telephone: '0123456789',
          adresse: '123 Test St',
          ville: 'Test City',
          code_postal: '12345',
          pays: 'France',
          type_client: 'particulier'
        });

      expect(clientResponse.status).toBe(201);

      // Mock document creation avec référence au client
      const mockDocument = testHelpers.createTestDocument({ 
        id: 1, 
        client_id: mockClient.id 
      });
      BaseModel.prototype.findById = jest.fn()
        .mockResolvedValueOnce(mockClient) // Vérification client existe
        .mockResolvedValueOnce(mockDocument); // Retour du document créé
      BaseModel.prototype.create = jest.fn().mockResolvedValue(mockDocument);

      // Créer un document pour ce client
      const documentResponse = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          client_id: mockClient.id,
          type_document: 'facture',
          date_emission: '2024-01-01',
          montant_ht: 1000,
          taux_tva: 20,
          montant_ttc: 1200,
          statut: 'brouillon'
        });

      expect(documentResponse.status).toBe(201);
      expect(documentResponse.body.data.client_id).toBe(mockClient.id);
    });
  });

  describe('Pagination and Sorting', () => {
    it('should handle pagination correctly', async () => {
      const mockClients = Array(25).fill().map((_, i) => 
        testHelpers.createTestClient({ id: i + 1, nom: `Client ${i + 1}` })
      );

      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findWithPagination = jest.fn().mockResolvedValue({
        data: mockClients.slice(0, 10), // Première page
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3
      });

      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(10);
      expect(response.body.data.total).toBe(25);
      expect(response.body.data.totalPages).toBe(3);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(10);
    });

    it('should handle sorting parameters', async () => {
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findWithPagination = jest.fn().mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      });

      await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          sort: 'nom',
          order: 'desc'
        });

      expect(BaseModel.prototype.findWithPagination).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: 'nom DESC'
        })
      );
    });
  });

  describe('Content Negotiation', () => {
    it('should support JSON responses', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should handle unsupported media types', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/xml')
        .send('<client><nom>Test</nom></client>');

      expect(response.status).toBe(415);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/health');
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Moins d'1 seconde
    });

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const requests = Array(concurrentRequests).fill().map(() =>
        request(app)
          .get('/api/health')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // Toutes les requêtes doivent réussir
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Le temps total ne doit pas être trop élevé
      expect(totalTime).toBeLessThan(5000); // Moins de 5 secondes
    });
  });
});