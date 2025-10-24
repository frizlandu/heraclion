const request = require('supertest');
const express = require('express');
const clientRoutes = require('../../routes/clients');

// Mock des dépendances
jest.mock('../../models/BaseModel');
jest.mock('../../middleware/auth');
jest.mock('../../utils/logger');

describe('Client Routes Integration Tests', () => {
  let app;
  let mockClient;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Mock du middleware d'authentification
    const auth = require('../../middleware/auth');
    auth.authenticateToken = jest.fn((req, res, next) => {
      req.user = { id: 1, role: 'admin' };
      next();
    });
    
    app.use('/api/clients', clientRoutes);

    mockClient = testHelpers.createTestClient({
      id: 1,
      nom: 'Client Test',
      email: 'client@test.com',
      telephone: '0123456789',
      adresse: '123 Rue Test',
      ville: 'Test City',
      code_postal: '12345',
      pays: 'France',
      type_client: 'particulier',
      actif: true
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/clients', () => {
    it('should return paginated list of clients', async () => {
      const mockClients = [mockClient, { ...mockClient, id: 2, nom: 'Client 2' }];
      
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findWithPagination = jest.fn().mockResolvedValue({
        data: mockClients,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      });

      const response = await request(app)
        .get('/api/clients')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toBeValidApiResponse();
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.page).toBe(1);
    });

    it('should filter clients by search term', async () => {
      const filteredClients = [mockClient];
      
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findWithPagination = jest.fn().mockResolvedValue({
        data: filteredClients,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      });

      const response = await request(app)
        .get('/api/clients')
        .query({ search: 'Client Test' });

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(1);
      expect(BaseModel.prototype.findWithPagination).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.stringContaining('nom ILIKE')
        })
      );
    });

    it('should filter clients by type', async () => {
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findWithPagination = jest.fn().mockResolvedValue({
        data: [mockClient],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      });

      const response = await request(app)
        .get('/api/clients')
        .query({ type_client: 'particulier' });

      expect(response.status).toBe(200);
      expect(BaseModel.prototype.findWithPagination).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.stringContaining('type_client = $')
        })
      );
    });

    it('should sort clients by specified field', async () => {
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findWithPagination = jest.fn().mockResolvedValue({
        data: [mockClient],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      });

      const response = await request(app)
        .get('/api/clients')
        .query({ sort: 'nom', order: 'desc' });

      expect(response.status).toBe(200);
      expect(BaseModel.prototype.findWithPagination).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: 'nom DESC'
        })
      );
    });

    it('should require authentication', async () => {
      const auth = require('../../middleware/auth');
      auth.authenticateToken = jest.fn((req, res, next) => {
        res.status(401).json({ success: false, message: 'Non autorisé' });
      });

      const response = await request(app)
        .get('/api/clients');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/clients/:id', () => {
    it('should return specific client by id', async () => {
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(mockClient);

      const response = await request(app)
        .get('/api/clients/1');

      expect(response.status).toBe(200);
      expect(response.body).toBeValidApiResponse();
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.nom).toBe('Client Test');
    });

    it('should return 404 for non-existent client', async () => {
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/api/clients/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Client non trouvé');
    });

    it('should validate id parameter', async () => {
      const response = await request(app)
        .get('/api/clients/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/clients', () => {
    const validClientData = {
      nom: 'Nouveau Client',
      email: 'nouveau@client.com',
      telephone: '0987654321',
      adresse: '456 Rue Nouvelle',
      ville: 'Nouvelle Ville',
      code_postal: '54321',
      pays: 'France',
      type_client: 'entreprise'
    };

    it('should create new client with valid data', async () => {
      const newClient = { id: 2, ...validClientData };
      
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.create = jest.fn().mockResolvedValue(newClient);
      BaseModel.prototype.findOne = jest.fn().mockResolvedValue(null); // Email unique

      const response = await request(app)
        .post('/api/clients')
        .send(validClientData);

      expect(response.status).toBe(201);
      expect(response.body).toBeValidApiResponse();
      expect(response.body.data.nom).toBe(validClientData.nom);
      expect(response.body.data.email).toBe(validClientData.email);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/clients')
        .send({
          nom: 'Test'
          // Champs requis manquants
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/clients')
        .send({
          ...validClientData,
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain(expect.stringContaining('email'));
    });

    it('should validate client type', async () => {
      const response = await request(app)
        .post('/api/clients')
        .send({
          ...validClientData,
          type_client: 'invalid-type'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain(expect.stringContaining('type_client'));
    });

    it('should check email uniqueness', async () => {
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findOne = jest.fn().mockResolvedValue(mockClient); // Email existe

      const response = await request(app)
        .post('/api/clients')
        .send({
          ...validClientData,
          email: 'client@test.com' // Email existant
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email déjà utilisé');
    });

    it('should validate phone number format', async () => {
      const response = await request(app)
        .post('/api/clients')
        .send({
          ...validClientData,
          telephone: '123' // Trop court
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain(expect.stringContaining('telephone'));
    });
  });

  describe('PUT /api/clients/:id', () => {
    const updateData = {
      nom: 'Client Modifié',
      email: 'modifie@client.com',
      telephone: '0111111111'
    };

    it('should update existing client', async () => {
      const updatedClient = { ...mockClient, ...updateData };
      
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(mockClient);
      BaseModel.prototype.update = jest.fn().mockResolvedValue(updatedClient);
      BaseModel.prototype.findOne = jest.fn().mockResolvedValue(null); // Email unique

      const response = await request(app)
        .put('/api/clients/1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toBeValidApiResponse();
      expect(response.body.data.nom).toBe(updateData.nom);
      expect(response.body.data.email).toBe(updateData.email);
    });

    it('should return 404 for non-existent client', async () => {
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .put('/api/clients/999')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should validate email uniqueness when updating', async () => {
      const otherClient = { ...mockClient, id: 2, email: 'autre@client.com' };
      
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(mockClient);
      BaseModel.prototype.findOne = jest.fn().mockResolvedValue(otherClient); // Email appartient à un autre client

      const response = await request(app)
        .put('/api/clients/1')
        .send({
          ...updateData,
          email: 'autre@client.com'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email déjà utilisé');
    });

    it('should allow same email for same client', async () => {
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(mockClient);
      BaseModel.prototype.findOne = jest.fn().mockResolvedValue(mockClient); // Même client
      BaseModel.prototype.update = jest.fn().mockResolvedValue(mockClient);

      const response = await request(app)
        .put('/api/clients/1')
        .send({
          ...updateData,
          email: mockClient.email // Même email
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/clients/:id', () => {
    it('should soft delete client', async () => {
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(mockClient);
      BaseModel.prototype.update = jest.fn().mockResolvedValue({
        ...mockClient,
        actif: false,
        date_suppression: new Date()
      });

      const response = await request(app)
        .delete('/api/clients/1');

      expect(response.status).toBe(200);
      expect(response.body).toBeValidApiResponse();
      expect(response.body.message).toContain('Client supprimé');
      expect(BaseModel.prototype.update).toHaveBeenCalledWith(1, {
        actif: false,
        date_suppression: expect.any(Date)
      });
    });

    it('should return 404 for non-existent client', async () => {
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/clients/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should check for existing documents before deletion', async () => {
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(mockClient);
      
      // Mock pour vérifier les documents liés
      const documentCheck = jest.fn().mockResolvedValue([{ id: 1 }]); // Documents existants
      BaseModel.prototype.findAll = documentCheck;

      const response = await request(app)
        .delete('/api/clients/1');

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('documents associés');
    });
  });

  describe('GET /api/clients/:id/documents', () => {
    it('should return client documents', async () => {
      const mockDocuments = [
        testHelpers.createTestDocument({ id: 1, client_id: 1 }),
        testHelpers.createTestDocument({ id: 2, client_id: 1 })
      ];

      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(mockClient);
      BaseModel.prototype.findAll = jest.fn().mockResolvedValue(mockDocuments);

      const response = await request(app)
        .get('/api/clients/1/documents');

      expect(response.status).toBe(200);
      expect(response.body).toBeValidApiResponse();
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].client_id).toBe(1);
    });

    it('should filter documents by type', async () => {
      const mockDocuments = [testHelpers.createTestDocument({ type_document: 'facture' })];

      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(mockClient);
      BaseModel.prototype.findAll = jest.fn().mockResolvedValue(mockDocuments);

      const response = await request(app)
        .get('/api/clients/1/documents')
        .query({ type: 'facture' });

      expect(response.status).toBe(200);
      expect(BaseModel.prototype.findAll).toHaveBeenCalledWith(
        expect.stringContaining('type_document = $')
      );
    });

    it('should return 404 for non-existent client', async () => {
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/api/clients/999/documents');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/clients/:id/stats', () => {
    it('should return client statistics', async () => {
      const mockStats = {
        total_documents: 15,
        total_factures: 8,
        total_devis: 7,
        montant_total_factures: 15000.00,
        montant_total_devis: 8500.50,
        factures_en_attente: 2,
        derniere_facture: '2024-01-15'
      };

      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(mockClient);
      
      // Mock des requêtes de statistiques
      BaseModel.prototype.query = jest.fn()
        .mockResolvedValueOnce([{ count: '15' }]) // total_documents
        .mockResolvedValueOnce([{ count: '8', total: '15000.00' }]) // factures
        .mockResolvedValueOnce([{ count: '7', total: '8500.50' }]) // devis
        .mockResolvedValueOnce([{ count: '2' }]) // factures en attente
        .mockResolvedValueOnce([{ date_creation: '2024-01-15' }]); // dernière facture

      const response = await request(app)
        .get('/api/clients/1/stats');

      expect(response.status).toBe(200);
      expect(response.body).toBeValidApiResponse();
      expect(response.body.data.total_documents).toBe(15);
      expect(response.body.data.montant_total_factures).toBe(15000.00);
    });

    it('should handle client with no documents', async () => {
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(mockClient);
      BaseModel.prototype.query = jest.fn()
        .mockResolvedValue([{ count: '0', total: null }]);

      const response = await request(app)
        .get('/api/clients/1/stats');

      expect(response.status).toBe(200);
      expect(response.body.data.total_documents).toBe(0);
      expect(response.body.data.montant_total_factures).toBe(0);
    });
  });

  describe('PUT /api/clients/:id/activate', () => {
    it('should activate inactive client', async () => {
      const inactiveClient = { ...mockClient, actif: false };
      const activatedClient = { ...inactiveClient, actif: true };

      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(inactiveClient);
      BaseModel.prototype.update = jest.fn().mockResolvedValue(activatedClient);

      const response = await request(app)
        .put('/api/clients/1/activate');

      expect(response.status).toBe(200);
      expect(response.body).toBeValidApiResponse();
      expect(response.body.data.actif).toBe(true);
      expect(response.body.message).toContain('Client activé');
    });

    it('should handle already active client', async () => {
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(mockClient); // Déjà actif

      const response = await request(app)
        .put('/api/clients/1/activate');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('déjà actif');
    });
  });
});

afterAll(async () => {
  if (global.server && typeof global.server.close === 'function') {
    await new Promise((resolve) => global.server.close(resolve));
  }
});
