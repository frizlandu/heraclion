const Joi = require('joi');

/**
 * Schémas de validation pour la comptabilité
 */

const TYPE_ECRITURE = ['DEBIT', 'CREDIT'];
const TYPE_JOURNAL = ['VENTE', 'ACHAT', 'BANQUE', 'CAISSE', 'OPERATIONS_DIVERSES', 'REPORTS_A_NOUVEAU'];
const STATUT_ECRITURE = ['BROUILLON', 'VALIDEE', 'LETTREE', 'CLOTUREE'];

// Validation pour création d'écriture comptable
const createEcritureSchema = Joi.object({
  journal_id: Joi.number().integer().positive().required(),
  numero_piece: Joi.string().min(1).max(50).required(),
  date_ecriture: Joi.date().required(),
  libelle: Joi.string().min(2).max(500).required(),
  
  // Montants
  montant_debit: Joi.number().precision(2).min(0).default(0),
  montant_credit: Joi.number().precision(2).min(0).default(0),
  
  // Références
  compte_comptable: Joi.string().pattern(/^[0-9]{3,8}$/).required(),
  compte_auxiliaire: Joi.string().max(20).optional(),
  code_analytique: Joi.string().max(20).optional(),
  
  // Informations complémentaires
  reference_externe: Joi.string().max(100).optional(),
  date_echeance: Joi.date().optional(),
  mode_reglement: Joi.string().max(50).optional(),
  
  // Lettrage
  lettrage: Joi.string().max(10).optional(),
  pointage: Joi.boolean().default(false),
  
  entreprise_id: Joi.number().integer().positive().required(),
  utilisateur_id: Joi.number().integer().positive().required()
}).custom((value, helpers) => {
  // Validation: soit débit soit crédit doit être > 0, mais pas les deux
  const { montant_debit, montant_credit } = value;
  
  if (montant_debit === 0 && montant_credit === 0) {
    return helpers.error('any.custom', {
      message: 'Le montant débit ou crédit doit être supérieur à 0'
    });
  }
  
  if (montant_debit > 0 && montant_credit > 0) {
    return helpers.error('any.custom', {
      message: 'Une écriture ne peut pas avoir à la fois un débit et un crédit'
    });
  }
  
  return value;
});

// Validation pour mise à jour d'écriture
const updateEcritureSchema = Joi.object({
  libelle: Joi.string().min(2).max(500).optional(),
  montant_debit: Joi.number().precision(2).min(0).optional(),
  montant_credit: Joi.number().precision(2).min(0).optional(),
  
  compte_auxiliaire: Joi.string().max(20).optional(),
  code_analytique: Joi.string().max(20).optional(),
  reference_externe: Joi.string().max(100).optional(),
  date_echeance: Joi.date().optional(),
  mode_reglement: Joi.string().max(50).optional(),
  
  lettrage: Joi.string().max(10).optional(),
  pointage: Joi.boolean().optional()
}).min(1);

// Validation pour journal comptable
const createJournalSchema = Joi.object({
  code_journal: Joi.string().min(1).max(10).required(),
  nom_journal: Joi.string().min(2).max(100).required(),
  type_journal: Joi.string().valid(...TYPE_JOURNAL).required(),
  
  // Configuration
  compte_contrepartie: Joi.string().pattern(/^[0-9]{3,8}$/).optional(),
  numerotation_auto: Joi.boolean().default(true),
  prefixe_piece: Joi.string().max(10).optional(),
  
  // Restrictions
  saisie_debit: Joi.boolean().default(true),
  saisie_credit: Joi.boolean().default(true),
  controle_equilibre: Joi.boolean().default(true),
  
  entreprise_id: Joi.number().integer().positive().required()
});

// Validation pour mise à jour de journal
const updateJournalSchema = Joi.object({
  nom_journal: Joi.string().min(2).max(100).optional(),
  compte_contrepartie: Joi.string().pattern(/^[0-9]{3,8}$/).optional(),
  numerotation_auto: Joi.boolean().optional(),
  prefixe_piece: Joi.string().max(10).optional(),
  
  saisie_debit: Joi.boolean().optional(),
  saisie_credit: Joi.boolean().optional(),
  controle_equilibre: Joi.boolean().optional()
}).min(1);

// Validation pour plan comptable
const createCompteSchema = Joi.object({
  numero_compte: Joi.string().pattern(/^[0-9]{3,8}$/).required(),
  libelle_compte: Joi.string().min(2).max(200).required(),
  
  // Classification
  classe_compte: Joi.number().integer().min(1).max(8).required(),
  type_compte: Joi.string().valid(
    'BILAN_ACTIF', 'BILAN_PASSIF', 'CHARGE', 'PRODUIT', 
    'RESULTAT', 'HORS_BILAN'
  ).required(),
  
  // Configuration
  compte_collectif: Joi.boolean().default(false),
  compte_auxiliaire: Joi.boolean().default(false),
  pointage_obligatoire: Joi.boolean().default(false),
  saisie_autorisee: Joi.boolean().default(true),
  
  // Informations complémentaires
  compte_parent: Joi.string().pattern(/^[0-9]{3,8}$/).optional(),
  tva_associee: Joi.string().max(20).optional(),
  
  entreprise_id: Joi.number().integer().positive().required()
});

