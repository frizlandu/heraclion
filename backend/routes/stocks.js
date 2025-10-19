/**
 * Routes pour la gestion du stock - Version corrigée avec ordre correct
 */
const express = require('express');
const router = express.Router();
const BaseModel = require('../models/BaseModel');
const { logger } = require('../utils/logger');
// Modèle Stock
const Stock = new BaseModel('stocks');

/**
 * @swagger
 * /api/v1/stocks/{id}:
 *   delete:
 *     summary: Supprime un article de stock
 *     tags: [Stock]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'article à supprimer
 *     responses:
 *       200:
 *         description: Article supprimé avec succès
 *       404:
 *         description: Article non trouvé
 */
// ...existing code...
// Route DELETE placée après l'initialisation de router
/**
 * @swagger
 * /api/v1/stocks/{id}:
 *   delete:
 *     summary: Supprime un article de stock
 *     tags: [Stock]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'article à supprimer
 *     responses:
 *       200:
 *         description: Article supprimé avec succès
 *       404:
 *         description: Article non trouvé
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID invalide'
      });
    }
    const article = await Stock.findById(parseInt(id));
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }
    // Sauvegarde dans la corbeille avant suppression
    try {
      await Stock.query(
        'INSERT INTO corbeille (table_source, data, utilisateur) VALUES ($1, $2, $3)',
        [
          'stocks',
          JSON.stringify(article),
          req.user ? req.user.username : null
        ]
      );
    } catch (corbeilleError) {
      logger.error('Erreur lors de la sauvegarde dans la corbeille:', corbeilleError);
      // On continue la suppression même si la sauvegarde échoue
    }
    await Stock.delete(parseInt(id));
    logger.info(`Article supprimé: ${article.reference} (ID: ${id})`);
    res.json({
      success: true,
      message: 'Article supprimé avec succès'
    });
  } catch (error) {
    logger.error('Erreur lors de la suppression de l\'article:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
 */

// ======= ROUTES SPÉCIFIQUES AVANT LES ROUTES AVEC PARAMÈTRES =======

/**
 * @swagger
 * /api/v1/stocks/alertes:
 *   get:
 *     summary: Récupère les articles en alerte de stock
 *     tags: [Stock]
 *     responses:
 *       200:
 *         description: Articles en alerte récupérés avec succès
 */
