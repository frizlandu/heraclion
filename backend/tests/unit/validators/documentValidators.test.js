const { validateData } = require('../../validators');
const { documents } = require('../../validators');

describe('Document Validators', () => {
  describe('createDocumentSchema', () => {
    it('should validate a valid document creation request', () => {
      const validData = {
        type_document: 'FACTURE',
        client_id: 1,
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
        notes: 'Test note'
      };

      expect(() => {
        validateData(documents.createDocumentSchema, validData);
      }).not.toThrow();
    });

    it('should reject document without required fields', () => {
      const invalidData = {
        type_document: 'FACTURE'
        // Missing client_id
      };

      expect(() => {
        validateData(documents.createDocumentSchema, invalidData);
      }).toThrow();
    });

    it('should reject invalid document type', () => {
      const invalidData = {
        type_document: 'INVALID_TYPE',
        client_id: 1
      };

      expect(() => {
        validateData(documents.createDocumentSchema, invalidData);
      }).toThrow();
    });

    it('should reject document with invalid items', () => {
      const invalidData = {
        type_document: 'FACTURE',
        client_id: 1,
        items: [
          {
            description: 'Service',
            quantite: -1, // Invalid negative quantity
            prix_unitaire: 100
          }
        ]
      };

      expect(() => {
        validateData(documents.createDocumentSchema, invalidData);
      }).toThrow();
    });

    it('should apply default values correctly', () => {
      const validData = {
        type_document: 'FACTURE',
        client_id: 1,
        items: [
          {
            description: 'Service',
            quantite: 1,
            prix_unitaire: 100
            // taux_tva should default to 20
          }
        ]
      };

      const result = validateData(documents.createDocumentSchema, validData);
      expect(result.items[0].taux_tva).toBe(20);
    });
  });

  describe('updateDocumentSchema', () => {
    it('should validate partial update data', () => {
      const validData = {
        notes: 'Updated note'
      };

      expect(() => {
        validateData(documents.updateDocumentSchema, validData);
      }).not.toThrow();
    });

    it('should reject empty update data', () => {
      const invalidData = {};

      expect(() => {
        validateData(documents.updateDocumentSchema, invalidData);
      }).toThrow();
    });
  });

  describe('searchDocumentsSchema', () => {
    it('should validate search parameters', () => {
      const validData = {
        type_document: 'FACTURE',
        statut: 'EMISE',
        date_debut: '2024-01-01',
        date_fin: '2024-12-31',
        limit: 50,
        offset: 0
      };

      expect(() => {
        validateData(documents.searchDocumentsSchema, validData);
      }).not.toThrow();
    });

    it('should apply default pagination values', () => {
      const validData = {
        type_document: 'FACTURE'
      };

      const result = validateData(documents.searchDocumentsSchema, validData);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    it('should reject invalid date range', () => {
      const invalidData = {
        date_debut: '2024-12-31',
        date_fin: '2024-01-01' // End date before start date
      };

      expect(() => {
        validateData(documents.searchDocumentsSchema, invalidData);
      }).toThrow();
    });
  });

  describe('validateDocumentSchema', () => {
    it('should validate document validation request', () => {
      const validData = {
        confirmer_validation: true,
        envoyer_email: false
      };

      expect(() => {
        validateData(documents.validateDocumentSchema, validData);
      }).not.toThrow();
    });
  });

  describe('convertDocumentSchema', () => {
    it('should validate document conversion request', () => {
      const validData = {
        nouveau_type: 'FACTURE',
        conserver_original: true,
        numero_personnalise: 'FAC-2024-001'
      };

      expect(() => {
        validateData(documents.convertDocumentSchema, validData);
      }).not.toThrow();
    });

    it('should reject invalid conversion type', () => {
      const invalidData = {
        nouveau_type: 'INVALID_TYPE'
      };

      expect(() => {
        validateData(documents.convertDocumentSchema, invalidData);
      }).toThrow();
    });
  });

  describe('duplicateDocumentSchema', () => {
    it('should validate document duplication request', () => {
      const validData = {
        nouveau_client_id: 2,
        nouvelle_date_emission: '2024-02-01',
        modifier_items: true
      };

      expect(() => {
        validateData(documents.duplicateDocumentSchema, validData);
      }).not.toThrow();
    });
  });

  describe('exportDocumentsSchema', () => {
    it('should validate export request', () => {
      const validData = {
        format: 'EXCEL',
        inclure_details: true,
        date_debut: '2024-01-01',
        date_fin: '2024-12-31'
      };

      expect(() => {
        validateData(documents.exportDocumentsSchema, validData);
      }).not.toThrow();
    });

    it('should apply default format', () => {
      const validData = {};

      const result = validateData(documents.exportDocumentsSchema, validData);
      expect(result.format).toBe('CSV');
    });
  });

  describe('relanceSchema', () => {
    it('should validate payment reminder request', () => {
      const validData = {
        type_relance: 'PREMIERE',
        message_personnalise: 'Veuillez régler votre facture',
        inclure_facture_pdf: true,
        envoyer_copie_comptable: false
      };

      expect(() => {
        validateData(documents.relanceSchema, validData);
      }).not.toThrow();
    });

    it('should reject invalid reminder type', () => {
      const invalidData = {
        type_relance: 'INVALID_TYPE'
      };

      expect(() => {
        validateData(documents.relanceSchema, invalidData);
      }).toThrow();
    });
  });
});