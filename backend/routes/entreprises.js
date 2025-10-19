/**
 * Routes pour la gestion des entreprises
 */
const express = require('express');
const router = express.Router();
const BaseModel = require('../models/BaseModel');
const { logger } = require('../utils/logger');
const { validateData } = require('../validators');

// Modèle Entreprise
const Entreprise = new BaseModel('entreprises');

/**
 * @swagger
 * components:
 *   schemas:
 *     Entreprise:
 *       type: object
 *       required:
 *         - nom
 *         - type_entreprise
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unique de l'entreprise
 *         nom:
 *           type: string
 *           maxLength: 100
 *           description: Nom de l'entreprise
 *         logo:
 *           type: string
 *           description: Chemin vers le logo
 *         telephone:
 *           type: string
 *           description: Numéro de téléphone
 *         adresse:
 *           type: string
 *           description: Adresse complète
 *         reference:
 *           type: string
 *           description: Référence unique
 *         autres_coordonnees:
 *           type: string
 *           description: Autres coordonnées (email, SIRET, etc.)
 *         prefix_facture:
 *           type: string
 *           description: Préfixe pour les factures
 *         type_entreprise:
 *           type: string
 *           enum: [TRANSPORT, NON_TRANSPORT]
 *           description: Type d'entreprise
 *         template_facture:
 *           type: string
 *           description: Template pour les factures
 *         template_proforma:
 *           type: string
 *           description: Template pour les proformas
 */

/**
 * @swagger
 * /api/v1/entreprises:
 *   get:
 *     summary: Récupère la liste des entreprises
 *     tags: [Entreprises]
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
 *         description: Recherche par nom
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [TRANSPORT, NON_TRANSPORT]
 *         description: Filtrer par type
 *     responses:
 *       200:
 *         description: Liste des entreprises récupérée avec succès
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
 *                         $ref: '#/components/schemas/Entreprise'
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
    const { page = 1, limit = 10, search = '', type = '' } = req.query;
    
    let whereClause = '';
    let params = [];
    
    // Construction de la clause WHERE
    const conditions = [];
    
    if (search) {
      conditions.push(`nom ILIKE $${params.length + 1}`);
      params.push(`%${search}%`);
    }
    
    if (type) {
      conditions.push(`type_entreprise = $${params.length + 1}`);
      params.push(type);
    }
    
    if (conditions.length > 0) {
      whereClause = conditions.join(' AND ');
    }
    
    const result = await Entreprise.findWithPagination({
      where: whereClause,
      params,
      orderBy: 'nom ASC',
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    logger.info(`Récupération de ${result.data.length} entreprises (page ${page})`);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    logger.error('Erreur lors de la récupération des entreprises:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/v1/entreprises/{id}:
 *   get:
 *     summary: Récupère une entreprise par son ID
 *     tags: [Entreprises]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'entreprise
 *     responses:
 *       200:
 *         description: Entreprise récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Entreprise'
 *       404:
 *         description: Entreprise non trouvée
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
    
    const entreprise = await Entreprise.findById(parseInt(id));
    
    if (!entreprise) {
      return res.status(404).json({
        success: false,
        message: 'Entreprise non trouvée'
      });
    }
    
    logger.info(`Récupération de l'entreprise ${entreprise.nom} (ID: ${id})`);
    
    res.json({
      success: true,
      data: entreprise
    });
    
  } catch (error) {
    logger.error('Erreur lors de la récupération de l\'entreprise:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/v1/entreprises:
 *   post:
 *     summary: Crée une nouvelle entreprise
 *     tags: [Entreprises]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - type_entreprise
 *             properties:
 *               nom:
 *                 type: string
 *                 maxLength: 100
 *               logo:
 *                 type: string
 *               telephone:
 *                 type: string
 *               adresse:
 *                 type: string
 *               reference:
 *                 type: string
 *               autres_coordonnees:
 *                 type: string
 *               prefix_facture:
 *                 type: string
 *               type_entreprise:
 *                 type: string
 *                 enum: [TRANSPORT, NON_TRANSPORT]
 *     responses:
 *       201:
 *         description: Entreprise créée avec succès
 *       400:
 *         description: Données invalides
 */
