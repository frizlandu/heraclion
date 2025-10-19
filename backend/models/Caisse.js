const db = require('../config/database');

class Caisse {
  static async archiverMois(annee, mois) {
    // Archive toutes les opérations du mois (mois = 1-12)
    const moisStr = String(mois).padStart(2, '0');
    const debut = `${annee}-${moisStr}-01`;
    const fin = `${annee}-${moisStr}-31`;
    const query = `UPDATE caisse SET archive = TRUE WHERE date_operation >= $1 AND date_operation <= $2`;
    await db.query(query, [debut, fin]);
    return true;
  }

    static async create({ date, date_operation, libelle, type, montant, reference_document }) {
      const dateValue = date_operation || date;
      const typeValue = type ? type.toUpperCase() : null;
      const query = `INSERT INTO caisse (date_operation, description, type_operation, montant, reference_document)
                    VALUES ($1, $2, $3, $4, $5) RETURNING *`;
      const params = [dateValue, libelle, typeValue, montant, reference_document || null];
      const result = await db.query(query, params);
      return result.rows[0];
    }

    static async update(id, { date, date_operation, libelle, type, montant, reference_document }) {
      const dateValue = date_operation || date;
      const typeValue = type ? type.toUpperCase() : null;
      const query = `UPDATE caisse SET date_operation=$1, description=$2, type_operation=$3, montant=$4, reference_document=$5
                    WHERE id=$6 RETURNING *`;
      const params = [dateValue, libelle, typeValue, montant, reference_document || null, id];
      const result = await db.query(query, params);
      return result.rows[0];
    }

    static async delete(id) {
      const query = 'DELETE FROM caisse WHERE id = $1';
      await db.query(query, [id]);
      return true;
    }
  static async findAll({ date_debut, date_fin, type, categorie, montant_min, montant_max, libelle } = {}) {
    let query = 'SELECT * FROM caisse WHERE 1=1';
    const params = [];
    if (date_debut) {
      params.push(date_debut);
      query += ` AND date_operation >= $${params.length}`;
    }
    if (date_fin) {
      params.push(date_fin);
      query += ` AND date_operation <= $${params.length}`;
    }
    if (type) {
      params.push(type);
      query += ` AND type_operation = $${params.length}`;
    }
    if (categorie) {
      params.push(categorie);
      query += ` AND categorie ILIKE $${params.length}`;
    }
    if (montant_min) {
      params.push(Number(montant_min));
      query += ` AND montant >= $${params.length}`;
    }
    if (montant_max) {
      params.push(Number(montant_max));
      query += ` AND montant <= $${params.length}`;
    }
    if (libelle) {
      params.push(`%${libelle}%`);
      query += ` AND libelle ILIKE $${params.length}`;
    }
    query += ' ORDER BY date_operation, id';
    const result = await db.query(query, params);
    return result.rows;
  }
}

module.exports = Caisse;
