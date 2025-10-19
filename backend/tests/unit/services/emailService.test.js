const emailService = require('../../services/emailService');
const logger = require('../../utils/logger');
const nodemailer = require('nodemailer');

// Mock nodemailer
jest.mock('nodemailer');
jest.mock('../../utils/logger');

describe('Email Service', () => {
  let mockTransporter;
  
  beforeEach(() => {
    mockTransporter = {
      sendMail: jest.fn(),
      verify: jest.fn()
    };
    
    nodemailer.createTransporter = jest.fn().mockReturnValue(mockTransporter);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const mockResponse = {
        messageId: 'test-message-id',
        accepted: ['test@example.com'],
        rejected: []
      };
      
      mockTransporter.sendMail.mockResolvedValue(mockResponse);

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>'
      };

      const result = await emailService.sendEmail(emailData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Test Subject',
          html: '<p>Test content</p>'
        })
      );
    });

    it('should handle email sending failure', async () => {
      const error = new Error('SMTP connection failed');
      mockTransporter.sendMail.mockRejectedValue(error);

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>'
      };

      const result = await emailService.sendEmail(emailData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('SMTP connection failed');
      expect(logger.error).toHaveBeenCalledWith('Email sending failed:', error);
    });

    it('should validate required email fields', async () => {
      const invalidEmailData = {
        // Missing 'to' field
        subject: 'Test Subject',
        html: '<p>Test content</p>'
      };

      await expect(emailService.sendEmail(invalidEmailData)).rejects.toThrow();
    });
  });

  describe('sendDocumentEmail', () => {
    it('should send document email with PDF attachment', async () => {
      const mockResponse = {
        messageId: 'doc-message-id',
        accepted: ['client@example.com'],
        rejected: []
      };
      
      mockTransporter.sendMail.mockResolvedValue(mockResponse);

      const client = testHelpers.createTestClient({
        email: 'client@example.com'
      });
      
      const document = testHelpers.createTestDocument({
        numero: 'FAC-2024-001',
        type_document: 'FACTURE'
      });
      
      const entreprise = testHelpers.createTestEntreprise({
        nom: 'Test Company'
      });

      const result = await emailService.sendDocumentEmail({
        client,
        document,
        entreprise,
        pdfBuffer: Buffer.from('fake-pdf-content'),
        template: 'facture'
      });

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'client@example.com',
          subject: expect.stringContaining('FAC-2024-001'),
          attachments: expect.arrayContaining([
            expect.objectContaining({
              filename: expect.stringContaining('FAC-2024-001.pdf'),
              content: expect.any(Buffer)
            })
          ])
        })
      );
    });

    it('should handle missing client email', async () => {
      const client = testHelpers.createTestClient({
        email: null
      });
      
      const document = testHelpers.createTestDocument();
      const entreprise = testHelpers.createTestEntreprise();

      await expect(emailService.sendDocumentEmail({
        client,
        document,
        entreprise,
        pdfBuffer: Buffer.from('test')
      })).rejects.toThrow('Client email is required');
    });
  });

  describe('sendRelance', () => {
    it('should send payment reminder email', async () => {
      const mockResponse = {
        messageId: 'relance-message-id',
        accepted: ['client@example.com'],
        rejected: []
      };
      
      mockTransporter.sendMail.mockResolvedValue(mockResponse);

      const client = testHelpers.createTestClient({
        email: 'client@example.com'
      });
      
      const facture = testHelpers.createTestDocument({
        type_document: 'FACTURE',
        numero: 'FAC-2024-001',
        total_ttc: 1200.00,
        date_echeance: new Date('2024-01-15')
      });
      
      const entreprise = testHelpers.createTestEntreprise();

      const result = await emailService.sendRelance({
        client,
        facture,
        entreprise,
        type_relance: 'PREMIERE'
      });

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'client@example.com',
          subject: expect.stringContaining('Relance'),
          html: expect.stringContaining('FAC-2024-001')
        })
      );
    });

    it('should customize reminder message based on type', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test' });

      const client = testHelpers.createTestClient();
      const facture = testHelpers.createTestDocument();
      const entreprise = testHelpers.createTestEntreprise();

      // Test different reminder types
      const reminderTypes = ['PREMIERE', 'DEUXIEME', 'MISE_EN_DEMEURE'];
      
      for (const type of reminderTypes) {
        await emailService.sendRelance({
          client,
          facture,
          entreprise,
          type_relance: type
        });
        
        const lastCall = mockTransporter.sendMail.mock.calls[mockTransporter.sendMail.mock.calls.length - 1];
        const emailContent = lastCall[0];
        
        expect(emailContent.subject).toContain(
          type === 'MISE_EN_DEMEURE' ? 'Mise en demeure' : 'Relance'
        );
      }
    });
  });

  describe('sendEcheanceReminder', () => {
    it('should send due date reminder email', async () => {
      const mockResponse = {
        messageId: 'echeance-message-id',
        accepted: ['client@example.com'],
        rejected: []
      };
      
      mockTransporter.sendMail.mockResolvedValue(mockResponse);

      const client = testHelpers.createTestClient();
      const facture = testHelpers.createTestDocument({
        date_echeance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      });
      const entreprise = testHelpers.createTestEntreprise();

      const result = await emailService.sendEcheanceReminder({
        client,
        facture,
        entreprise
      });

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: client.email,
          subject: expect.stringContaining('échéance'),
          html: expect.stringContaining(facture.numero)
        })
      );
    });
  });

  describe('sendPeriodicReport', () => {
    it('should send periodic report email', async () => {
      const mockResponse = {
        messageId: 'report-message-id',
        accepted: ['admin@company.com'],
        rejected: []
      };
      
      mockTransporter.sendMail.mockResolvedValue(mockResponse);

      const reportData = {
        filename: 'rapport-mensuel-janvier-2024.xlsx',
        buffer: Buffer.from('fake-excel-content'),
        type: 'VENTES_MENSUELLES',
        period: 'janvier 2024'
      };

      const result = await emailService.sendPeriodicReport({
        report: reportData,
        type: 'COMPTABILITE_MENSUELLE',
        period: '1_month',
        recipients: ['admin@company.com']
      });

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@company.com',
          subject: expect.stringContaining('Rapport'),
          attachments: expect.arrayContaining([
            expect.objectContaining({
              filename: reportData.filename,
              content: reportData.buffer
            })
          ])
        })
      );
    });
  });

  describe('validateEmailConfiguration', () => {
    it('should validate email server configuration', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const result = await emailService.validateEmailConfiguration();

      expect(result.valid).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should handle invalid email configuration', async () => {
      const error = new Error('Invalid credentials');
      mockTransporter.verify.mockRejectedValue(error);

      const result = await emailService.validateEmailConfiguration();

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });
  });

  describe('generateEmailTemplate', () => {
    it('should generate email template with variables', () => {
      const template = 'facture';
      const variables = {
        client_nom: 'SARL Durand',
        facture_numero: 'FAC-2024-001',
        facture_total: '1200.00€',
        entreprise_nom: 'Transport Express'
      };

      const result = emailService.generateEmailTemplate(template, variables);

      expect(result.subject).toContain('FAC-2024-001');
      expect(result.html).toContain('SARL Durand');
      expect(result.html).toContain('1200.00€');
      expect(result.text).toBeDefined();
    });

    it('should throw error for unknown template', () => {
      expect(() => {
        emailService.generateEmailTemplate('unknown_template', {});
      }).toThrow('Template unknown_template not found');
    });
  });
});