router.post('/', async (req, res) => {
  try {
    // Validation des données (à implémenter avec Joi si nécessaire)
    const {
      nom,
      logo,
      telephone,
      adresse,
      reference,
      autres_coordonnees,
      prefix_facture,
      type_entreprise,
      template_facture,
      template_proforma
    } = req.body;
    
    if (!nom || !type_entreprise) {
      return res.status(400).json({
        success: false,
        message: 'Le nom et le type d\'entreprise sont requis'
      });
    }
    
    if (!['TRANSPORT', 'NON_TRANSPORT'].includes(type_entreprise)) {
      return res.status(400).json({
        success: false,
        message: 'Type d\'entreprise invalide'
      });
    }
    
    const nouvelleEntreprise = await Entreprise.create({
      nom,
      logo,
      telephone,
      adresse,
      reference,
      autres_coordonnees,
      prefix_facture,
      type_entreprise,
      template_facture,
      template_proforma
    });
    
    logger.info(`Nouvelle entreprise créée: ${nouvelleEntreprise.nom} (ID: ${nouvelleEntreprise.id})`);
    
    res.status(201).json({
      success: true,
      message: 'Entreprise créée avec succès',
      data: nouvelleEntreprise
    });
    
  } catch (error) {
    logger.error('Erreur lors de la création de l\'entreprise:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Une entreprise avec ce nom existe déjà'
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
 * /api/v1/entreprises/{id}:
 *   put:
 *     summary: Met à jour une entreprise
 *     tags: [Entreprises]
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
 *             $ref: '#/components/schemas/Entreprise'
 *     responses:
 *       200:
 *         description: Entreprise mise à jour avec succès
 *       404:
 *         description: Entreprise non trouvée
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
    
    const entrepriseExistante = await Entreprise.findById(parseInt(id));
    if (!entrepriseExistante) {
      return res.status(404).json({
        success: false,
        message: 'Entreprise non trouvée'
      });
    }
    
    const {
      nom,
      logo,
      telephone,
      adresse,
      reference,
      autres_coordonnees,
      prefix_facture,
      type_entreprise,
      template_facture,
      template_proforma
    } = req.body;
    
    const donneesModifiees = {};
    if (nom !== undefined) donneesModifiees.nom = nom;
    if (logo !== undefined) donneesModifiees.logo = logo;
    if (telephone !== undefined) donneesModifiees.telephone = telephone;
    if (adresse !== undefined) donneesModifiees.adresse = adresse;
    if (reference !== undefined) donneesModifiees.reference = reference;
    if (autres_coordonnees !== undefined) donneesModifiees.autres_coordonnees = autres_coordonnees;
    if (prefix_facture !== undefined) donneesModifiees.prefix_facture = prefix_facture;
    if (type_entreprise !== undefined) {
      if (!['TRANSPORT', 'NON_TRANSPORT'].includes(type_entreprise)) {
        return res.status(400).json({
          success: false,
          message: 'Type d\'entreprise invalide'
        });
      }
      donneesModifiees.type_entreprise = type_entreprise;
    }
    if (template_facture !== undefined) donneesModifiees.template_facture = template_facture;
    if (template_proforma !== undefined) donneesModifiees.template_proforma = template_proforma;
    
    const entrepriseMiseAJour = await Entreprise.update(parseInt(id), donneesModifiees);
    
    logger.info(`Entreprise mise à jour: ${entrepriseMiseAJour.nom} (ID: ${id})`);
    
    res.json({
      success: true,
      message: 'Entreprise mise à jour avec succès',
      data: entrepriseMiseAJour
    });
    
  } catch (error) {
    logger.error('Erreur lors de la mise à jour de l\'entreprise:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/v1/entreprises/{id}:
 *   delete:
 *     summary: Supprime une entreprise
 *     tags: [Entreprises]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Entreprise supprimée avec succès
 *       404:
 *         description: Entreprise non trouvée
 *       409:
 *         description: Impossible de supprimer (contraintes)
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
    
    const entreprise = await Entreprise.findById(parseInt(id));
    if (!entreprise) {
      return res.status(404).json({
        success: false,
        message: 'Entreprise non trouvée'
      });
    }
    
    // Vérifier s'il y a des documents liés
    const documentsLies = await Entreprise.query(
      'SELECT COUNT(*) FROM documents WHERE entreprise_id = $1',
      [parseInt(id)]
    );
    
    if (parseInt(documentsLies.rows[0].count) > 0) {
      return res.status(409).json({
        success: false,
        message: 'Impossible de supprimer cette entreprise car elle a des documents associés'
      });
    }
    
    // Sauvegarde dans la corbeille avant suppression
    try {
      await Entreprise.query(
        'INSERT INTO corbeille (table_source, data, utilisateur) VALUES ($1, $2, $3)',
        [
          'entreprises',
          JSON.stringify(entreprise),
          req.user ? req.user.username : null
        ]
      );
    } catch (corbeilleError) {
      logger.error('Erreur lors de la sauvegarde dans la corbeille:', corbeilleError);
    }
    const supprimee = await Entreprise.delete(parseInt(id));
    if (supprimee) {
      logger.info(`Entreprise supprimée: ${entreprise.nom} (ID: ${id})`);
      res.json({
        success: true,
        message: 'Entreprise supprimée avec succès'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression'
      });
    }
    
  } catch (error) {
    logger.error('Erreur lors de la suppression de l\'entreprise:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/v1/entreprises/{id}/prochain-numero:
 *   post:
 *     summary: Génère le prochain numéro de facture pour une entreprise
 *     tags: [Entreprises]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'entreprise
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categorie_facture:
 *                 type: string
 *                 enum: [transport, non-transport]
 *                 description: Catégorie de facture
 *     responses:
 *       200:
 *         description: Numéro généré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 numero:
 *                   type: string
 *                   description: Numéro de facture généré
 *       404:
 *         description: Entreprise non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.post('/:id/prochain-numero', async (req, res) => {
  try {
    const { id } = req.params;
    const { categorie_facture = 'transport' } = req.body;

    // Vérifier que l'entreprise existe
    const entreprise = await Entreprise.findById(id);
    if (!entreprise) {
      return res.status(404).json({
        success: false,
        message: 'Entreprise non trouvée'
      });
    }

    // Générer le numéro de facture
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Format: HRAKIN/0001/T/01/2024 pour transport ou HRAKIN/0001/01/2024 pour non-transport
    const categorieCode = categorie_facture === 'transport' ? 'T' : '';
    
    // Récupérer le préfixe de l'entreprise ou utiliser un défaut
    const prefix = entreprise.prefix_facture || 'HRAKIN';
    
    // Compter les factures existantes pour cette entreprise, catégorie et mois
    // Utiliser la connexion existante du BaseModel
    const query = `
      SELECT COUNT(*) as count 
      FROM documents 
      WHERE entreprise_id = $1 
      AND categorie_facture = $2 
      AND type_document = 'facture'
      AND EXTRACT(YEAR FROM date_emission) = $3 
      AND EXTRACT(MONTH FROM date_emission) = $4
    `;
    
    const result = await Entreprise.query(query, [id, categorie_facture, currentYear, new Date().getMonth() + 1]);
    const count = parseInt(result.rows[0].count) + 1;
    
    // Formater le numéro séquentiel sur 4 chiffres
    const numeroSequentiel = String(count).padStart(4, '0');
    
    // Générer le numéro final selon la catégorie
    let numeroFinal;
    if (categorie_facture === 'transport') {
      numeroFinal = `${prefix}/${numeroSequentiel}/${categorieCode}/${currentMonth}/${currentYear}`;
    } else {
      // Pour non-transport, pas de code catégorie
      numeroFinal = `${prefix}/${numeroSequentiel}/${currentMonth}/${currentYear}`;
    }
    
    logger.info(`Numéro généré pour entreprise ${id}: ${numeroFinal}`);
    
    res.json({
      success: true,
      numero: numeroFinal
    });
    
  } catch (error) {
    logger.error('Erreur lors de la génération du numéro:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;