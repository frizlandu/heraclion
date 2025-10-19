const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Helper: format months (1..12 -> Jan..Déc)
const MONTH_LABELS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];

// Ventes: sum montant_ttc by month for factures (optionally filtered by year)
router.get('/ventes', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const sql = `
      SELECT EXTRACT(MONTH FROM date_emission)::int AS month,
             COALESCE(SUM(montant_ttc),0) AS ventes
      FROM documents
      WHERE type_document = 'facture' AND EXTRACT(YEAR FROM date_emission) = $1
      GROUP BY month
      ORDER BY month
    `;
    const result = await db.query(sql, [year]);
    const data = Array.from({ length: 12 }).map((_, i) => ({
      month: MONTH_LABELS[i],
      ventes: 0
    }));
    result.rows.forEach(r => {
      const idx = parseInt(r.month, 10) - 1;
      if (idx >= 0 && idx < 12) data[idx].ventes = parseFloat(r.ventes);
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Erreur /reports/ventes', error);
    res.status(500).json({ success: false, message: 'Erreur interne', error: error.message });
  }
});

// Depenses: aggregate from comptabilite table by month (débit as depense)
router.get('/depenses', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    // La table 'comptabilite' utilise la colonne 'date_ecriture' et 'montant' (débits/credits)
    const sql = `
      SELECT EXTRACT(MONTH FROM date_ecriture)::int AS month,
             COALESCE(SUM(CASE WHEN montant < 0 THEN ABS(montant) ELSE 0 END),0) AS depenses
      FROM comptabilite
      WHERE EXTRACT(YEAR FROM date_ecriture) = $1
      GROUP BY month
      ORDER BY month
    `;
    const result = await db.query(sql, [year]);
    const data = Array.from({ length: 12 }).map((_, i) => ({ month: MONTH_LABELS[i], depenses: 0 }));
    result.rows.forEach(r => {
      const idx = parseInt(r.month, 10) - 1;
      if (idx >= 0 && idx < 12) data[idx].depenses = parseFloat(r.depenses);
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Erreur /reports/depenses', error);
    res.status(500).json({ success: false, message: 'Erreur interne', error: error.message });
  }
});

// Tresorerie: cumulative balance from comptabilite ordered by month
router.get('/tresorerie', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    // Utiliser la colonne 'date_ecriture' pour la comptabilité
    const sql = `
      SELECT EXTRACT(MONTH FROM date_ecriture)::int AS month,
             COALESCE(SUM(montant),0) AS montant
      FROM comptabilite
      WHERE EXTRACT(YEAR FROM date_ecriture) = $1
      GROUP BY month
      ORDER BY month
    `;
    const result = await db.query(sql, [year]);
    const monthly = Array.from({ length: 12 }).map(() => 0);
    result.rows.forEach(r => {
      const idx = parseInt(r.month, 10) - 1;
      if (idx >= 0 && idx < 12) monthly[idx] = parseFloat(r.montant);
    });
    // cumulative
    const data = []; let cumulative = 0;
    for (let i = 0; i < 12; i++) {
      cumulative += monthly[i];
      data.push({ month: MONTH_LABELS[i], solde: cumulative });
    }
    res.json({ success: true, data });
  } catch (error) {
    console.error('Erreur /reports/tresorerie', error);
    res.status(500).json({ success: false, message: 'Erreur interne', error: error.message });
  }
});

// Stocks: current valorisation and mouvements par mois
router.get('/stocks', async (req, res) => {
  try {
    // Valorisation globale (table `stock`)
    // Note: some environments use table name `stocks` (plural). Prefer `stocks` here.
    const valSql = `
      SELECT COUNT(*) as nombre_articles,
             SUM(quantite_stock) as quantite_totale,
             SUM(quantite_stock * prix_achat) as valeur_achat,
             SUM(quantite_stock * prix_vente) as valeur_vente
      FROM stocks
    `;
    let valorisationRow = {};
    try {
      const valRes = await db.query(valSql);
      valorisationRow = (valRes && Array.isArray(valRes.rows) && valRes.rows[0]) ? valRes.rows[0] : {};
    } catch (err) {
      // If the stock table doesn't exist in the connected DB, return zeros instead of failing the endpoint
      if (err && err.code === '42P01') {
        console.warn('Reports /stocks: table `stock` not found on connected database. Returning empty valorisation.\n' +
          'If you expect stock data, ensure migrations were run against the same DB used by the server: run `npm run migrate` in backend/ with correct DB env vars.');
        valorisationRow = {};
      } else {
        throw err;
      }
    }

    // Mouvements: if table 'mouvements_stock' exists -> aggregate by year, else return zeros
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const mouvements = Array.from({ length: 12 }).map((_, i) => ({ month: MONTH_LABELS[i], mouvements: 0 }));
    try {
      const mouvSql = `
        SELECT EXTRACT(MONTH FROM date_mouvement)::int AS month, COALESCE(SUM(quantite),0) as mouvements
        FROM mouvements_stock
        WHERE EXTRACT(YEAR FROM date_mouvement) = $1
        GROUP BY month
        ORDER BY month
      `;
      const mouvRes = await db.query(mouvSql, [year]);
      if (mouvRes && Array.isArray(mouvRes.rows)) {
        mouvRes.rows.forEach(r => {
          const idx = parseInt(r.month, 10) - 1;
          if (idx >= 0 && idx < 12) mouvements[idx].mouvements = Number(r.mouvements) || 0;
        });
      }
    } catch (e) {
      if (e && e.code === '42P01') {
        console.warn('Reports /stocks: table `mouvements_stock` not found. Returning empty mouvements.');
      } else {
        console.warn('mouvements_stock query failed', e && e.message);
      }
    }

    const valorisation = {
      nombre_articles: Number(valorisationRow.nombre_articles || 0),
      quantite_totale: Number(valorisationRow.quantite_totale || 0),
      valeur_achat: Number(valorisationRow.valeur_achat || 0),
      valeur_vente: Number(valorisationRow.valeur_vente || 0)
    };

    console.debug('Reports /stocks - valorisation:', valorisation);

    res.json({ success: true, data: { valorisation, mouvements } });
  } catch (error) {
    console.error('Erreur /reports/stocks', error);
    res.status(500).json({ success: false, message: 'Erreur interne', error: error.message });
  }
});

module.exports = router;
