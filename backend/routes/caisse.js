const express = require('express');
const router = express.Router();
// POST /api/caisse/archiver : archive toutes les opérations d'un mois donné
const authorizeRoles = require('../middleware/authorizeRoles');
const { authenticateToken } = require('./auth');
router.post('/archiver', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { annee, mois } = req.body;
  if (!annee || !mois) return res.status(400).json({ error: 'Année et mois requis' });
  try {
    await Caisse.archiverMois(annee, mois);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur archivage caisse:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'archivage' });
  }
});
// EXPORT PDF global des opérations de caisse

// Export PDF harmonisé avec le tableau affiché
router.get('/export/pdf', async (req, res) => {
  try {
    const operations = await Caisse.findAll();
    if (!operations || operations.length === 0) {
      return res.status(404).json({ error: 'Aucune opération trouvée.' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="export-caisse.pdf"');
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    doc.pipe(res);
    // Titre
    doc.fontSize(18).text('Export global des opérations de caisse', { align: 'center' });
    doc.moveDown();
    // Table header (correspond à l'affichage DataTable)
    doc.fontSize(12);
    doc.text('Date', 40, doc.y, { continued: true, width: 70 });
    doc.text('Libellé', 120, doc.y, { continued: true, width: 120 });
    doc.text('Type', 250, doc.y, { continued: true, width: 50 });
    doc.text('Montant', 310, doc.y, { width: 100 });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(410, doc.y).stroke();
    // Table rows
    operations.forEach(op => {
      // Date formatée
      const date = op.date_operation ? new Date(op.date_operation).toLocaleDateString('fr-FR') : '';
      // Libellé
      const libelle = op.description || op.libelle || '';
      // Type
      const type = op.type_operation ? op.type_operation.charAt(0).toUpperCase() + op.type_operation.slice(1).toLowerCase() : '';
      // Montant formaté
      let montant = Number(op.montant) || 0;
      let montantStr = '';
      if (montant < 0) {
        montantStr = `${montant.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}`;
      } else {
        montantStr = `${montant.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}`;
      }
      doc.text(date, 40, doc.y, { continued: true, width: 70 });
      doc.text(libelle, 120, doc.y, { continued: true, width: 120 });
      doc.text(type, 250, doc.y, { continued: true, width: 50 });
      doc.text(montantStr, 310, doc.y, { width: 100 });
      doc.moveDown(0.5);
    });
    doc.end();
  } catch (error) {
    console.error('Erreur export PDF caisse:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la génération du PDF global de caisse' });
  }
});

const ExcelJS = require('exceljs');

// EXPORT Excel des opérations de caisse


// Export Excel harmonisé avec le tableau affiché
router.get('/export/excel', async (req, res) => {
  try {
    const operations = await Caisse.findAll();
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Caisse');
    sheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Libellé', key: 'libelle', width: 30 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Montant', key: 'montant', width: 18 },
    ];
    operations.forEach(op => {
      // Date formatée
      const date = op.date_operation ? new Date(op.date_operation).toLocaleDateString('fr-FR') : '';
      // Libellé
      const libelle = op.description || op.libelle || '';
      // Type
      const type = op.type_operation ? op.type_operation.charAt(0).toUpperCase() + op.type_operation.slice(1).toLowerCase() : '';
      // Montant formaté
      let montant = Number(op.montant) || 0;
      let montantStr = '';
      if (montant < 0) {
        montantStr = `${montant.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}`;
      } else {
        montantStr = `${montant.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}`;
      }
      sheet.addRow({
        date,
        libelle,
        type,
        montant: montantStr,
      });
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="export-caisse.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Erreur export Excel caisse:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la génération de l\'export Excel de caisse' });
  }
});


// Les opérations sont maintenant stockées dans req.app.locals.operations

// GET /api/caisse : liste filtrée depuis la base
const Caisse = require('../models/Caisse');
router.get('/', async (req, res) => {
  try {
    const { date_debut, date_fin, type, categorie, montant_min, montant_max, libelle } = req.query;
    const operations = await Caisse.findAll({ date_debut, date_fin, type, categorie, montant_min, montant_max, libelle });
    res.json(operations);
  } catch (error) {
    console.error('Erreur récupération caisse:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des opérations de caisse' });
  }
});

// POST /api/caisse : ajout d'opération
// Accept both legacy and frontend field names: libelle or description, type or type_operation
router.post('/', async (req, res) => {
  try {
    const { date, date_operation, libelle, description, type, type_operation, montant, reference_document } = req.body;
    const dateValue = date_operation || date;
    const libelleValue = libelle || description || null;
    const typeValue = type || type_operation || null;
    // montant may be a string when coming from some clients; try to coerce
    const montantNum = typeof montant === 'number' ? montant : (montant ? Number(montant) : NaN);

    if (!dateValue || !libelleValue || !typeValue || Number.isNaN(montantNum)) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const op = await Caisse.create({ date_operation: dateValue, libelle: libelleValue, type: typeValue, montant: montantNum, reference_document });
    res.status(201).json(op);
  } catch (error) {
    console.error('Erreur ajout caisse:', error);
    res.status(500).json({ error: "Erreur serveur lors de l'ajout d'une opération de caisse" });
  }
});

// GET /api/caisse/solde : solde actuel
const db = require('../config/database');
router.get('/solde', async (req, res) => {
  try {
    const result = await db.query('SELECT COALESCE(SUM(montant),0) AS solde FROM caisse');
    res.json({ solde: parseFloat(result.rows[0].solde) });
  } catch (error) {
    console.error('Erreur calcul solde caisse:', error);
    res.status(500).json({ error: 'Erreur serveur lors du calcul du solde de caisse' });
  }
});


// PUT /api/caisse/:id : modifier une opération
// Update: accept both description/libelle and type_operation/type
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { date, date_operation, libelle, description, type, type_operation, montant, reference_document } = req.body;
    const dateValue = date_operation || date;
    const libelleValue = libelle || description || null;
    const typeValue = type || type_operation || null;
    const montantNum = typeof montant === 'number' ? montant : (montant ? Number(montant) : NaN);

    if (!dateValue || !libelleValue || !typeValue || Number.isNaN(montantNum)) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const op = await Caisse.update(id, { date_operation: dateValue, libelle: libelleValue, type: typeValue, montant: montantNum, reference_document });
    if (!op) return res.status(404).json({ error: 'Opération non trouvée' });
    res.json(op);
  } catch (error) {
    console.error('Erreur modification caisse:', error);
    res.status(500).json({ error: "Erreur serveur lors de la modification de l'opération de caisse" });
  }
});

