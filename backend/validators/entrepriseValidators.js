const Joi = require('joi');

/**
 * Schémas de validation pour les entreprises
 */

const TYPE_ENTREPRISE = ['TRANSPORT', 'NON_TRANSPORT'];

// Validation pour création d'entreprise
const createEntrepriseSchema = Joi.object({
  nom: Joi.string().min(2).max(100).required(),
  logo: Joi.string().max(255).optional(),
  telephone: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)\.]{8,20}$/).optional(),
  adresse: Joi.string().max(1000).optional(),
  reference: Joi.string().max(100).optional(),
  autres_coordonnees: Joi.string().max(1000).optional(),
  prefix_facture: Joi.string().min(2).max(20).required(),
  type_entreprise: Joi.string().valid(...TYPE_ENTREPRISE).required(),
  
  // Informations légales
  siret: Joi.string().pattern(/^[0-9]{14}$/).optional(),
  code_ape: Joi.string().pattern(/^[0-9]{4}[A-Z]$/).optional(),
  numero_tva: Joi.string().max(20).optional(),
  
  // Informations bancaires
  iban: Joi.string().pattern(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/).optional(),
  bic: Joi.string().pattern(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/).optional(),
  banque: Joi.string().max(100).optional(),
  
  // Configuration
  taux_tva_defaut: Joi.number().precision(2).min(0).max(100).default(20),
  delai_paiement_defaut: Joi.number().integer().min(0).max(365).default(30),
  conditions_reglement: Joi.string().max(500).optional(),
  
  // Email et notifications
  email_principal: Joi.string().email().max(100).optional(),
  email_comptabilite: Joi.string().email().max(100).optional(),
  
  actif: Joi.boolean().default(true)
});

// Validation pour mise à jour d'entreprise
const updateEntrepriseSchema = Joi.object({
  nom: Joi.string().min(2).max(100).optional(),
  logo: Joi.string().max(255).optional(),
  telephone: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)\.]{8,20}$/).optional(),
  adresse: Joi.string().max(1000).optional(),
  reference: Joi.string().max(100).optional(),
  autres_coordonnees: Joi.string().max(1000).optional(),
  prefix_facture: Joi.string().min(2).max(20).optional(),
  type_entreprise: Joi.string().valid(...TYPE_ENTREPRISE).optional(),
  
  siret: Joi.string().pattern(/^[0-9]{14}$/).optional(),
  code_ape: Joi.string().pattern(/^[0-9]{4}[A-Z]$/).optional(),
  numero_tva: Joi.string().max(20).optional(),
  
  iban: Joi.string().pattern(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/).optional(),
  bic: Joi.string().pattern(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/).optional(),
  banque: Joi.string().max(100).optional(),
  
  taux_tva_defaut: Joi.number().precision(2).min(0).max(100).optional(),
  delai_paiement_defaut: Joi.number().integer().min(0).max(365).optional(),
  conditions_reglement: Joi.string().max(500).optional(),
  
  email_principal: Joi.string().email().max(100).optional(),
  email_comptabilite: Joi.string().email().max(100).optional(),
  
  actif: Joi.boolean().optional()
}).min(1); // Au moins un champ doit être fourni

// Validation pour upload de logo
const uploadLogoSchema = Joi.object({
  logo: Joi.object({
    originalname: Joi.string().required(),
    mimetype: Joi.string().valid('image/jpeg', 'image/png', 'image/gif', 'image/webp').required(),
    size: Joi.number().max(5 * 1024 * 1024).required() // 5MB max
  }).required()
});

// Validation pour recherche d'entreprises
const searchEntreprisesSchema = Joi.object({
  nom: Joi.string().max(100).optional(),
  type_entreprise: Joi.string().valid(...TYPE_ENTREPRISE).optional(),
  actif: Joi.boolean().optional(),
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0),
  sort_by: Joi.string().valid('nom', 'type_entreprise', 'created_at').default('nom'),
  sort_order: Joi.string().valid('ASC', 'DESC').default('ASC')
});

// Validation pour configuration d'entreprise
const configEntrepriseSchema = Joi.object({
  // Templates de documents
  template_facture: Joi.string().max(50).optional(),
  template_proforma: Joi.string().max(50).optional(),
  
  // Numérotation
  prefixe_facture_transport: Joi.string().max(20).optional(),
  prefixe_facture_non_transport: Joi.string().max(20).optional(),
  prefixe_proforma_transport: Joi.string().max(20).optional(),
  prefixe_proforma_non_transport: Joi.string().max(20).optional(),
  
  // Paramètres de calcul
  inclure_frais_admin_dans_tva: Joi.boolean().default(true),
  arrondir_totaux: Joi.boolean().default(true),
  precision_decimales: Joi.number().integer().min(0).max(4).default(2),
  
  // Notifications
  notification_facture_creee: Joi.boolean().default(true),
  notification_facture_payee: Joi.boolean().default(true),
  notification_facture_echeance: Joi.boolean().default(true),
  delai_notification_echeance: Joi.number().integer().min(1).max(30).default(7),
  
  // Sauvegarde
  sauvegarde_automatique: Joi.boolean().default(true),
  frequence_sauvegarde: Joi.string().valid('quotidienne', 'hebdomadaire', 'mensuelle').default('quotidienne'),
  conserver_sauvegardes: Joi.number().integer().min(1).max(365).default(30)
});

// Validation pour statistiques d'entreprise
const entrepriseStatsSchema = Joi.object({
  date_debut: Joi.date().optional(),
  date_fin: Joi.date().min(Joi.ref('date_debut')).optional(),
  inclure_factures: Joi.boolean().default(true),
  inclure_proformas: Joi.boolean().default(true),
  grouper_par: Joi.string().valid('mois', 'trimestre', 'annee').default('mois'),
  comparer_periode_precedente: Joi.boolean().default(false)
});

// Validation pour duplication d'entreprise
const duplicateEntrepriseSchema = Joi.object({
  nouveau_nom: Joi.string().min(2).max(100).required(),
  nouveau_prefix: Joi.string().min(2).max(20).required(),
  copier_configuration: Joi.boolean().default(true),
  copier_templates: Joi.boolean().default(true),
  copier_coordonnees: Joi.boolean().default(false)
});

module.exports = {
  createEntrepriseSchema,
  updateEntrepriseSchema,
  uploadLogoSchema,
  searchEntreprisesSchema,
  configEntrepriseSchema,
  entrepriseStatsSchema,
  duplicateEntrepriseSchema,
  TYPE_ENTREPRISE
};