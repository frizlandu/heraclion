const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock des dépendances
jest.mock('../../models/BaseModel');
jest.mock('../../services/emailService');
jest.mock('../../utils/logger');

describe('Document Routes Integration Tests', () => {
  let app;
  let authToken;
  let testUser;
  let testClient;
  let testEntreprise;
  
  beforeAll(() => {
    // Configuration de l'app Express pour les tests
    app = express();
    app.use(express.json());
    
    // Mock des middlewares
    app.use((req, res, next) => {
      if (req.headers.authorization) {
        const token = req.headers.authorization.replace('Bearer ', '');
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          req.user = decoded;
        } catch (error) {
          return res.status(401).json({ success: false, message: 'Token invalide' });
        }
      }
      next();
    });
    
    // Routes de test
    const documentRoutes = require('../../routes/documents');
    app.use('/api/documents', documentRoutes);
    
    // Données de test
    testUser = testHelpers.createTestUser({ role: 'ADMIN' });
    testClient = testHelpers.createTestClient();
    testEntreprise = testHelpers.createTestEntreprise();
    authToken = testHelpers.createTestToken(testUser.id, testUser.role);
  });

  describe('GET /api/documents', () => {
    it('should return paginated list of documents', async () => {
      const mockDocuments = [
        testHelpers.createTestDocument({ id: 1 }),
        testHelpers.createTestDocument({ id: 2 })
      ];
      
      // Mock de la méthode findAll du modèle
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findAll = jest.fn().mockResolvedValue({
        data: mockDocuments,
        total: 2
      });

      const response = await request(app)
        .get('/api/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          limit: 10,
          offset: 0,
          type_document: 'FACTURE'
        });

      expect(response.status).toBe(200);
      expect(response.body).toBeValidApiResponse();
      expect(response.body.success).toBe(true);
      expect(response.body.data.documents).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/documents');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          limit: 'invalid', // Should be a number
          type_document: 'INVALID_TYPE'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/documents', () => {
    it('should create a new document', async () => {
      const newDocument = {
        type_document: 'FACTURE',
        client_id: testClient.id,
        date_emission: '2024-01-15',
        date_echeance: '2024-02-15',
        items: [
          {
            description: 'Service de transport',
            quantite: 1,
            prix_unitaire: 1000.00,
            taux_tva: 20
          }
        ],
        notes: 'Document de test'
      };

      const mockCreatedDocument = testHelpers.createTestDocument({
        ...newDocument,
        id: 123,
        numero: 'FAC-2024-123'
      });

      // Mock de la méthode create du modèle
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.create = jest.fn().mockResolvedValue(mockCreatedDocument);

      const response = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newDocument);

      expect(response.status).toBe(201);
      expect(response.body).toBeValidApiResponse();
      expect(response.body.success).toBe(true);
      expect(response.body.data.numero).toBe('FAC-2024-123');
      expect(response.body.data.type_document).toBe('FACTURE');
    });

    it('should validate document data', async () => {
      const invalidDocument = {
        type_document: 'INVALID_TYPE',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDocument);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should calculate document totals automatically', async () => {
      const newDocument = {
        type_document: 'FACTURE',
        client_id: testClient.id,
        items: [
          {
            description: 'Service 1',
            quantite: 2,
            prix_unitaire: 500.00,
            taux_tva: 20
          },
          {
            description: 'Service 2',
            quantite: 1,
            prix_unitaire: 300.00,
            taux_tva: 10
          }
        ]
      };

      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.create = jest.fn().mockImplementation((data) => {
        // Simulate automatic calculation
        const calculatedData = {
          ...data,
          id: 124,
          numero: 'FAC-2024-124',
          sous_total: 1300.00, // (2*500) + (1*300)
          montant_tva: 230.00, // (1000*0.20) + (300*0.10)
          total_ttc: 1530.00   // 1300 + 230
        };
        return Promise.resolve(calculatedData);
      });

      const response = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newDocument);

      expect(response.status).toBe(201);
      expect(response.body.data.sous_total).toBe(1300.00);
      expect(response.body.data.montant_tva).toBe(230.00);
      expect(response.body.data.total_ttc).toBe(1530.00);
    });
  });

  describe('GET /api/documents/:id', () => {
    it('should return document by ID', async () => {
      const mockDocument = testHelpers.createTestDocument({ id: 1 });
      
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(mockDocument);

      const response = await request(app)
        .get('/api/documents/1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeValidApiResponse();
      expect(response.body.data.id).toBe(1);
    });

    it('should return 404 for non-existent document', async () => {
      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/api/documents/999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/documents/:id', () => {
    it('should update document if status is BROUILLON', async () => {
      const existingDocument = testHelpers.createTestDocument({
        id: 1,
        statut: 'BROUILLON'
      });
      
      const updateData = {
        notes: 'Updated notes',
        items: [
          {
            description: 'Updated service',
            quantite: 1,
            prix_unitaire: 1500.00,
            taux_tva: 20
          }
        ]
      };

      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(existingDocument);
      BaseModel.prototype.update = jest.fn().mockResolvedValue({
        ...existingDocument,
        ...updateData
      });

      const response = await request(app)
        .put('/api/documents/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.notes).toBe('Updated notes');
    });

    it('should reject update if document is not BROUILLON', async () => {
      const existingDocument = testHelpers.createTestDocument({
        id: 1,
        statut: 'EMISE' // Not editable
      });

      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(existingDocument);

      const response = await request(app)
        .put('/api/documents/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Updated notes' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('brouillon');
    });
  });

  describe('POST /api/documents/:id/validate', () => {
    it('should validate document and change status to EMISE', async () => {
      const existingDocument = testHelpers.createTestDocument({
        id: 1,
        statut: 'BROUILLON'
      });

      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(existingDocument);
      BaseModel.prototype.update = jest.fn().mockResolvedValue({
        ...existingDocument,
        statut: 'EMISE'
      });

      const response = await request(app)
        .post('/api/documents/1/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ confirmer_validation: true });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.statut).toBe('EMISE');
    });

    it('should reject validation if document already validated', async () => {
      const existingDocument = testHelpers.createTestDocument({
        id: 1,
        statut: 'EMISE' // Already validated
      });

      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(existingDocument);

      const response = await request(app)
        .post('/api/documents/1/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ confirmer_validation: true });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/documents/:id', () => {
    it('should delete document if status is BROUILLON', async () => {
      const existingDocument = testHelpers.createTestDocument({
        id: 1,
        statut: 'BROUILLON'
      });

      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(existingDocument);
      BaseModel.prototype.delete = jest.fn().mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/documents/1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject deletion if document is not BROUILLON', async () => {
      const existingDocument = testHelpers.createTestDocument({
        id: 1,
        statut: 'EMISE'
      });

      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(existingDocument);

      const response = await request(app)
        .delete('/api/documents/1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/documents/:id/pdf', () => {
    it('should generate and return PDF', async () => {
      const existingDocument = testHelpers.createTestDocument({ id: 1 });
      const mockPdfBuffer = Buffer.from('fake-pdf-content');

      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(existingDocument);
      
      // Mock PDF generation service
      jest.doMock('../../services/exportService', () => ({
        generateDocumentPdf: jest.fn().mockResolvedValue(mockPdfBuffer)
      }));

      const response = await request(app)
        .get('/api/documents/1/pdf')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
    });
  });

  describe('POST /api/documents/:id/send', () => {
    it('should send document by email', async () => {
      const existingDocument = testHelpers.createTestDocument({ 
        id: 1,
        client_id: testClient.id
      });

      const BaseModel = require('../../models/BaseModel');
      BaseModel.prototype.findById = jest.fn().mockResolvedValue(existingDocument);
      
      // Mock du service email
      const emailService = require('../../services/emailService');
      emailService.sendDocumentEmail = jest.fn().mockResolvedValue({
        success: true,
        messageId: 'test-123'
      });

      const response = await request(app)
        .post('/api/documents/1/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'client@example.com',
          message_personnalise: 'Voici votre facture'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(emailService.sendDocumentEmail).toHaveBeenCalled();
    });
  });
});

afterAll(async () => {
  if (global.server && typeof global.server.close === 'function') {
    await new Promise((resolve) => global.server.close(resolve));
  }
});


beforeEach(() => {
  const testUser = testHelpers.createTestUser({ role: 'ADMIN' });
  const testClient = testHelpers.createTestClient();
  const testEntreprise = testHelpers.createTestEntreprise();
  const authToken = testHelpers.createTestToken(testUser.id, testUser.role);
});
