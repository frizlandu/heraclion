const Joi = require('joi');

/**
 * Schémas de validation pour les documents (factures et proformas)
 */

// Types de documents valides
const DOCUMENT_TYPES = ['TRANSPORT', 'NON_TRANSPORT'];
const STATUTS_FACTURE = ['NON_PAYE', 'PAYE', 'PARTIELLEMENT_PAYE', 'ANNULE'];
const STATUTS_PROFORMA = ['EN_ATTENTE', 'ACCEPTE', 'REFUSE', 'EXPIRE'];

// Schéma pour un item de document
const itemSchema = Joi.object({
  date_item: Joi.date().optional(),
  p_immat: Joi.string().max(100).optional(),
  item: Joi.string().max(100).optional(),
  designation: Joi.string().max(500).optional(),
  designation_article: Joi.string().max(500).optional(),
  ticket: Joi.string().max(100).optional(),
  tonnes: Joi.number().precision(3).min(0).optional(),
  total_poids: Joi.number().precision(3).min(0).optional(),
  quantite: Joi.number().integer().min(1).optional(),
  prix_unit: Joi.number().precision(2).min(0).required(),
  prix_total: Joi.number().precision(2).min(0).required(),
  ordre: Joi.number().integer().min(0).default(0)
});

// Schéma de base pour les documents
const baseDocumentSchema = {
  entreprise_id: Joi.number().integer().positive().required(),
  client_id: Joi.number().integer().positive().required(),
  frais_administratif: Joi.number().precision(2).min(0).default(0),
  tva: Joi.number().precision(2).min(0).optional(),
  total: Joi.number().precision(2).min(0).optional(),
  total_general: Joi.number().precision(2).min(0).optional(),
  items: Joi.array().items(itemSchema).min(1).required()
};

// Validation pour création de facture transport
const createFactureTransportSchema = Joi.object({
  ...baseDocumentSchema,
  date_facture: Joi.date().required(),
  bon_commande_client: Joi.string().max(100).optional(),
  statut: Joi.string().valid(...STATUTS_FACTURE).default('NON_PAYE'),
  date_echeance: Joi.date().greater('now').optional(),
  numero_facture: Joi.string().max(100).optional() // Généré automatiquement si non fourni
});

// Validation pour création de facture non transport
const createFactureNonTransportSchema = Joi.object({
  ...baseDocumentSchema,
  date_facture: Joi.date().required(),
  statut: Joi.string().valid(...STATUTS_FACTURE).default('NON_PAYE'),
  date_echeance: Joi.date().greater('now').optional(),
  numero_facture: Joi.string().max(100).optional()
});

// Validation pour création de proforma transport
const createProformaTransportSchema = Joi.object({
  ...baseDocumentSchema,
  date_proforma: Joi.date().required(),
  appel_offre_client: Joi.string().max(100).optional(),
  statut: Joi.string().valid(...STATUTS_PROFORMA).default('EN_ATTENTE'),
  date_expiration: Joi.date().greater('now').optional(),
  numero_proforma: Joi.string().max(100).optional()
});

// Validation pour création de proforma non transport
const createProformaNonTransportSchema = Joi.object({
  ...baseDocumentSchema,
  date_proforma: Joi.date().required(),
  statut: Joi.string().valid(...STATUTS_PROFORMA).default('EN_ATTENTE'),
  date_expiration: Joi.date().greater('now').optional(),
  numero_proforma: Joi.string().max(100).optional()
});

// Validation pour mise à jour de document (champs optionnels)
const updateDocumentSchema = Joi.object({
  client_id: Joi.number().integer().positive().optional(),
  frais_administratif: Joi.number().precision(2).min(0).optional(),
  tva: Joi.number().precision(2).min(0).optional(),
  total: Joi.number().precision(2).min(0).optional(),
  total_general: Joi.number().precision(2).min(0).optional(),
  statut: Joi.string().optional(),
  bon_commande_client: Joi.string().max(100).optional(),
  appel_offre_client: Joi.string().max(100).optional(),
  date_echeance: Joi.date().optional(),
  date_expiration: Joi.date().optional(),
  items: Joi.array().items(itemSchema).optional()
}).min(1); // Au moins un champ doit être fourni

// Validation pour mise à jour du statut uniquement
const updateStatutSchema = Joi.object({
  statut: Joi.string().required()
});

// Validation pour recherche de documents
const searchDocumentsSchema = Joi.object({
  entreprise_id: Joi.number().integer().positive().optional(),
  client_id: Joi.number().integer().positive().optional(),
  statut: Joi.string().optional(),
  date_debut: Joi.date().optional(),
  date_fin: Joi.date().min(Joi.ref('date_debut')).optional(),
  numero: Joi.string().max(100).optional(),
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0),
  sort_by: Joi.string().valid('date_facture', 'date_proforma', 'numero_facture', 'numero_proforma', 'total_general', 'created_at').default('created_at'),
  sort_order: Joi.string().valid('ASC', 'DESC').default('DESC')
});

// Validation pour conversion proforma en facture
const convertProformaSchema = Joi.object({
  date_facture: Joi.date().default(() => new Date()),
  date_echeance: Joi.date().optional(),
  bon_commande_client: Joi.string().max(100).optional()
});

// Validation pour duplication de document
const duplicateDocumentSchema = Joi.object({
  nouvelle_date: Joi.date().default(() => new Date()),
  nouveau_client_id: Joi.number().integer().positive().optional()
});

// Validation pour génération PDF
const generatePdfSchema = Joi.object({
  template: Joi.string().valid('standard', 'compact', 'detaille').default('standard'),
  inclure_logo: Joi.boolean().default(true),
  inclure_conditions: Joi.boolean().default(true),
  langue: Joi.string().valid('fr', 'en').default('fr')
});

// Validation pour envoi par email
const sendEmailSchema = Joi.object({
  destinataire: Joi.string().email().optional(), // Si non fourni, utilise l'email du client
  cc: Joi.array().items(Joi.string().email()).optional(),
  objet_personnalise: Joi.string().max(200).optional(),
  message_personnalise: Joi.string().max(1000).optional(),
  inclure_pdf: Joi.boolean().default(true)
});

// Validation des paramètres d'ID
const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

// Validation pour les filtres de rapport
const rapportFiltersSchema = Joi.object({
  entreprise_id: Joi.number().integer().positive().optional(),
  date_debut: Joi.date().required(),
  date_fin: Joi.date().min(Joi.ref('date_debut')).required(),
  type_document: Joi.string().valid('factures', 'proformas', 'tous').default('tous'),
  statut: Joi.string().optional(),
  grouper_par: Joi.string().valid('mois', 'client', 'entreprise', 'statut').default('mois'),
  inclure_details: Joi.boolean().default(false)
});

module.exports = {
  // Schémas de création
  createFactureTransportSchema,
  createFactureNonTransportSchema,
  createProformaTransportSchema,
  createProformaNonTransportSchema,
  
  // Schémas de mise à jour
  updateDocumentSchema,
  updateStatutSchema,
  
  // Schémas de recherche et filtrage
  searchDocumentsSchema,
  rapportFiltersSchema,
  
  // Schémas d'actions
  convertProformaSchema,
  duplicateDocumentSchema,
  generatePdfSchema,
  sendEmailSchema,
  
  // Schémas utilitaires
  idParamSchema,
  itemSchema,
  
  // Constantes
  DOCUMENT_TYPES,
  STATUTS_FACTURE,
  STATUTS_PROFORMA
};