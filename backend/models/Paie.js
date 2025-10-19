// Modèle pour la table paie
const db = require('../config/database');

class Paie {
  static async create({ date, agent, montant, commentaire, devise, taux, caisse_id }) {
    const query = `INSERT INTO paie (date, agent, montant, commentaire, devise, taux, caisse_id)
                   VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
    const params = [date, agent, montant, commentaire || '', devise || 'USD', taux || null, caisse_id || null];
    const result = await db.query(query, params);
    return result.rows[0];
  }

  static async findAll() {
    const result = await db.query('SELECT * FROM paie ORDER BY date DESC, id DESC');
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM paie WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async update(id, { date, agent, montant, commentaire, devise, taux, caisse_id }) {
    const query = `UPDATE paie SET date=$1, agent=$2, montant=$3, commentaire=$4, devise=$5, taux=$6, caisse_id=$7, updated_at=NOW()
                   WHERE id=$8 RETURNING *`;
    const params = [date, agent, montant, commentaire || '', devise || 'USD', taux || null, caisse_id || null, id];
    const result = await db.query(query, params);
    return result.rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM paie WHERE id = $1', [id]);
    return true;
  }
}

module.exports = Paie;
