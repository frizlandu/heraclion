const testHelpers = require('../../../utils/testHelpers');
// ✅ Déclaration du mockDb AVANT le jest.mock
const mockDb = {
  query: jest.fn(),
  getClient: jest.fn(),
  transaction: jest.fn(),
  close: jest.fn(),
  end: jest.fn() // ✅ Ajout pour cleanup
};

jest.mock('../../../config/database', () => mockDb);

// ✅ Mock du logger cockpitifié
jest.mock('../../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

const BaseModel = require('../../../models/BaseModel');
const { logger } = require('../../../utils/logger');

describe('BaseModel', () => {
  let model;
  const tableName = 'test_table';

  beforeEach(() => {
    model = new BaseModel(tableName);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // ✅ Nettoyage du pool simulé
    if (mockDb.end) {
      await mockDb.end();
    }
  });

  describe('create', () => {
    it('should log error on creation failure', async () => {
      mockDb.query.mockRejectedValue(new Error('Duplicate entry'));

      await expect(model.create({ name: 'Test' })).rejects.toThrow('Duplicate entry');

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('insert failed'),
        expect.objectContaining({
          table: tableName,
          data: { name: 'Test' },
          error: 'Duplicate entry'
        })
      );
    });
  });

  describe('update', () => {
    it('should log error on update failure', async () => {
      mockDb.query.mockRejectedValue(new Error('Update failed'));

      await expect(model.update(1, { name: 'Test' })).rejects.toThrow('Update failed');

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('update failed'),
        expect.objectContaining({
          table: tableName,
          id: 1,
          data: { name: 'Test' },
          error: 'Update failed'
        })
      );
    });
  });

  describe('findById', () => {
    it('should log error on query failure', async () => {
      mockDb.query.mockRejectedValue(new Error('Query error'));

      await expect(model.findById(1)).rejects.toThrow('Query error');

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('findById failed'),
        expect.objectContaining({
          table: tableName,
          id: 1,
          error: 'Query error'
        })
      );
    });
  });

  describe('findAll', () => {
    it('should log error on query failure', async () => {
      mockDb.query.mockRejectedValue(new Error('FindAll error'));

      await expect(model.findAll()).rejects.toThrow('FindAll error');

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('findAll failed'),
        expect.objectContaining({
          table: tableName,
          error: 'FindAll error'
        })
      );
    });
  });

  describe('delete', () => {
    it('should log error on delete failure', async () => {
      mockDb.query.mockRejectedValue(new Error('Delete error'));

      await expect(model.delete(1)).rejects.toThrow('Delete error');

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('delete failed'),
        expect.objectContaining({
          table: tableName,
          id: 1,
          error: 'Delete error'
        })
      );
    });
  });

  describe('transaction', () => {
    it('should log error on transaction failure', async () => {
      const mockClient = {
        query: jest.fn().mockRejectedValue(new Error('Transaction error')),
        done: jest.fn(),
        release: jest.fn()
      };
      mockDb.getClient.mockResolvedValue(mockClient);

      await expect(model.transaction([
        { sql: 'INSERT INTO test (name) VALUES (?)', params: ['Test'] }
      ])).rejects.toThrow('Transaction error');

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('transaction failed'),
        expect.objectContaining({
          table: tableName,
          error: 'Transaction error'
        })
      );
    });
  });
});
