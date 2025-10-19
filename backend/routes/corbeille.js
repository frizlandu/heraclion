const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { logger } = require('../utils/logger');

// GET /api/v1/corbeille : liste paginée des éléments supprimés
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, table_source } = req.query;
    const offset = (page - 1) * limit;
    let where = '';
    let params = [];
    if (table_source) {
      where = 'WHERE table_source = $1';
      params = [table_source];
    }
    const totalQuery = `SELECT COUNT(*) FROM corbeille ${where}`;
    const totalResult = await db.query(totalQuery, params);
    const total = parseInt(totalResult.rows[0].count);
    const dataQuery = `SELECT * FROM corbeille ${where} ORDER BY date_suppression DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
    const dataResult = await db.query(dataQuery, [...params, limit, offset]);
    res.json({
      success: true,
      data: dataResult.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération de la corbeille:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/v1/corbeille/:id/restaurer : restaure un élément supprimé
router.post('/:id/restaurer', async (req, res) => {
  try {
    const { id } = req.params;
    const corbeilleItemResult = await db.query('SELECT * FROM corbeille WHERE id = $1', [id]);
    if (corbeilleItemResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Élément non trouvé dans la corbeille' });
    }
    const item = corbeilleItemResult.rows[0];
    const table = item.table_source;
    const data = item.data;
    // On suppose que la clé primaire est "id" et que data contient toutes les colonnes nécessaires
    const obj = JSON.parse(data);
    // Construction dynamique de la requête d'insertion
    const columns = Object.keys(obj);
    const values = Object.values(obj);
    const placeholders = columns.map((_, i) => `$${i+1}`).join(', ');
    const insertQuery = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`;
    await db.query(insertQuery, values);
    // Suppression de la corbeille après restauration
    await db.query('DELETE FROM corbeille WHERE id = $1', [id]);
    res.json({ success: true, message: 'Élément restauré avec succès' });
  } catch (error) {
    logger.error('Erreur lors de la restauration depuis la corbeille:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
