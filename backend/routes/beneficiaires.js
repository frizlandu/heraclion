const express = require('express');
const router = express.Router();
const Beneficiaire = require('../models/Beneficiaire');

// GET /api/beneficiaires : liste
router.get('/', async (req, res) => {
  try {
    const list = await Beneficiaire.findAll();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/beneficiaires : ajout
router.post('/', async (req, res) => {
  try {
    const { nom, email } = req.body;
    if (!nom) return res.status(400).json({ error: 'Nom obligatoire' });
    const b = await Beneficiaire.create({ nom, email });
    res.status(201).json(b);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/beneficiaires/:id : modifier
router.put('/:id', async (req, res) => {
  try {
    const { nom, email } = req.body;
    const b = await Beneficiaire.update(req.params.id, { nom, email });
    if (!b) return res.status(404).json({ error: 'Non trouvé' });
    res.json(b);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/beneficiaires/:id : supprimer
router.delete('/:id', async (req, res) => {
  try {
    // Sauvegarde dans la corbeille avant suppression
    const beneficiaire = await Beneficiaire.findById(req.params.id);
    if (beneficiaire) {
      try {
        await Beneficiaire.query(
          'INSERT INTO corbeille (table_source, data, utilisateur) VALUES ($1, $2, $3)',
          [
            'beneficiaires',
            JSON.stringify(beneficiaire),
            req.user ? req.user.username : null
          ]
        );
      } catch (corbeilleError) {
        // log possible
      }
    }
    await Beneficiaire.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
