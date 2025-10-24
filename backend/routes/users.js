const express = require('express');
const router = express.Router();
const { readConnexionLog } = require('../utils/connexionLog');
const BaseModel = require('../models/BaseModel');
const bcrypt = require('bcryptjs');
const User = new BaseModel('users');
const { authenticateToken } = require('./auth');
const authorizeRoles = require('../middleware/authorizeRoles');
// GET /api/users/connexions-log : historique des connexions (admin uniquement)
router.get('/connexions-log', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const log = readConnexionLog(100);
  res.json(log);
});
// POST /api/users : créer un utilisateur (admin uniquement)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { nom, email, role, mot_de_passe } = req.body;
  if (!nom || !email || !role || !mot_de_passe) return res.status(400).json({ error: 'Champs requis' });
  const password_hash = await bcrypt.hash(mot_de_passe, 10);
  try {
    const user = await User.create({ nom, email, role, password_hash, actif: true });
    res.json(user);
  } catch (_) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
// DELETE /api/users/:id : supprimer un utilisateur (admin uniquement)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    // Sauvegarde dans la corbeille avant suppression
    const user = await User.findById(req.params.id);
    if (user) {
      try {
        await User.query(
          'INSERT INTO corbeille (table_source, data, utilisateur) VALUES ($1, $2, $3)',
          [
            'users',
            JSON.stringify(user),
            req.user ? req.user.username : null
          ]
        );
      } catch (corbeilleError) {}
    }
    await User.delete(req.params.id);
    res.json({ success: true });
  } catch (_) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/users : liste des utilisateurs
// In production this endpoint requires admin auth; in development we allow listing without auth for convenience.
if (process.env.NODE_ENV === 'production') {
  router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
      const users = await User.findAll('', [], 'id');
      res.json(users);
    } catch (err) {
      console.error('GET /api/users failed', err && err.message);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });
} else {
  router.get('/', async (req, res) => {
    try {
      const users = await User.findAll('', [], 'id');
      res.json(users);
    } catch (err) {
      console.error('GET /api/users (dev) failed', err && err.message);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });
}

// POST /api/users/:id/reset-password : réinitialiser le mot de passe (admin uniquement)
router.post('/:id/reset-password', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  // Générer un mot de passe temporaire simple (à améliorer en prod)
  const tempPassword = Math.random().toString(36).slice(-8);
  try {
    const password_hash = await bcrypt.hash(tempPassword, 10);
    // Met à jour à la fois le mot de passe en clair et le hash
    await User.update(req.params.id, { mot_de_passe: tempPassword, password_hash });
    // TODO: Envoyer le mot de passe par email à l'utilisateur (si email configuré)
    res.json({ success: true, tempPassword });
  } catch (_) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/users/:id/role : changer le rôle d'un utilisateur (admin uniquement)
router.put('/:id/role', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { role } = req.body;
  if (!role) return res.status(400).json({ error: 'Rôle requis' });
  try {
    const user = await User.update(req.params.id, { role });
    res.json(user);
  } catch (_) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/users/:id/actif : activer/désactiver un utilisateur (admin uniquement)
router.put('/:id/actif', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { actif } = req.body;
  if (typeof actif !== 'boolean') return res.status(400).json({ error: 'Valeur actif requise' });
  try {
    const user = await User.update(req.params.id, { actif });
    res.json(user);
  } catch (_) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
