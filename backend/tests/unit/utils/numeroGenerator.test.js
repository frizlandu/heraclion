const numeroGenerator = require('../../utils/numeroGenerator');

describe('Numero Generator Utility', () => {
  beforeEach(() => {
    // Reset any internal state
    jest.clearAllMocks();
  });

  describe('generateDocumentNumber', () => {
    it('should generate document number with correct format', () => {
      const params = {
        type: 'FACTURE',
        entreprise_id: 1,
        prefix: 'FAC',
        year: 2024,
        counter: 1
      };

      const numero = numeroGenerator.generateDocumentNumber(params);
      
      expect(numero).toBe('FAC-2024-001');
      expect(typeof numero).toBe('string');
    });

    it('should pad counter with zeros', () => {
      const params = {
        type: 'PROFORMA',
        entreprise_id: 1,
        prefix: 'PRO',
        year: 2024,
        counter: 42
      };

      const numero = numeroGenerator.generateDocumentNumber(params);
      
      expect(numero).toBe('PRO-2024-042');
    });

    it('should handle large counter numbers', () => {
      const params = {
        type: 'FACTURE',
        entreprise_id: 1,
        prefix: 'FAC',
        year: 2024,
        counter: 9999
      };

      const numero = numeroGenerator.generateDocumentNumber(params);
      
      expect(numero).toBe('FAC-2024-9999');
    });

    it('should throw error for invalid parameters', () => {
      expect(() => {
        numeroGenerator.generateDocumentNumber({});
      }).toThrow();

      expect(() => {
        numeroGenerator.generateDocumentNumber({
          type: 'FACTURE',
          // Missing required fields
        });
      }).toThrow();
    });

    it('should handle different document types', () => {
      const types = [
        { type: 'FACTURE', prefix: 'FAC' },
        { type: 'PROFORMA', prefix: 'PRO' },
        { type: 'DEVIS', prefix: 'DEV' }
      ];

      types.forEach(({ type, prefix }) => {
        const params = {
          type,
          entreprise_id: 1,
          prefix,
          year: 2024,
          counter: 1
        };

        const numero = numeroGenerator.generateDocumentNumber(params);
        expect(numero).toBe(`${prefix}-2024-001`);
      });
    });
  });

  describe('parseDocumentNumber', () => {
    it('should parse valid document number', () => {
      const numero = 'FAC-2024-001';
      const parsed = numeroGenerator.parseDocumentNumber(numero);

      expect(parsed).toEqual({
        prefix: 'FAC',
        year: 2024,
        counter: 1,
        original: 'FAC-2024-001'
      });
    });

    it('should handle different formats', () => {
      const testCases = [
        { input: 'PRO-2023-042', expected: { prefix: 'PRO', year: 2023, counter: 42 } },
        { input: 'TRANSPORT-2024-9999', expected: { prefix: 'TRANSPORT', year: 2024, counter: 9999 } }
      ];

      testCases.forEach(({ input, expected }) => {
        const parsed = numeroGenerator.parseDocumentNumber(input);
        expect(parsed.prefix).toBe(expected.prefix);
        expect(parsed.year).toBe(expected.year);
        expect(parsed.counter).toBe(expected.counter);
      });
    });

    it('should throw error for invalid format', () => {
      const invalidNumbers = [
        'INVALID',
        'FAC-2024',
        '2024-001',
        'FAC-INVALID-001',
        ''
      ];

      invalidNumbers.forEach(numero => {
        expect(() => {
          numeroGenerator.parseDocumentNumber(numero);
        }).toThrow();
      });
    });
  });

  describe('getNextNumber', () => {
    it('should calculate next counter value', async () => {
      // Mock database call
      const mockGetLastCounter = jest.fn().mockResolvedValue(42);
      numeroGenerator.getLastCounter = mockGetLastCounter;

      const params = {
        type: 'FACTURE',
        entreprise_id: 1,
        year: 2024
      };

      const nextCounter = await numeroGenerator.getNextNumber(params);
      
      expect(nextCounter).toBe(43);
      expect(mockGetLastCounter).toHaveBeenCalledWith(params);
    });

    it('should start from 1 if no previous documents', async () => {
      const mockGetLastCounter = jest.fn().mockResolvedValue(0);
      numeroGenerator.getLastCounter = mockGetLastCounter;

      const params = {
        type: 'FACTURE',
        entreprise_id: 1,
        year: 2024
      };

      const nextCounter = await numeroGenerator.getNextNumber(params);
      
      expect(nextCounter).toBe(1);
    });

    it('should handle database errors gracefully', async () => {
      const mockGetLastCounter = jest.fn().mockRejectedValue(new Error('Database error'));
      numeroGenerator.getLastCounter = mockGetLastCounter;

      const params = {
        type: 'FACTURE',
        entreprise_id: 1,
        year: 2024
      };

      await expect(numeroGenerator.getNextNumber(params)).rejects.toThrow('Database error');
    });
  });

  describe('validateDocumentNumber', () => {
    it('should validate correct document numbers', () => {
      const validNumbers = [
        'FAC-2024-001',
        'PRO-2023-042',
        'TRANSPORT-2024-9999',
        'A-2020-1'
      ];

      validNumbers.forEach(numero => {
        expect(numeroGenerator.validateDocumentNumber(numero)).toBe(true);
      });
    });

    it('should reject invalid document numbers', () => {
      const invalidNumbers = [
        'INVALID',
        'FAC-2024',
        '2024-001',
        'FAC-INVALID-001',
        'FAC-2024-',
        '-2024-001',
        '',
        null,
        undefined
      ];

      invalidNumbers.forEach(numero => {
        expect(numeroGenerator.validateDocumentNumber(numero)).toBe(false);
      });
    });
  });

  describe('generateSequentialNumbers', () => {
    it('should generate multiple sequential numbers', () => {
      const params = {
        type: 'FACTURE',
        entreprise_id: 1,
        prefix: 'FAC',
        year: 2024,
        startCounter: 1,
        count: 5
      };

      const numbers = numeroGenerator.generateSequentialNumbers(params);
      
      expect(numbers).toEqual([
        'FAC-2024-001',
        'FAC-2024-002',
        'FAC-2024-003',
        'FAC-2024-004',
        'FAC-2024-005'
      ]);
    });

    it('should handle large batches', () => {
      const params = {
        type: 'FACTURE',
        entreprise_id: 1,
        prefix: 'FAC',
        year: 2024,
        startCounter: 100,
        count: 3
      };

      const numbers = numeroGenerator.generateSequentialNumbers(params);
      
      expect(numbers).toHaveLength(3);
      expect(numbers[0]).toBe('FAC-2024-100');
      expect(numbers[2]).toBe('FAC-2024-102');
    });
  });

  describe('formatCounter', () => {
    it('should format counter with minimum width', () => {
      expect(numeroGenerator.formatCounter(1)).toBe('001');
      expect(numeroGenerator.formatCounter(42)).toBe('042');
      expect(numeroGenerator.formatCounter(999)).toBe('999');
      expect(numeroGenerator.formatCounter(1000)).toBe('1000');
    });

    it('should handle zero and negative numbers', () => {
      expect(numeroGenerator.formatCounter(0)).toBe('000');
      expect(() => numeroGenerator.formatCounter(-1)).toThrow();
    });

    it('should allow custom width', () => {
      expect(numeroGenerator.formatCounter(1, 5)).toBe('00001');
      expect(numeroGenerator.formatCounter(123, 2)).toBe('123'); // No truncation
    });
  });

  describe('isValidYear', () => {
    it('should validate reasonable years', () => {
      const currentYear = new Date().getFullYear();
      
      expect(numeroGenerator.isValidYear(currentYear)).toBe(true);
      expect(numeroGenerator.isValidYear(currentYear - 10)).toBe(true);
      expect(numeroGenerator.isValidYear(currentYear + 1)).toBe(true);
    });

    it('should reject unreasonable years', () => {
      expect(numeroGenerator.isValidYear(1900)).toBe(false);
      expect(numeroGenerator.isValidYear(2100)).toBe(false);
      expect(numeroGenerator.isValidYear('2024')).toBe(false); // Should be number
      expect(numeroGenerator.isValidYear(null)).toBe(false);
    });
  });
});