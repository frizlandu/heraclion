const Joi = require('joi');

/**
 * Schémas de validation pour les stocks
 */

const TYPE_MOUVEMENT = ['ENTREE', 'SORTIE', 'AJUSTEMENT', 'INVENTAIRE'];
const UNITE_MESURE = ['UNITE', 'KG', 'LITRE', 'METRE', 'M2', 'M3', 'TONNE', 'CAISSE', 'PALETTE'];

// Validation pour création d'article
const createArticleSchema = Joi.object({
  code_article: Joi.string().min(1).max(50).required(),
  nom: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(1000).optional(),
  famille: Joi.string().max(50).optional(),
  
  // Unités et quantités
  unite_mesure: Joi.string().valid(...UNITE_MESURE).default('UNITE'),
  stock_minimum: Joi.number().precision(2).min(0).default(0),
  stock_maximum: Joi.number().precision(2).min(0).optional(),
  stock_initial: Joi.number().precision(2).min(0).default(0),
  
  // Prix
  prix_achat_unitaire: Joi.number().precision(2).min(0).optional(),
  prix_vente_unitaire: Joi.number().precision(2).min(0).optional(),
  taux_marge: Joi.number().precision(2).min(0).max(1000).optional(),
  
  // Localisation
  emplacement: Joi.string().max(100).optional(),
  zone_stockage: Joi.string().max(50).optional(),
  
  // Fournisseur principal
  fournisseur_principal_id: Joi.number().integer().positive().optional(),
  reference_fournisseur: Joi.string().max(50).optional(),
  delai_livraison: Joi.number().integer().min(0).max(365).optional(),
  
  // Configuration
  suivi_lot: Joi.boolean().default(false),
  date_peremption: Joi.boolean().default(false),
  actif: Joi.boolean().default(true),
  
  // Informations complémentaires
  poids: Joi.number().precision(3).min(0).optional(),
  dimensions: Joi.string().max(100).optional(),
  code_barre: Joi.string().max(50).optional(),
  
  entreprise_id: Joi.number().integer().positive().required()
});

// Validation pour mise à jour d'article
const updateArticleSchema = Joi.object({
  nom: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(1000).optional(),
  famille: Joi.string().max(50).optional(),
  
  unite_mesure: Joi.string().valid(...UNITE_MESURE).optional(),
  stock_minimum: Joi.number().precision(2).min(0).optional(),
  stock_maximum: Joi.number().precision(2).min(0).optional(),
  
  prix_achat_unitaire: Joi.number().precision(2).min(0).optional(),
  prix_vente_unitaire: Joi.number().precision(2).min(0).optional(),
  taux_marge: Joi.number().precision(2).min(0).max(1000).optional(),
  
  emplacement: Joi.string().max(100).optional(),
  zone_stockage: Joi.string().max(50).optional(),
  
  fournisseur_principal_id: Joi.number().integer().positive().optional(),
  reference_fournisseur: Joi.string().max(50).optional(),
  delai_livraison: Joi.number().integer().min(0).max(365).optional(),
  
  suivi_lot: Joi.boolean().optional(),
  date_peremption: Joi.boolean().optional(),
  actif: Joi.boolean().optional(),
  
  poids: Joi.number().precision(3).min(0).optional(),
  dimensions: Joi.string().max(100).optional(),
  code_barre: Joi.string().max(50).optional()
}).min(1);

// Validation pour mouvement de stock
const mouvementStockSchema = Joi.object({
  article_id: Joi.number().integer().positive().required(),
  type_mouvement: Joi.string().valid(...TYPE_MOUVEMENT).required(),
  quantite: Joi.number().precision(2).positive().required(),
  prix_unitaire: Joi.number().precision(2).min(0).optional(),
  
  // Informations complémentaires
  motif: Joi.string().max(500).required(),
  lot_numero: Joi.string().max(50).optional(),
  date_peremption: Joi.date().optional(),
  
  // Localisation
  emplacement_origine: Joi.string().max(100).optional(),
  emplacement_destination: Joi.string().max(100).optional(),
  
  // Référence document
  document_reference: Joi.string().max(100).optional(),
  document_type: Joi.string().valid('FACTURE', 'PROFORMA', 'COMMANDE', 'INVENTAIRE').optional(),
  
  // Responsable
  responsable_id: Joi.number().integer().positive().required(),
  
  entreprise_id: Joi.number().integer().positive().required()
});

// Validation pour inventaire
const inventaireSchema = Joi.object({
  nom_inventaire: Joi.string().min(2).max(100).required(),
  date_inventaire: Joi.date().default(() => new Date()),
  commentaire: Joi.string().max(1000).optional(),
  
  // Articles à inventorier
  articles: Joi.array().items(
    Joi.object({
      article_id: Joi.number().integer().positive().required(),
      quantite_theorique: Joi.number().precision(2).min(0).required(),
      quantite_physique: Joi.number().precision(2).min(0).required(),
      emplacement: Joi.string().max(100).optional(),
      lot_numero: Joi.string().max(50).optional(),
      date_peremption: Joi.date().optional(),
      commentaire: Joi.string().max(500).optional()
    })
  ).min(1).required(),
  
  responsable_id: Joi.number().integer().positive().required(),
  entreprise_id: Joi.number().integer().positive().required()
});