// DELETE /api/caisse/:id : supprimer une opération
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    // Sauvegarde dans la corbeille avant suppression
    const op = await Caisse.findById(id);
    if (op) {
      try {
        await Caisse.query(
          'INSERT INTO corbeille (table_source, data, utilisateur) VALUES ($1, $2, $3)',
          [
            'caisse',
            JSON.stringify(op),
            req.user ? req.user.username : null
          ]
        );
      } catch (corbeilleError) {}
    }
    await Caisse.delete(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression caisse:', error);
    res.status(500).json({ error: "Erreur serveur lors de la suppression de l'opération de caisse" });
  }
});


// GET /api/caisse/:id/bon : Générer un PDF du bon d'opération
const PDFDocument = require('pdfkit');
router.get('/:id/bon', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const result = await require('../config/database').query('SELECT * FROM caisse WHERE id = $1', [id]);
    const op = result.rows[0];
    if (!op) {
      return res.status(404).json({ error: 'Opération non trouvée' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="bon-caisse-${op.id}.pdf"`);
    const doc = new PDFDocument({ size: 'A5', margin: 40 });
    doc.pipe(res);
    // En-tête
    doc.fontSize(18).text(`Bon de ${op.type_operation && op.type_operation.toUpperCase() === 'ENTREE' ? 'Entrée' : 'Sortie'} de Caisse`, { align: 'center' });
    doc.moveDown();
    // Infos principales
    doc.fontSize(12);
    doc.text(`N° opération : ${op.id}`);
    doc.text(`Date : ${op.date_operation}`);
    doc.text(`Libellé : ${op.description}`);
    doc.text(`Type : ${op.type_operation && op.type_operation.toUpperCase() === 'ENTREE' ? 'Entrée' : 'Sortie'}`);
    doc.text(`Montant : ${Math.abs(Number(op.montant)).toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}`);
    doc.moveDown();
    doc.text('Signature:', { align: 'right' });
    doc.moveDown(2);
    doc.text('_________________________', { align: 'right' });
    doc.end();
  } catch (error) {
    console.error('Erreur génération PDF bon caisse:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la génération du bon de caisse' });
  }
});

module.exports = router;
console.log('Début routes/caisse.js');