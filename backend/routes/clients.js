/**
 * Routes pour la gestion des clients
 */
const express = require('express');
const router = express.Router();
const BaseModel = require('../models/BaseModel');
const { logger } = require('../utils/logger');

// Modèle Client
const Client = new BaseModel('clients');

/**
 * @swagger
 * components:
 *   schemas:
 *     Client:
 *       type: object
 *       required:
 *         - nom
 *         - email
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unique du client
 *         nom:
 *           type: string
 *           maxLength: 100
 *           description: Nom du client
 *         adresse:
 *           type: string
 *           description: Adresse du client
 *         telephone:
 *           type: string
 *           description: Numéro de téléphone
 *         email:
 *           type: string
 *           format: email
 *           description: Adresse email
 *         actif:
 *           type: boolean
 *           description: Client actif ou non
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Date de création
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Date de dernière modification
 */

/**
 * @swagger
 * /api/v1/clients:
 *   get:
 *     summary: Récupère la liste des clients
 *     tags: [Clients]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche par nom ou email
 *       - in: query
 *         name: actif
 *         schema:
 *           type: boolean
 *         description: Filtrer par statut actif
 *     responses:
 *       200:
 *         description: Liste des clients récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Client'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', actif } = req.query;
    
    let whereClause = '';
    let params = [];
    
    // Construction de la clause WHERE
    const conditions = [];
    
    if (search) {
      conditions.push(`(nom ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }
    
    if (actif !== undefined) {
      conditions.push(`actif = $${params.length + 1}`);
      params.push(actif === 'true');
    }
    
    if (conditions.length > 0) {
      whereClause = conditions.join(' AND ');
    }
    
    const result = await Client.findWithPagination({
      where: whereClause,
      params,
      orderBy: 'nom ASC',
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    logger.info(`Récupération de ${result.data.length} clients (page ${page})`);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    logger.error('Erreur lors de la récupération des clients:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/v1/clients/{id}:
 *   get:
 *     summary: Récupère un client par son ID
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du client
 *     responses:
 *       200:
 *         description: Client récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Client'
 *       404:
 *         description: Client non trouvé
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID invalide'
      });
    }
    
    const client = await Client.findById(parseInt(id));
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }
    
    logger.info(`Récupération du client ${client.nom} (ID: ${id})`);
    
    res.json({
      success: true,
      data: client
    });
    
  } catch (error) {
    logger.error('Erreur lors de la récupération du client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/v1/clients:
 *   post:
 *     summary: Crée un nouveau client
 *     tags: [Clients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - email
 *             properties:
 *               nom:
 *                 type: string
 *                 maxLength: 100
 *               adresse:
 *                 type: string
 *               telephone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               actif:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Client créé avec succès
 *       400:
 *         description: Données invalides
 *       409:
 *         description: Email déjà utilisé
 */
