const express = require('express');
const BaseModel = require('../models/BaseModel');
const BaseModelBase = require('../models/base/BaseModel');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /dashboard/alerts:
 *   get:
 *     summary: Récupère les alertes pour le dashboard (stock, factures, etc.)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Alertes récupérées avec succès
 */
router.get('/alerts', async (req, res) => {
  try {
    // Alertes de stock faible
    const StockModel = new BaseModel('stocks');
    const articlesEnAlerte = await StockModel.findAll(
      'quantite_stock <= quantite_min',
      [],
      'reference ASC'
    );
    const alertesStock = articlesEnAlerte.map(article => ({
      type: 'Stock',
      message: `Stock faible pour l'article ${article.designation} (réf: ${article.reference})`,
      description: `Quantité en stock: ${article.quantite_stock}, minimum requis: ${article.quantite_min}`,
      date: article.updated_at || article.created_at,
      deficit: article.quantite_min - article.quantite_stock,
      alerte_critique: article.quantite_stock === 0
    }));
    // (Vous pouvez ajouter d'autres types d'alertes ici si besoin)
    res.json({
      success: true,
      data: alertesStock,
      total: alertesStock.length
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des alertes dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Récupère les statistiques globales pour le dashboard
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Statistiques récupérées avec succès
 */
router.get('/stats', async (req, res) => {
  try {
    // Modèles pour chaque table concernée
  const FacturesNonTransportModel = new BaseModelBase('factures_non_transport');
  const FacturesTransportModel = new BaseModelBase('factures_transport');
    const ProformasNonTransportModel = new BaseModelBase('items_proforma_non_transport');
    const ProformasTransportModel = new BaseModelBase('items_proforma_transport');
  const ClientsModel = new BaseModelBase('clients');
  const EntreprisesModel = new BaseModelBase('entreprises');
  const CaisseModel = new BaseModelBase('caisse');
  const StockModel = new BaseModelBase('stocks');

  let totalFacturesNonTransport = 0, totalFacturesTransport = 0, totalProformasNonTransport = 0, totalProformasTransport = 0, totalClients = 0, totalEntreprises = 0;
  let montantTotalFacturesNonTransport = 0, montantTotalFacturesTransport = 0;
  let soldeCaisse = 0;
  let total_stock_articles = 0;
    // Calcul du solde caisse (somme des montants)
    try {
      const resSolde = await CaisseModel.query('SELECT COALESCE(SUM(montant),0) as solde FROM caisse');
      soldeCaisse = parseFloat(resSolde.rows[0]?.solde || 0);
    } catch (err) {
      if (err.code !== '42P01') throw err;
    }
    try {
      totalFacturesNonTransport = await FacturesNonTransportModel.count();
      // Calcul du CA pour factures_non_transport
  const resCA1 = await FacturesNonTransportModel.query('SELECT COALESCE(SUM(total_general),0) as total FROM factures_non_transport');
  montantTotalFacturesNonTransport = parseFloat(resCA1.rows[0]?.total || 0);
    } catch (err) {
      if (err.code !== '42P01') throw err;
    }
    try {
      totalFacturesTransport = await FacturesTransportModel.count();
      // Calcul du CA pour factures_transport
  const resCA2 = await FacturesTransportModel.query('SELECT COALESCE(SUM(total_general),0) as total FROM factures_transport');
  montantTotalFacturesTransport = parseFloat(resCA2.rows[0]?.total || 0);
    } catch (err) {
      if (err.code !== '42P01') throw err;
    }
    try {
      totalProformasNonTransport = await ProformasNonTransportModel.count();
    } catch (err) {
      if (err.code !== '42P01') throw err;
    }
    try {
      totalProformasTransport = await ProformasTransportModel.count();
    } catch (err) {
      if (err.code !== '42P01') throw err;
    }
    try {
      totalClients = await ClientsModel.count();
    } catch (err) {
      if (err.code !== '42P01') throw err;
    }
    try {
      totalEntreprises = await EntreprisesModel.count();
    } catch (err) {
      if (err.code !== '42P01') throw err;
    }
    // Comptage des articles en stock (essayer 'stocks' puis 'stock' si nécessaire)
    try {
      const stockRes = await StockModel.query('SELECT COUNT(*) as count FROM stocks');
      total_stock_articles = parseInt(stockRes.rows[0]?.count || 0, 10);
    } catch (err) {
      try {
        const stockRes2 = await StockModel.query('SELECT COUNT(*) as count FROM stock');
        total_stock_articles = parseInt(stockRes2.rows[0]?.count || 0, 10);
      } catch (err2) {
        // ignore if neither table exists or another error
        total_stock_articles = 0;
      }
    }
    const montant_total_factures = montantTotalFacturesNonTransport + montantTotalFacturesTransport;

    // Fallback: si les tables factures/proformas spécifiques sont vides (ex: schéma simplifié),
    // interroger la table `documents` pour obtenir les totaux réels.
    const DocumentModel = require('../models/DocumentModel');
    let totalFactures = (totalFacturesNonTransport || 0) + (totalFacturesTransport || 0);
    let totalProformas = (totalProformasNonTransport || 0) + (totalProformasTransport || 0);
    let montantTotalFacturesGlobal = montant_total_factures;
    let total_documents = 0;

    try {
      if (!totalFactures || totalFactures === 0) {
        totalFactures = await DocumentModel.count('type_document = $1', ['facture']);
      }
    } catch (err) {
      // ignore fallback errors
    }

    try {
      if (!totalProformas || totalProformas === 0) {
        totalProformas = await DocumentModel.count('type_document = $1', ['proforma']);
      }
    } catch (err) {
      // ignore fallback errors
    }

    try {
      if (!montantTotalFacturesGlobal || montantTotalFacturesGlobal === 0) {
        const resSum = await DocumentModel.query('SELECT COALESCE(SUM(montant_ttc),0) as total FROM documents WHERE type_document = $1', ['facture']);
        montantTotalFacturesGlobal = parseFloat(resSum.rows[0]?.total || 0);
      }
    } catch (err) {
      // ignore fallback errors
    }

      // Count total documents for the Documents statscard
      try {
        total_documents = await DocumentModel.count();
      } catch (err) {
        total_documents = 0;
      }

      // Count invoices 'en attente' (brouillon ou envoyé)
      let factures_en_attente = 0;
      try {
        const attentesResult = await DocumentModel.query("SELECT COUNT(*) as count FROM documents WHERE type_document = $1 AND statut IN ('brouillon','envoyé')", ['facture']);
        factures_en_attente = parseInt(attentesResult.rows[0]?.count || 0, 10);
      } catch (err) {
        factures_en_attente = 0;
      }

    res.json({
      success: true,
      data: {
        totalFacturesNonTransport,
        totalFacturesTransport,
        totalProformasNonTransport,
        totalProformasTransport,
        // Compatibilité frontend: totaux globaux
        totalFactures,
        totalProformas,
  total_stock_articles,
  totalStockArticles: total_stock_articles,
        totalClients,
        totalEntreprises,
        montant_total_factures: montantTotalFacturesGlobal,
  factures_en_attente,
        solde_caisse: soldeCaisse,
          // Nombre total d'entrées dans la table documents
          total_documents,
          totalDocuments: total_documents,
        date: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des stats dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /dashboard/recent-activities:
 *   get:
 *     summary: Récupère les activités récentes pour le dashboard
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Activités récentes récupérées avec succès
 */
router.get('/recent-activities', async (req, res) => {
  try {
    // Modèles pour chaque table concernée
  const FacturesNonTransportModel = new BaseModelBase('factures_non_transport');
  const FacturesTransportModel = new BaseModelBase('factures_transport');
    const ProformasTransportModel = new BaseModelBase('items_proforma_transport');
    const StockModel = new BaseModelBase('stocks');
    const CaisseModel = new BaseModelBase('caisse');

    let recentFacturesNonTransport = [], recentFacturesTransport = [], recentProformasTransport = [], recentStocks = [], recentCaisse = [];
    try {
      recentFacturesNonTransport = await FacturesNonTransportModel.findAll({ limit: 5, orderBy: 'created_at', orderDirection: 'DESC' });
    } catch (err) { if (err.code !== '42P01') throw err; }
    try {
      recentFacturesTransport = await FacturesTransportModel.findAll({ limit: 5, orderBy: 'created_at', orderDirection: 'DESC' });
    } catch (err) { if (err.code !== '42P01') throw err; }
    try {
      recentProformasTransport = await ProformasTransportModel.findAll({ limit: 5, orderBy: 'date_item', orderDirection: 'DESC' });
    } catch (err) { if (err.code !== '42P01') throw err; }
    try {
      recentStocks = await StockModel.findAll({ limit: 5, orderBy: 'updated_at', orderDirection: 'DESC' });
    } catch (err) { if (err.code !== '42P01') throw err; }
    try {
      recentCaisse = await CaisseModel.findAll({ limit: 5, orderBy: 'date_operation', orderDirection: 'DESC' });
    } catch (err) { if (err.code !== '42P01') throw err; }

    const activities = [
      ...recentFacturesNonTransport.map(facture => ({
        type: 'Facture Non Transport',
        message: `Nouvelle facture (non transport) pour ${facture.client_id}`,
        date: facture.created_at
      })),
      ...recentFacturesTransport.map(facture => ({
        type: 'Facture Transport',
        message: `Nouvelle facture (transport) pour ${facture.client_id}`,
        date: facture.created_at
      })),
      ...recentProformasTransport.map(proforma => ({
        type: 'Proforma Transport',
        message: `Nouveau proforma (transport) pour ${proforma.proforma_transport_id}`,
        date: proforma.date_item
      })),
      ...recentStocks.map(stock => ({
        type: 'Stock',
        message: `Mise à jour du stock pour ${stock.designation || stock.reference}`,
        date: stock.updated_at || stock.created_at
      })),
      ...recentCaisse.map(op => ({
        type: 'Caisse',
        message: `Opération caisse : ${op.description || op.type_operation}`,
        date: op.date_operation || op.created_at
      })),
    ];

    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    const activitiesLimited = activities.slice(0, 10);

    res.json({
      success: true,
      data: activitiesLimited,
      total: activitiesLimited.length
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des activités récentes dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;