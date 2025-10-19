/**
 * Modèle de base pour tous les modèles de données
 */

const db = require('../config/database');
const { logger } = require('../utils/logger');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.logger = logger;
  }

  /**
   * Trouver un enregistrement par son ID
   * @param {number} id - ID de l'enregistrement
   * @returns {Promise<object|null>} Enregistrement trouvé ou null
   */
  async findById(id) {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error(`Erreur lors de la recherche par ID dans ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Trouver un enregistrement selon des critères
   * @param {string} whereClause - Clause WHERE
   * @param {Array} params - Paramètres de la requête
   * @returns {Promise<object|null>} Premier enregistrement trouvé ou null
   */
  async findOne(whereClause, params = []) {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE ${whereClause} LIMIT 1`;
      const result = await db.query(query, params);
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error(`Erreur lors de la recherche dans ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Trouver tous les enregistrements selon des critères
   * @param {string} whereClause - Clause WHERE optionnelle
   * @param {Array} params - Paramètres de la requête
   * @param {string} orderBy - Clause ORDER BY optionnelle
   * @returns {Promise<Array>} Liste des enregistrements
   */
  async findAll(whereClause = '', params = [], orderBy = '') {
    try {
      let query = `SELECT * FROM ${this.tableName}`;
      if (whereClause) {
        query += ` WHERE ${whereClause}`;
      }
      if (orderBy) {
        query += ` ORDER BY ${orderBy}`;
      }
      
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      this.logger.error(`Erreur lors de la recherche dans ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Recherche avec pagination
   * @param {object} options - Options de recherche
   * @returns {Promise<object>} Résultats paginés
   */
  async findWithPagination(options = {}) {
    const {
      where = '',
      params = [],
      orderBy = 'id DESC',
      page = 1,
      limit = 10
    } = options;

    try {
      const offset = (page - 1) * limit;
      
      // Requête pour compter le total
      let countQuery = `SELECT COUNT(*) FROM ${this.tableName}`;
      if (where) {
        countQuery += ` WHERE ${where}`;
      }
      
      const countResult = await db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);
      
      // Requête pour récupérer les données
      let dataQuery = `SELECT * FROM ${this.tableName}`;
      if (where) {
        dataQuery += ` WHERE ${where}`;
      }
      dataQuery += ` ORDER BY ${orderBy}`;
      dataQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      
      const dataResult = await db.query(dataQuery, [...params, limit, offset]);
      
      return {
        data: dataResult.rows,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`Erreur lors de la recherche paginée dans ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Créer un nouvel enregistrement
   * @param {object} data - Données à insérer
   * @returns {Promise<object>} Enregistrement créé
   */
  async create(data) {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
      const columns = keys.join(', ');
      
      const query = `
        INSERT INTO ${this.tableName} (${columns}) 
        VALUES (${placeholders}) 
        RETURNING *
      `;
      
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      this.logger.error(`Erreur lors de la création dans ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Mettre à jour un enregistrement
   * @param {number} id - ID de l'enregistrement
   * @param {object} data - Données à mettre à jour
   * @returns {Promise<object>} Enregistrement mis à jour
   */
  async update(id, data) {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
      
      const query = `
        UPDATE ${this.tableName} 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $${keys.length + 1} 
        RETURNING *
      `;
      
      const result = await db.query(query, [...values, id]);
      return result.rows[0];
    } catch (error) {
      this.logger.error(`Erreur lors de la mise à jour dans ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Supprimer un enregistrement (suppression physique)
   * @param {number} id - ID de l'enregistrement
   * @returns {Promise<boolean>} True si supprimé avec succès
   */
  async delete(id) {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
      const result = await db.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      this.logger.error(`Erreur lors de la suppression dans ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Exécuter une requête personnalisée
   * @param {string} query - Requête SQL
   * @param {Array} params - Paramètres de la requête
   * @returns {Promise} Résultat de la requête
   */
  async query(query, params = []) {
    try {
      return await db.query(query, params);
    } catch (error) {
      this.logger.error(`Erreur lors de l'exécution de la requête personnalisée:`, error);
      throw error;
    }
  }
}

module.exports = BaseModel;