router.post('/', async (req, res) => {
  try {
    const { nom, adresse, telephone, email } = req.body;
    
    // Validation basique
    if (!nom || !email) {
      return res.status(400).json({
        success: false,
        message: 'Le nom et l\'email sont requis'
      });
    }
    
    // Vérifier l'unicité de l'email
    const clientExistant = await Client.findOne('email = $1', [email]);
    if (clientExistant) {
      return res.status(409).json({
        success: false,
        message: 'Un client avec cet email existe déjà'
      });
    }
    
    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }
    
    const nouveauClient = await Client.create({
      nom,
      adresse,
      telephone,
      email
    });
    
    logger.info(`Nouveau client créé: ${nouveauClient.nom} (ID: ${nouveauClient.id})`);
    
    res.status(201).json({
      success: true,
      message: 'Client créé avec succès',
      data: nouveauClient
    });
    
  } catch (error) {
    logger.error('Erreur lors de la création du client:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Email déjà utilisé'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/v1/clients/{id}:
 *   put:
 *     summary: Met à jour un client
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       200:
 *         description: Client mis à jour avec succès
 *       404:
 *         description: Client non trouvé
 *       409:
 *         description: Email déjà utilisé par un autre client
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID invalide'
      });
    }
    
    const clientExistant = await Client.findById(parseInt(id));
    if (!clientExistant) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }
    
    const { nom, adresse, telephone, email, actif } = req.body;
    
    // Si l'email est modifié, vérifier l'unicité
    if (email && email !== clientExistant.email) {
      const autreClient = await Client.findOne('email = $1', [email]);
      if (autreClient && autreClient.id !== parseInt(id)) {
        return res.status(409).json({
          success: false,
          message: 'Cet email est déjà utilisé par un autre client'
        });
      }
      
      // Validation email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Format d\'email invalide'
        });
      }
    }
    
    const donneesModifiees = {};
    if (nom !== undefined) donneesModifiees.nom = nom;
    if (adresse !== undefined) donneesModifiees.adresse = adresse;
    if (telephone !== undefined) donneesModifiees.telephone = telephone;
    if (email !== undefined) donneesModifiees.email = email;
    if (actif !== undefined) donneesModifiees.actif = actif;
    
    const clientMisAJour = await Client.update(parseInt(id), donneesModifiees);
    
    logger.info(`Client mis à jour: ${clientMisAJour.nom} (ID: ${id})`);
    
    res.json({
      success: true,
      message: 'Client mis à jour avec succès',
      data: clientMisAJour
    });
    
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/v1/clients/{id}:
 *   delete:
 *     summary: Supprime un client (suppression douce)
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Client supprimé avec succès
 *       404:
 *         description: Client non trouvé
 *       409:
 *         description: Impossible de supprimer (documents associés)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID invalide'
      });
    }
    
    const client = await Client.findById(parseInt(id));
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }
    
    // Sauvegarde dans la corbeille avant suppression
    try {
      await Client.query(
        'INSERT INTO corbeille (table_source, data, utilisateur) VALUES ($1, $2, $3)',
        [
          'clients',
          JSON.stringify(client),
          req.user ? req.user.username : null
        ]
      );
    } catch (corbeilleError) {
      logger.error('Erreur lors de la sauvegarde dans la corbeille:', corbeilleError);
    }
    await Client.delete(parseInt(id));
    logger.info(`Client supprimé: ${client.nom} (ID: ${id})`);
    res.json({
      success: true,
      message: 'Client supprimé avec succès',
      data: { id }
    });
    
  } catch (error) {
    logger.error('Erreur lors de la suppression du client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/v1/clients/{id}/documents:
 *   get:
 *     summary: Récupère les documents d'un client
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Type de document (facture, proforma)
 *     responses:
 *       200:
 *         description: Documents du client récupérés avec succès
 *       404:
 *         description: Client non trouvé
 */
router.get('/:id/documents', async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID invalide'
      });
    }
    
    const client = await Client.findById(parseInt(id));
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }
    
    let whereClause = 'client_id = $1';
    let params = [parseInt(id)];
    
    if (type) {
      whereClause += ' AND type_document = $2';
      params.push(type);
    }
    
    const documents = await Client.query(
      `SELECT * FROM documents WHERE ${whereClause} ORDER BY date_emission DESC`,
      params
    );
    
    logger.info(`Récupération de ${documents.rows.length} documents pour le client ${client.nom}`);
    
    res.json({
      success: true,
      data: documents.rows
    });
    
  } catch (error) {
    logger.error('Erreur lors de la récupération des documents du client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/v1/clients/{id}/stats:
 *   get:
 *     summary: Récupère les statistiques d'un client
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Statistiques du client récupérées avec succès
 *       404:
 *         description: Client non trouvé
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID invalide'
      });
    }
    
    const client = await Client.findById(parseInt(id));
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }
    
    // Récupérer les statistiques
    const statsQueries = await Promise.all([
      Client.query('SELECT COUNT(*) as total_documents FROM documents WHERE client_id = $1', [parseInt(id)]),
      Client.query('SELECT COUNT(*) as total_factures, COALESCE(SUM(montant_ttc), 0) as montant_total_factures FROM documents WHERE client_id = $1 AND type_document = \'facture\'', [parseInt(id)]),
      Client.query('SELECT COUNT(*) as total_proformas, COALESCE(SUM(montant_ttc), 0) as montant_total_proformas FROM documents WHERE client_id = $1 AND type_document = \'proforma\'', [parseInt(id)]),
      Client.query('SELECT COUNT(*) as factures_en_attente FROM documents WHERE client_id = $1 AND type_document = \'facture\' AND statut IN (\'brouillon\', \'envoyé\')', [parseInt(id)]),
      Client.query('SELECT date_emission FROM documents WHERE client_id = $1 AND type_document = \'facture\' ORDER BY date_emission DESC LIMIT 1', [parseInt(id)])
    ]);
    
    const stats = {
      total_documents: parseInt(statsQueries[0].rows[0].total_documents),
      total_factures: parseInt(statsQueries[1].rows[0].total_factures),
      montant_total_factures: parseFloat(statsQueries[1].rows[0].montant_total_factures || 0),
      total_proformas: parseInt(statsQueries[2].rows[0].total_proformas),
      montant_total_proformas: parseFloat(statsQueries[2].rows[0].montant_total_proformas || 0),
      factures_en_attente: parseInt(statsQueries[3].rows[0].factures_en_attente),
      derniere_facture: statsQueries[4].rows[0]?.date_emission || null
    };
    
    logger.info(`Statistiques récupérées pour le client ${client.nom}`);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    logger.error('Erreur lors de la récupération des statistiques du client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;