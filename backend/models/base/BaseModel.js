

const { pool } = require('../../config/database');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.pool = pool;
  }

  /**
   * Exécute une requête SQL avec gestion d'erreurs
   * @param {string} query - Requête SQL
   * @param {Array} params - Paramètres de la requête
   * @returns {Promise<Object>} Résultat de la requête
   */
  async query(query, params = []) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(query, params);
      return result;
    } catch (error) {
      console.error('Erreur base de données:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Trouve un enregistrement par ID
   * @param {number} id - ID de l'enregistrement
   * @returns {Promise<Object|null>} Enregistrement trouvé ou null
   */
  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Trouve tous les enregistrements avec pagination
   * @param {Object} options - Options de requête
   * @returns {Promise<Array>} Liste des enregistrements
   */
  async findAll(options = {}) {
    const { limit = 50, offset = 0, orderBy = 'id', orderDirection = 'ASC', where = '' } = options;
    
    let query = `SELECT * FROM ${this.tableName}`;
    let params = [];
    
    if (where) {
      query += ` WHERE ${where}`;
      if (options.whereParams) {
        params = options.whereParams;
      }
    }
    
    query += ` ORDER BY ${orderBy} ${orderDirection} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await this.query(query, params);
    return result.rows;
  }

  /**
   * Crée un nouvel enregistrement
   * @param {Object} data - Données à insérer
   * @returns {Promise<Object>} Enregistrement créé
   */
  async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Met à jour un enregistrement
   * @param {number} id - ID de l'enregistrement
   * @param {Object} data - Données à mettre à jour
   * @returns {Promise<Object|null>} Enregistrement mis à jour
   */
  async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
    
    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.query(query, [id, ...values]);
    return result.rows[0] || null;
  }

  /**
   * Supprime un enregistrement
   * @param {number} id - ID de l'enregistrement
   * @returns {Promise<boolean>} Succès de la suppression
   */
  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
    const result = await this.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Compte le nombre total d'enregistrements
   * @param {string} whereClause - Clause WHERE optionnelle
   * @param {Array} params - Paramètres pour la clause WHERE
   * @returns {Promise<number>} Nombre d'enregistrements
   */
  async count(whereClause = '', params = []) {
    let query = `SELECT COUNT(*) as total FROM ${this.tableName}`;
    if (whereClause) {
      query += ` WHERE ${whereClause}`;
    }
    
    const result = await this.query(query, params);
    return parseInt(result.rows[0].total);
  }

  /**
   * Vérifie si un enregistrement existe
   * @param {number} id - ID de l'enregistrement
   * @returns {Promise<boolean>} Existence de l'enregistrement
   */
  async exists(id) {
    const query = `SELECT 1 FROM ${this.tableName} WHERE id = $1 LIMIT 1`;
    const result = await this.query(query, [id]);
    return result.rows.length > 0;
  }

  /**
   * Exécute une transaction
   * @param {Function} callback - Fonction à exécuter dans la transaction
   * @returns {Promise<any>} Résultat de la transaction
   */
  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = BaseModel;