// Validation pour recherche d'articles
const searchArticlesSchema = Joi.object({
  code_article: Joi.string().max(50).optional(),
  nom: Joi.string().max(100).optional(),
  famille: Joi.string().max(50).optional(),
  fournisseur_id: Joi.number().integer().positive().optional(),
  actif: Joi.boolean().optional(),
  stock_critique: Joi.boolean().optional(), // Stock <= stock_minimum
  avec_stock_zero: Joi.boolean().default(true),
  
  limit: Joi.number().integer().min(1).max(1000).default(100),
  offset: Joi.number().integer().min(0).default(0),
  sort_by: Joi.string().valid('code_article', 'nom', 'famille', 'stock_actuel', 'created_at').default('nom'),
  sort_order: Joi.string().valid('ASC', 'DESC').default('ASC')
});

// Validation pour recherche de mouvements
const searchMouvementsSchema = Joi.object({
  article_id: Joi.number().integer().positive().optional(),
  type_mouvement: Joi.string().valid(...TYPE_MOUVEMENT).optional(),
  date_debut: Joi.date().optional(),
  date_fin: Joi.date().min(Joi.ref('date_debut')).optional(),
  responsable_id: Joi.number().integer().positive().optional(),
  
  limit: Joi.number().integer().min(1).max(500).default(100),
  offset: Joi.number().integer().min(0).default(0),
  sort_by: Joi.string().valid('created_at', 'quantite', 'type_mouvement').default('created_at'),
  sort_order: Joi.string().valid('ASC', 'DESC').default('DESC')
});

// Validation pour ajustement de stock
const ajustementStockSchema = Joi.object({
  article_id: Joi.number().integer().positive().required(),
  nouvelle_quantite: Joi.number().precision(2).min(0).required(),
  motif: Joi.string().max(500).required(),
  force_ajustement: Joi.boolean().default(false), // Ignorer les validations
  responsable_id: Joi.number().integer().positive().required(),
  entreprise_id: Joi.number().integer().positive().required()
});

// Validation pour alerte stock
const alerteStockSchema = Joi.object({
  article_id: Joi.number().integer().positive().optional(),
  type_alerte: Joi.string().valid('STOCK_CRITIQUE', 'STOCK_ZERO', 'PEREMPTION', 'INVENTAIRE').optional(),
  niveau_priorite: Joi.string().valid('FAIBLE', 'MOYENNE', 'HAUTE', 'CRITIQUE').default('MOYENNE'),
  date_debut: Joi.date().optional(),
  date_fin: Joi.date().min(Joi.ref('date_debut')).optional(),
  resolu: Joi.boolean().optional(),
  
  limit: Joi.number().integer().min(1).max(200).default(50),
  offset: Joi.number().integer().min(0).default(0)
});

// Validation pour import/export stock
const importStockSchema = Joi.object({
  format: Joi.string().valid('CSV', 'EXCEL').default('CSV'),
  fichier: Joi.object({
    originalname: Joi.string().required(),
    mimetype: Joi.string().valid(
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ).required(),
    size: Joi.number().max(10 * 1024 * 1024).required() // 10MB max
  }).required(),
  
  // Options d'import
  remplacer_existants: Joi.boolean().default(false),
  ignorer_erreurs: Joi.boolean().default(false),
  simuler_import: Joi.boolean().default(false),
  
  entreprise_id: Joi.number().integer().positive().required()
});

// Validation pour valorisation du stock
const valorisationStockSchema = Joi.object({
  date_valorisation: Joi.date().default(() => new Date()),
  methode_valorisation: Joi.string().valid('FIFO', 'LIFO', 'CMP', 'DERNIER_PRIX').default('CMP'),
  famille: Joi.string().max(50).optional(),
  inclure_stocks_zero: Joi.boolean().default(false),
  
  format_export: Joi.string().valid('JSON', 'CSV', 'EXCEL', 'PDF').default('JSON'),
  entreprise_id: Joi.number().integer().positive().required()
});

// Validation pour transfert entre emplacements
const transfertEmplacementSchema = Joi.object({
  article_id: Joi.number().integer().positive().required(),
  quantite: Joi.number().precision(2).positive().required(),
  emplacement_origine: Joi.string().max(100).required(),
  emplacement_destination: Joi.string().max(100).required(),
  motif: Joi.string().max(500).required(),
  
  lot_numero: Joi.string().max(50).optional(),
  responsable_id: Joi.number().integer().positive().required(),
  entreprise_id: Joi.number().integer().positive().required()
});

module.exports = {
  createArticleSchema,
  updateArticleSchema,
  mouvementStockSchema,
  inventaireSchema,
  searchArticlesSchema,
  searchMouvementsSchema,
  ajustementStockSchema,
  alerteStockSchema,
  importStockSchema,
  valorisationStockSchema,
  transfertEmplacementSchema,
  TYPE_MOUVEMENT,
  UNITE_MESURE
};