router.get('/alertes', async (req, res) => {
  try {
    const articlesEnAlerte = await Stock.findAll(
      'quantite_stock <= quantite_min',
      [],
      'reference ASC'
    );
    
    const alertesEnrichies = articlesEnAlerte.map(article => ({
      ...article,
      deficit: article.quantite_min - article.quantite_stock,
      alerte_critique: article.quantite_stock === 0
    }));
    
    logger.info(`${articlesEnAlerte.length} articles en alerte de stock`);
    
    res.json({
      success: true,
      data: alertesEnrichies,
      total: articlesEnAlerte.length
    });
    
  } catch (error) {
    logger.error('Erreur lors de la récupération des alertes de stock:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/v1/stocks/valorisation:
 *   get:
 *     summary: Récupère la valorisation du stock
 *     tags: [Stock]
 *     responses:
 *       200:
 *         description: Valorisation du stock calculée avec succès
 */
router.get('/valorisation', async (req, res) => {
  try {
    const valorisation = await Stock.query(`
      SELECT 
        COUNT(*) as nombre_articles,
        SUM(quantite_stock) as quantite_totale,
        SUM(quantite_stock * prix_achat) as valeur_achat,
        SUM(quantite_stock * prix_vente) as valeur_vente,
        SUM(quantite_stock * (prix_vente - prix_achat)) as marge_potentielle
      FROM stocks
    `);
    
    const stats = valorisation.rows[0];
    
    const result = {
      nombre_articles: parseInt(stats.nombre_articles),
      quantite_totale: parseInt(stats.quantite_totale || 0),
      valeur_achat: parseFloat(stats.valeur_achat || 0),
      valeur_vente: parseFloat(stats.valeur_vente || 0),
      marge_potentielle: parseFloat(stats.marge_potentielle || 0),
      taux_marge_moyen: stats.valeur_achat > 0 ? 
        ((parseFloat(stats.marge_potentielle || 0) / parseFloat(stats.valeur_achat)) * 100).toFixed(2) : 0
    };
    
    logger.info('Valorisation du stock calculée');
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    logger.error('Erreur lors du calcul de la valorisation du stock:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ======= ROUTES GÉNÉRIQUES =======

/**
 * @swagger
 * /api/v1/stocks:
 *   get:
 *     summary: Récupère la liste des articles en stock
 *     tags: [Stock]
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
 *         description: Recherche par référence ou désignation
 *       - in: query
 *         name: alerte
 *         schema:
 *           type: boolean
 *         description: Afficher seulement les articles en alerte stock
 *     responses:
 *       200:
 *         description: Liste des articles récupérée avec succès
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', alerte } = req.query;
    
    let whereClause = '';
    let params = [];
    
    // Construction de la clause WHERE
    const conditions = [];
    
    if (search) {
      conditions.push(`(reference ILIKE $${params.length + 1} OR designation ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }
    
    if (alerte === 'true') {
      conditions.push(`quantite_stock <= quantite_min`);
    }
    
    if (conditions.length > 0) {
      whereClause = conditions.join(' AND ');
    }
    
    const result = await Stock.findWithPagination({
      where: whereClause,
      params,
      orderBy: 'reference ASC',
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    // Ajouter un indicateur d'alerte pour chaque article
    result.data = result.data.map(article => ({
      ...article,
      alerte_stock: article.quantite_stock <= article.quantite_min,
      marge_unitaire: article.prix_vente - article.prix_achat,
      taux_marge: article.prix_achat > 0 ? ((article.prix_vente - article.prix_achat) / article.prix_achat * 100).toFixed(2) : 0
    }));
    
    logger.info(`Récupération de ${result.data.length} articles de stock (page ${page})`);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    logger.error('Erreur lors de la récupération du stock:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/v1/stocks/{id}:
 *   get:
 *     summary: Récupère un article par son ID
 *     tags: [Stock]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'article
 *     responses:
 *       200:
 *         description: Article récupéré avec succès
 *       404:
 *         description: Article non trouvé
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
    
    const article = await Stock.findById(parseInt(id));
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }
    
    // Enrichir avec des données calculées
    const articleEnrichi = {
      ...article,
      alerte_stock: article.quantite_stock <= article.quantite_min,
      marge_unitaire: article.prix_vente - article.prix_achat,
      taux_marge: article.prix_achat > 0 ? ((article.prix_vente - article.prix_achat) / article.prix_achat * 100).toFixed(2) : 0,
      valeur_stock: article.quantite_stock * article.prix_achat
    };
    
    logger.info(`Récupération de l'article ${article.reference} (ID: ${id})`);
    
    res.json({
      success: true,
      data: articleEnrichi
    });
    
  } catch (error) {
    logger.error('Erreur lors de la récupération de l\'article:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/v1/stocks:
 *   post:
 *     summary: Crée un nouvel article de stock
 *     tags: [Stock]
 */
router.post('/', async (req, res) => {
  try {
    const {
      reference,
      designation,
      quantite_stock,
      quantite_min = 0,
      prix_achat,
      prix_vente
    } = req.body;
    
    // Validation basique
    if (!reference || !designation || quantite_stock === undefined || prix_achat === undefined || prix_vente === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Référence, désignation, quantité en stock, prix d\'achat et prix de vente sont requis'
      });
    }
    
    if (quantite_stock < 0 || prix_achat < 0 || prix_vente < 0) {
      return res.status(400).json({
        success: false,
        message: 'Les quantités et prix ne peuvent pas être négatifs'
      });
    }
    
    // Vérifier l'unicité de la référence
    const articleExistant = await Stock.findOne('reference = $1', [reference]);
    if (articleExistant) {
      return res.status(409).json({
        success: false,
        message: 'Un article avec cette référence existe déjà'
      });
    }
    
    const nouvelArticle = await Stock.create({
      reference,
      designation,
      quantite_stock: parseInt(quantite_stock),
      quantite_min: parseInt(quantite_min),
      prix_achat: parseFloat(prix_achat),
      prix_vente: parseFloat(prix_vente)
    });
    
    logger.info(`Nouvel article créé: ${nouvelArticle.reference} - ${nouvelArticle.designation} (ID: ${nouvelArticle.id})`);
    
    res.status(201).json({
      success: true,
      message: 'Article créé avec succès',
      data: nouvelArticle
    });
    
  } catch (error) {
    logger.error('Erreur lors de la création de l\'article:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Référence déjà utilisée'
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
 * /api/v1/stocks/{id}:
 *   put:
 *     summary: Met à jour un article de stock
 *     tags: [Stock]
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
    
    const articleExistant = await Stock.findById(parseInt(id));
    if (!articleExistant) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }
    
    const {
      reference,
      designation,
      quantite_stock,
      quantite_min,
      prix_achat,
      prix_vente
    } = req.body;
    
    // Si la référence est modifiée, vérifier l'unicité
    if (reference && reference !== articleExistant.reference) {
      const autreArticle = await Stock.findOne('reference = $1', [reference]);
      if (autreArticle && autreArticle.id !== parseInt(id)) {
        return res.status(409).json({
          success: false,
          message: 'Cette référence est déjà utilisée par un autre article'
        });
      }
    }
    
    // Validation des valeurs numériques
    if (quantite_stock !== undefined && quantite_stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'La quantité en stock ne peut pas être négative'
      });
    }
    
    if (prix_achat !== undefined && prix_achat < 0) {
      return res.status(400).json({
        success: false,
        message: 'Le prix d\'achat ne peut pas être négatif'
      });
    }
    
    if (prix_vente !== undefined && prix_vente < 0) {
      return res.status(400).json({
        success: false,
        message: 'Le prix de vente ne peut pas être négatif'
      });
    }
    
    const donneesModifiees = {};
    if (reference !== undefined) donneesModifiees.reference = reference;
    if (designation !== undefined) donneesModifiees.designation = designation;
    if (quantite_stock !== undefined) donneesModifiees.quantite_stock = parseInt(quantite_stock);
    if (quantite_min !== undefined) donneesModifiees.quantite_min = parseInt(quantite_min);
    if (prix_achat !== undefined) donneesModifiees.prix_achat = parseFloat(prix_achat);
    if (prix_vente !== undefined) donneesModifiees.prix_vente = parseFloat(prix_vente);
    
    const articleMisAJour = await Stock.update(parseInt(id), donneesModifiees);
    
    logger.info(`Article mis à jour: ${articleMisAJour.reference} (ID: ${id})`);
    
    res.json({
      success: true,
      message: 'Article mis à jour avec succès',
      data: articleMisAJour
    });
    
  } catch (error) {
    logger.error('Erreur lors de la mise à jour de l\'article:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/v1/stocks/{id}/mouvements:
 *   post:
 *     summary: Enregistre un mouvement de stock
 *     tags: [Stock]
 */
router.post('/:id/mouvements', async (req, res) => {
  try {
    const { id } = req.params;
    const { type_mouvement, quantite, motif, reference_document } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID invalide'
      });
    }
    
    const article = await Stock.findById(parseInt(id));
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }
    
    if (!type_mouvement || !quantite) {
      return res.status(400).json({
        success: false,
        message: 'Type de mouvement et quantité sont requis'
      });
    }
    
    if (!['entree', 'sortie', 'ajustement'].includes(type_mouvement)) {
      return res.status(400).json({
        success: false,
        message: 'Type de mouvement invalide'
      });
    }
    
    if (parseInt(quantite) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'La quantité doit être positive'
      });
    }
    
    // Calculer la nouvelle quantité
    let nouvelleQuantite = article.quantite_stock;
    
    switch (type_mouvement) {
      case 'entree':
        nouvelleQuantite += parseInt(quantite);
        break;
      case 'sortie':
        nouvelleQuantite -= parseInt(quantite);
        if (nouvelleQuantite < 0) {
          return res.status(400).json({
            success: false,
            message: 'Stock insuffisant pour cette sortie'
          });
        }
        break;
      case 'ajustement':
        nouvelleQuantite = parseInt(quantite);
        break;
    }
    
    // Mettre à jour le stock
    const articleMisAJour = await Stock.update(parseInt(id), {
      quantite_stock: nouvelleQuantite
    });
    
    logger.info(`Mouvement de stock: ${article.reference} - ${type_mouvement} de ${quantite} unités. Nouveau stock: ${nouvelleQuantite}`);
    
    res.json({
      success: true,
      message: 'Mouvement de stock enregistré avec succès',
      data: {
        article: articleMisAJour,
        mouvement: {
          type_mouvement,
          quantite: parseInt(quantite),
          ancienne_quantite: article.quantite_stock,
          nouvelle_quantite: nouvelleQuantite,
          motif,
          reference_document
        }
      }
    });
    
  } catch (error) {
    logger.error('Erreur lors de l\'enregistrement du mouvement de stock:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;