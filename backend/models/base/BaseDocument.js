const BaseModel = require('./BaseModel');
const numeroGenerator = require('../../utils/numeroGenerator');

class BaseDocument extends BaseModel {
  constructor(tableName, documentType) {
    super(tableName);
    this.documentType = documentType; // 'facture_transport', 'facture_non_transport', etc.
  }

  /**
   * Surcharge findById pour inclure les informations d'entreprise et client
   * @param {number} id - ID du document
   * @returns {Promise<Object|null>} Document avec infos entreprise et client
   */
  async findById(id) {
    try {
      const query = `
        SELECT d.*, 
               e.nom as entreprise_nom, e.adresse as entreprise_adresse, 
               e.telephone as entreprise_telephone,
               c.nom as client_nom, c.adresse as client_adresse
        FROM ${this.tableName} d
        JOIN entreprises e ON d.entreprise_id = e.id
        LEFT JOIN clients c ON d.client_id = c.id
        WHERE d.id = $1
      `;
      const result = await this.query(query, [id]);
      console.log(`[DEBUG] Résultat SQL findById(${id}):`, result);
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error(`Erreur lors de la recherche par ID dans ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Crée un document avec génération automatique du numéro
   * @param {Object} data - Données du document
   * @returns {Promise<Object>} Document créé
   */
  async createDocument(data) {
    return this.transaction(async (client) => {
      // Générer le numéro automatiquement si non fourni
      if (!data.numero_facture && !data.numero_proforma) {
        const numeroField = this.documentType.includes('proforma') ? 'numero_proforma' : 'numero_facture';
        const dateField = this.documentType.includes('proforma') ? 'date_proforma' : 'date_facture';
        
        data[numeroField] = await numeroGenerator.generateNumero(
          data.entreprise_id,
          this.documentType,
          data[dateField]
        );
      }

      // Calculer les totaux automatiquement
      if (data.items && Array.isArray(data.items)) {
        const totals = this.calculateTotals(data.items, data.frais_administratif || 0);
        Object.assign(data, totals);
      }

      // Créer le document principal
      const keys = Object.keys(data).filter(key => key !== 'items');
      const values = keys.map(key => data[key]);
      const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
      
      const query = `
        INSERT INTO ${this.tableName} (${keys.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const result = await client.query(query, values);
      const document = result.rows[0];

      // Créer les items si fournis
      if (data.items && Array.isArray(data.items)) {
        const itemsTableName = `items_${this.tableName}`;
        const documentIdField = `${this.tableName}_id`;

        for (const item of data.items) {
          const itemData = {
            ...item,
            [documentIdField]: document.id
          };

          const itemKeys = Object.keys(itemData);
          const itemValues = Object.values(itemData);
          const itemPlaceholders = itemKeys.map((_, index) => `$${index + 1}`).join(', ');

          const itemQuery = `
            INSERT INTO ${itemsTableName} (${itemKeys.join(', ')})
            VALUES (${itemPlaceholders})
          `;

          await client.query(itemQuery, itemValues);
        }
      }

      return document;
    });
  }

  /**
   * Met à jour un document avec ses items
   * @param {number} id - ID du document
   * @param {Object} data - Nouvelles données
   * @returns {Promise<Object>} Document mis à jour
   */
  async updateDocument(id, data) {
    return this.transaction(async (client) => {
      // Calculer les nouveaux totaux si items fournis
      if (data.items && Array.isArray(data.items)) {
        const totals = this.calculateTotals(data.items, data.frais_administratif || 0);
        Object.assign(data, totals);
      }

      // Mettre à jour le document principal
      const keys = Object.keys(data).filter(key => key !== 'items');
      const values = Object.values(data).filter((_, index) => keys[index] !== 'items');
      const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
      
      const query = `
        UPDATE ${this.tableName}
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await client.query(query, [id, ...values]);
      const document = result.rows[0];

      // Mettre à jour les items si fournis
      if (data.items && Array.isArray(data.items)) {
        const itemsTableName = `items_${this.tableName}`;
        const documentIdField = `${this.tableName}_id`;

        // Supprimer les anciens items
        await client.query(`DELETE FROM ${itemsTableName} WHERE ${documentIdField} = $1`, [id]);

        // Créer les nouveaux items
        for (const item of data.items) {
          const itemData = {
            ...item,
            [documentIdField]: id
          };

          const itemKeys = Object.keys(itemData);
          const itemValues = Object.values(itemData);
          const itemPlaceholders = itemKeys.map((_, index) => `$${index + 1}`).join(', ');

          const itemQuery = `
            INSERT INTO ${itemsTableName} (${itemKeys.join(', ')})
            VALUES (${itemPlaceholders})
          `;

          await client.query(itemQuery, itemValues);
        }
      }

      return document;
    });
  }

  /**
   * Récupère un document avec ses items
   * @param {number} id - ID du document
   * @returns {Promise<Object|null>} Document avec items
   */
  async findByIdWithItems(id) {
    const document = await this.findById(id);
    if (!document) return null;

    const itemsTableName = `items_${this.tableName}`;
    const documentIdField = `${this.tableName}_id`;

    const itemsQuery = `SELECT * FROM ${itemsTableName} WHERE ${documentIdField} = $1 ORDER BY ordre ASC`;
    const itemsResult = await this.query(itemsQuery, [id]);

    return {
      ...document,
      items: itemsResult.rows
    };
  }

  /**
   * Calcule les totaux d'un document
   * @param {Array} items - Liste des items
   * @param {number} fraisAdministratif - Frais administratifs
   * @returns {Object} Totaux calculés
   */
  calculateTotals(items, fraisAdministratif = 0) {
    const sousTotal = items.reduce((sum, item) => {
      return sum + (parseFloat(item.prix_total) || 0);
    }, 0);

    const total = sousTotal + fraisAdministratif;
    const tva = total * 0.20; // 20% de TVA par défaut
    const totalGeneral = total + tva;

    return {
      frais_administratif: fraisAdministratif,
      total: total,
      tva: tva,
      total_general: totalGeneral
    };
  }

  /**
   * Recherche des documents par critères
   * @param {Object} criteria - Critères de recherche
   * @returns {Promise<Array>} Documents trouvés
   */
  async searchDocuments(criteria = {}) {
    const { 
      entreprise_id, 
      client_id, 
      statut, 
      date_debut, 
      date_fin, 
      numero,
      limit = 50,
      offset = 0
    } = criteria;

    let whereConditions = [];
    let params = [];
    let paramCount = 0;

    if (entreprise_id) {
      whereConditions.push(`entreprise_id = $${++paramCount}`);
      params.push(entreprise_id);
    }

    if (client_id) {
      whereConditions.push(`client_id = $${++paramCount}`);
      params.push(client_id);
    }

    if (statut) {
      whereConditions.push(`statut = $${++paramCount}`);
      params.push(statut);
    }

    if (date_debut) {
      const dateField = this.documentType.includes('proforma') ? 'date_proforma' : 'date_facture';
      whereConditions.push(`${dateField} >= $${++paramCount}`);
      params.push(date_debut);
    }

    if (date_fin) {
      const dateField = this.documentType.includes('proforma') ? 'date_proforma' : 'date_facture';
      whereConditions.push(`${dateField} <= $${++paramCount}`);
      params.push(date_fin);
    }

    if (numero) {
      const numeroField = this.documentType.includes('proforma') ? 'numero_proforma' : 'numero_facture';
      whereConditions.push(`${numeroField} ILIKE $${++paramCount}`);
      params.push(`%${numero}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const dateField = this.documentType.includes('proforma') ? 'date_proforma' : 'date_facture';

    const query = `
      SELECT d.*, 
        e.nom as entreprise_nom, e.adresse as entreprise_adresse, 
        e.telephone as entreprise_telephone,
        c.nom as client_nom
      FROM ${this.tableName} d
      JOIN entreprises e ON d.entreprise_id = e.id
      JOIN clients c ON d.client_id = c.id
      ${whereClause}
      ORDER BY ${dateField} DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;

    params.push(limit, offset);
    const result = await this.query(query, params);
    return result.rows;
  }

  /**
   * Met à jour le statut d'un document
   * @param {number} id - ID du document
   * @param {string} statut - Nouveau statut
   * @returns {Promise<Object|null>} Document mis à jour
   */
  async updateStatut(id, statut) {
    const query = `
      UPDATE ${this.tableName}
      SET statut = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.query(query, [id, statut]);
    return result.rows[0] || null;
  }
}

module.exports = BaseDocument;