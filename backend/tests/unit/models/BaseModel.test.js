const BaseModel = require('../../models/BaseModel');

// Mock de la base de données
const mockDb = {
  query: jest.fn(),
  transaction: jest.fn(),
  close: jest.fn()
};

jest.mock('../../config/database', () => mockDb);

describe('BaseModel', () => {
  let model;
  const tableName = 'test_table';
  const primaryKey = 'id';

  beforeEach(() => {
    model = new BaseModel(tableName, primaryKey);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with table name and primary key', () => {
      expect(model.tableName).toBe(tableName);
      expect(model.primaryKey).toBe(primaryKey);
    });

    it('should use default primary key if not provided', () => {
      const defaultModel = new BaseModel('users');
      expect(defaultModel.primaryKey).toBe('id');
    });
  });

  describe('findById', () => {
    it('should find record by ID', async () => {
      const mockRecord = { id: 1, name: 'Test' };
      mockDb.query.mockResolvedValue([mockRecord]);

      const result = await model.findById(1);

      expect(result).toEqual(mockRecord);
      expect(mockDb.query).toHaveBeenCalledWith(
        `SELECT * FROM ${tableName} WHERE ${primaryKey} = ?`,
        [1]
      );
    });

    it('should return null if record not found', async () => {
      mockDb.query.mockResolvedValue([]);

      const result = await model.findById(999);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockDb.query.mockRejectedValue(new Error('Database error'));

      await expect(model.findById(1)).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should find all records with default options', async () => {
      const mockRecords = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' }
      ];
      mockDb.query.mockResolvedValue(mockRecords);

      const result = await model.findAll();

      expect(result.data).toEqual(mockRecords);
      expect(mockDb.query).toHaveBeenCalledWith(
        `SELECT * FROM ${tableName} ORDER BY ${primaryKey} ASC LIMIT 50 OFFSET 0`,
        []
      );
    });

    it('should apply filters correctly', async () => {
      const filters = { name: 'Test', active: true };
      const mockRecords = [{ id: 1, name: 'Test', active: true }];
      mockDb.query.mockResolvedValue(mockRecords);

      const result = await model.findAll({
        where: filters,
        limit: 10,
        offset: 5,
        orderBy: 'name',
        orderDirection: 'DESC'
      });

      expect(result.data).toEqual(mockRecords);
      expect(mockDb.query).toHaveBeenCalledWith(
        `SELECT * FROM ${tableName} WHERE name = ? AND active = ? ORDER BY name DESC LIMIT 10 OFFSET 5`,
        ['Test', true]
      );
    });

    it('should handle empty results', async () => {
      mockDb.query.mockResolvedValue([]);

      const result = await model.findAll();

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('create', () => {
    it('should create new record', async () => {
      const newRecord = { name: 'New Test', description: 'Test description' };
      const mockResult = { insertId: 123 };
      const mockCreatedRecord = { id: 123, ...newRecord, created_at: new Date() };

      mockDb.query
        .mockResolvedValueOnce(mockResult) // INSERT query
        .mockResolvedValueOnce([mockCreatedRecord]); // SELECT query to return created record

      const result = await model.create(newRecord);

      expect(result).toEqual(mockCreatedRecord);
      expect(mockDb.query).toHaveBeenCalledWith(
        `INSERT INTO ${tableName} (name, description, created_at) VALUES (?, ?, ?)`,
        expect.arrayContaining(['New Test', 'Test description', expect.any(Date)])
      );
    });

    it('should handle creation errors', async () => {
      mockDb.query.mockRejectedValue(new Error('Duplicate entry'));

      await expect(model.create({ name: 'Test' })).rejects.toThrow('Duplicate entry');
    });

    it('should add timestamps automatically', async () => {
      const newRecord = { name: 'Test' };
      const mockResult = { insertId: 1 };
      mockDb.query.mockResolvedValueOnce(mockResult);

      await model.create(newRecord);

      const insertQuery = mockDb.query.mock.calls[0];
      expect(insertQuery[0]).toContain('created_at');
      expect(insertQuery[1]).toContain(expect.any(Date));
    });
  });

  describe('update', () => {
    it('should update existing record', async () => {
      const updateData = { name: 'Updated Test' };
      const mockResult = { affectedRows: 1 };
      const mockUpdatedRecord = { id: 1, name: 'Updated Test', updated_at: new Date() };

      mockDb.query
        .mockResolvedValueOnce(mockResult) // UPDATE query
        .mockResolvedValueOnce([mockUpdatedRecord]); // SELECT query to return updated record

      const result = await model.update(1, updateData);

      expect(result).toEqual(mockUpdatedRecord);
      expect(mockDb.query).toHaveBeenCalledWith(
        `UPDATE ${tableName} SET name = ?, updated_at = ? WHERE ${primaryKey} = ?`,
        expect.arrayContaining(['Updated Test', expect.any(Date), 1])
      );
    });

    it('should return null if record not found', async () => {
      const mockResult = { affectedRows: 0 };
      mockDb.query.mockResolvedValue(mockResult);

      const result = await model.update(999, { name: 'Test' });

      expect(result).toBeNull();
    });

    it('should add updated_at timestamp automatically', async () => {
      const updateData = { name: 'Test' };
      const mockResult = { affectedRows: 1 };
      mockDb.query.mockResolvedValueOnce(mockResult);

      await model.update(1, updateData);

      const updateQuery = mockDb.query.mock.calls[0];
      expect(updateQuery[0]).toContain('updated_at');
      expect(updateQuery[1]).toContain(expect.any(Date));
    });
  });

  describe('delete', () => {
    it('should delete record by ID', async () => {
      const mockResult = { affectedRows: 1 };
      mockDb.query.mockResolvedValue(mockResult);

      const result = await model.delete(1);

      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalledWith(
        `DELETE FROM ${tableName} WHERE ${primaryKey} = ?`,
        [1]
      );
    });

    it('should return false if record not found', async () => {
      const mockResult = { affectedRows: 0 };
      mockDb.query.mockResolvedValue(mockResult);

      const result = await model.delete(999);

      expect(result).toBe(false);
    });

    it('should handle soft delete if configured', async () => {
      model.softDelete = true;
      const mockResult = { affectedRows: 1 };
      mockDb.query.mockResolvedValue(mockResult);

      const result = await model.delete(1);

      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalledWith(
        `UPDATE ${tableName} SET deleted_at = ? WHERE ${primaryKey} = ?`,
        [expect.any(Date), 1]
      );
    });
  });

  describe('count', () => {
    it('should count all records', async () => {
      mockDb.query.mockResolvedValue([{ count: 42 }]);

      const result = await model.count();

      expect(result).toBe(42);
      expect(mockDb.query).toHaveBeenCalledWith(
        `SELECT COUNT(*) as count FROM ${tableName}`,
        []
      );
    });

    it('should count with filters', async () => {
      const filters = { active: true };
      mockDb.query.mockResolvedValue([{ count: 10 }]);

      const result = await model.count(filters);

      expect(result).toBe(10);
      expect(mockDb.query).toHaveBeenCalledWith(
        `SELECT COUNT(*) as count FROM ${tableName} WHERE active = ?`,
        [true]
      );
    });
  });

  describe('exists', () => {
    it('should return true if record exists', async () => {
      mockDb.query.mockResolvedValue([{ count: 1 }]);

      const result = await model.exists(1);

      expect(result).toBe(true);
    });

    it('should return false if record does not exist', async () => {
      mockDb.query.mockResolvedValue([{ count: 0 }]);

      const result = await model.exists(999);

      expect(result).toBe(false);
    });
  });

  describe('transaction', () => {
    it('should execute operations in transaction', async () => {
      const mockTransaction = {
        query: jest.fn().mockResolvedValue({ insertId: 1 }),
        commit: jest.fn(),
        rollback: jest.fn()
      };
      mockDb.transaction.mockResolvedValue(mockTransaction);

      const operations = async (trx) => {
        await trx.query('INSERT INTO test (name) VALUES (?)', ['Test']);
        return { success: true };
      };

      const result = await model.transaction(operations);

      expect(result.success).toBe(true);
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const mockTransaction = {
        query: jest.fn().mockRejectedValue(new Error('Transaction error')),
        commit: jest.fn(),
        rollback: jest.fn()
      };
      mockDb.transaction.mockResolvedValue(mockTransaction);

      const operations = async (trx) => {
        await trx.query('INSERT INTO test (name) VALUES (?)', ['Test']);
      };

      await expect(model.transaction(operations)).rejects.toThrow('Transaction error');
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });
  });

  describe('buildWhereClause', () => {
    it('should build WHERE clause from filters', () => {
      const filters = {
        name: 'Test',
        active: true,
        age: 25
      };

      const { clause, values } = model.buildWhereClause(filters);

      expect(clause).toBe('WHERE name = ? AND active = ? AND age = ?');
      expect(values).toEqual(['Test', true, 25]);
    });

    it('should return empty clause for no filters', () => {
      const { clause, values } = model.buildWhereClause({});

      expect(clause).toBe('');
      expect(values).toEqual([]);
    });

    it('should handle null values', () => {
      const filters = { name: null };

      const { clause, values } = model.buildWhereClause(filters);

      expect(clause).toBe('WHERE name IS NULL');
      expect(values).toEqual([]);
    });
  });

  describe('buildOrderClause', () => {
    it('should build ORDER BY clause', () => {
      const clause = model.buildOrderClause('name', 'DESC');
      expect(clause).toBe('ORDER BY name DESC');
    });

    it('should use default ordering if not specified', () => {
      const clause = model.buildOrderClause();
      expect(clause).toBe(`ORDER BY ${primaryKey} ASC`);
    });

    it('should validate order direction', () => {
      expect(() => {
        model.buildOrderClause('name', 'INVALID');
      }).toThrow('Invalid order direction');
    });
  });
});