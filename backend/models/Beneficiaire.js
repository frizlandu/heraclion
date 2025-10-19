// Modèle pour la table beneficiaires
const db = require('../config/database');

class Beneficiaire {
  static async create({ nom, email }) {
    const query = `INSERT INTO beneficiaires (nom, email) VALUES ($1, $2) RETURNING *`;
    const params = [nom, email || null];
    const result = await db.query(query, params);
    return result.rows[0];
  }

  static async update(id, { nom, email }) {
    const query = `UPDATE beneficiaires SET nom=$1, email=$2 WHERE id=$3 RETURNING *`;
    const params = [nom, email || null, id];
    const result = await db.query(query, params);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM beneficiaires WHERE id = $1';
    await db.query(query, [id]);
    return true;
  }

  static async findAll() {
    const result = await db.query('SELECT * FROM beneficiaires ORDER BY nom');
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM beneficiaires WHERE id = $1', [id]);
    return result.rows[0];
  }
}

module.exports = Beneficiaire;