// Validation pour recherche d'écritures
const searchEcrituresSchema = Joi.object({
  journal_id: Joi.number().integer().positive().optional(),
  compte_comptable: Joi.string().pattern(/^[0-9]{3,8}$/).optional(),
  numero_piece: Joi.string().max(50).optional(),
  date_debut: Joi.date().optional(),
  date_fin: Joi.date().min(Joi.ref('date_debut')).optional(),
  montant_min: Joi.number().precision(2).min(0).optional(),
  montant_max: Joi.number().precision(2).min(Joi.ref('montant_min')).optional(),
  libelle: Joi.string().max(100).optional(),
  lettrage: Joi.string().max(10).optional(),
  non_lettrees: Joi.boolean().optional(),
  pointees: Joi.boolean().optional(),
  
  limit: Joi.number().integer().min(1).max(1000).default(100),
  offset: Joi.number().integer().min(0).default(0),
  sort_by: Joi.string().valid('date_ecriture', 'numero_piece', 'libelle', 'montant_debit', 'montant_credit').default('date_ecriture'),
  sort_order: Joi.string().valid('ASC', 'DESC').default('DESC')
});

// Validation pour balance comptable
const balanceSchema = Joi.object({
  date_debut: Joi.date().required(),
  date_fin: Joi.date().min(Joi.ref('date_debut')).required(),
  
  // Filtres
  classe_compte: Joi.array().items(
    Joi.number().integer().min(1).max(8)
  ).optional(),
  avec_details: Joi.boolean().default(false),
  seulement_mouvementes: Joi.boolean().default(true),
  
  // Format de sortie
  format: Joi.string().valid('JSON', 'CSV', 'EXCEL', 'PDF').default('JSON'),
  grouper_par_classe: Joi.boolean().default(true),
  
  entreprise_id: Joi.number().integer().positive().required()
});

// Validation pour grand livre
const grandLivreSchema = Joi.object({
  compte_comptable: Joi.string().pattern(/^[0-9]{3,8}$/).optional(),
  date_debut: Joi.date().required(),
  date_fin: Joi.date().min(Joi.ref('date_debut')).required(),
  
  // Options
  avec_reports: Joi.boolean().default(true),
  avec_totaux: Joi.boolean().default(true),
  format: Joi.string().valid('JSON', 'CSV', 'EXCEL', 'PDF').default('JSON'),
  
  entreprise_id: Joi.number().integer().positive().required()
});

// Validation pour clôture comptable
const clotureSchema = Joi.object({
  exercice_annee: Joi.number().integer().min(2000).max(2100).required(),
  date_cloture: Joi.date().required(),
  
  // Options de clôture
  generer_reports: Joi.boolean().default(true),
  verifier_equilibre: Joi.boolean().default(true),
  sauvegarder_avant: Joi.boolean().default(true),
  
  // Comptes de résultat
  compte_benefice: Joi.string().pattern(/^[0-9]{3,8}$/).optional(),
  compte_perte: Joi.string().pattern(/^[0-9]{3,8}$/).optional(),
  
  entreprise_id: Joi.number().integer().positive().required(),
  utilisateur_id: Joi.number().integer().positive().required()
});

// Validation pour rapprochement bancaire
const rapprochementBancaireSchema = Joi.object({
  compte_banque: Joi.string().pattern(/^[0-9]{3,8}$/).required(),
  date_debut: Joi.date().required(),
  date_fin: Joi.date().min(Joi.ref('date_debut')).required(),
  
  // Informations bancaires
  solde_banque_debut: Joi.number().precision(2).required(),
  solde_banque_fin: Joi.number().precision(2).required(),
  
  // Écritures à rapprocher
  ecritures_rapprochees: Joi.array().items(
    Joi.object({
      ecriture_id: Joi.number().integer().positive().required(),
      montant_rapproche: Joi.number().precision(2).required(),
      date_valeur: Joi.date().optional(),
      reference_bancaire: Joi.string().max(100).optional()
    })
  ).optional(),
  
  entreprise_id: Joi.number().integer().positive().required()
});

// Validation pour lettrage
const lettrageSchema = Joi.object({
  ecritures_ids: Joi.array().items(
    Joi.number().integer().positive()
  ).min(2).required(),
  
  lettrage_code: Joi.string().min(1).max(10).optional(),
  lettrage_partiel: Joi.boolean().default(false),
  
  entreprise_id: Joi.number().integer().positive().required(),
  utilisateur_id: Joi.number().integer().positive().required()
});

// Validation pour import comptable
const importComptableSchema = Joi.object({
  journal_id: Joi.number().integer().positive().required(),
  format: Joi.string().valid('CSV', 'EXCEL', 'FEC').default('CSV'),
  
  fichier: Joi.object({
    originalname: Joi.string().required(),
    mimetype: Joi.string().valid(
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ).required(),
    size: Joi.number().max(50 * 1024 * 1024).required() // 50MB max
  }).required(),
  
  // Options d'import
  valider_equilibre: Joi.boolean().default(true),
  ignorer_doublons: Joi.boolean().default(false),
  simuler_import: Joi.boolean().default(false),
  
  entreprise_id: Joi.number().integer().positive().required()
});

module.exports = {
  createEcritureSchema,
  updateEcritureSchema,
  createJournalSchema,
  updateJournalSchema,
  createCompteSchema,
  searchEcrituresSchema,
  balanceSchema,
  grandLivreSchema,
  clotureSchema,
  rapprochementBancaireSchema,
  lettrageSchema,
  importComptableSchema,
  TYPE_ECRITURE,
  TYPE_JOURNAL,
  STATUT_ECRITURE
};