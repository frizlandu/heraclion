/**
 * Routes d'authentification JWT
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const BaseModel = require('../models/BaseModel');
const { logger } = require('../utils/logger');

const router = express.Router();
const User = new BaseModel('users');
const { logConnexion } = require('../utils/connexionLog');

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: admin@heraclion.fr
 *         password:
 *           type: string
 *           example: admin123
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             token:
 *               type: string
 *             expires_in:
 *               type: string
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Identifiants invalides
 *       500:
 *         description: Erreur serveur
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Validation des entrées
    if (!email || !password) {
      logConnexion({ userId: null, email, ip, success: false });
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // Rechercher l'utilisateur
    const user = await User.findOne('email = $1', [email]);
    if (!user) {
      logConnexion({ userId: null, email, ip, success: false });
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier si l'utilisateur est actif
    if (!user.actif) {
      logConnexion({ userId: user.id, email, ip, success: false });
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé'
      });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      logConnexion({ userId: user.id, email, ip, success: false });
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Défensive: vérifier la présence d'un JWT_SECRET valide
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === '__GENERATED_JWT_SECRET__' || jwtSecret === 'your_super_secret_jwt_key_here_change_in_production') {
      const errMsg = `JWT_SECRET non configuré correctement (value=${jwtSecret})`;
      logger.error(errMsg);
      return res.status(500).json({ success: false, message: 'Erreur serveur: JWT non configuré' , details: errMsg });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Supprimer le mot de passe de la réponse
    const { password_hash, ...userWithoutPassword } = user;

    logConnexion({ userId: user.id, email, ip, success: true });
    logger.info(`Connexion réussie pour l'utilisateur: ${user.email}`);

    res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
        expires_in: process.env.JWT_EXPIRES_IN || '24h'
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la connexion:', error);
    if (error instanceof Error) {
      res.status(500).json({ message: 'Erreur interne du serveur', error: error.message, stack: error.stack });
    } else {
      res.status(500).json({ message: 'Erreur interne du serveur', error });
    }
  }
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Obtenir le profil utilisateur actuel
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur
 *       401:
 *         description: Non autorisé
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const { password_hash, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Déconnexion
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 */
router.post('/logout', authenticateToken, (req, res) => {
  logger.info(`Déconnexion de l'utilisateur: ${req.user.email}`);
  
  res.status(200).json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

/**
 * Middleware d'authentification JWT
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token d\'accès requis'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token invalide'
      });
    }

    req.user = user;
    next();
  });
}

module.exports = router;