const Joi = require('joi');

/**
 * Schémas de validation pour les clients
 */

// Validation pour création de client
const createClientSchema = Joi.object({
  nom: Joi.string().min(2).max(200).required(),
  adresse: Joi.string().max(500).optional(),
  telephone: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)\.]{8,20}$/).optional(),
  email: Joi.string().email().max(100).optional(),
  siret: Joi.string().pattern(/^[0-9]{14}$/).optional(),
  code_postal: Joi.string().pattern(/^[0-9]{5}$/).optional(),
  ville: Joi.string().max(100).optional(),
  pays: Joi.string().max(100).default('France'),
  contact_principal: Joi.string().max(100).optional(),
  notes: Joi.string().max(1000).optional(),
  actif: Joi.boolean().default(true)
});

// Validation pour mise à jour de client
const updateClientSchema = Joi.object({
  nom: Joi.string().min(2).max(200).optional(),
  adresse: Joi.string().max(500).optional(),
  telephone: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)\.]{8,20}$/).optional(),
  email: Joi.string().email().max(100).optional(),
  siret: Joi.string().pattern(/^[0-9]{14}$/).optional(),
  code_postal: Joi.string().pattern(/^[0-9]{5}$/).optional(),
  ville: Joi.string().max(100).optional(),
  pays: Joi.string().max(100).optional(),
  contact_principal: Joi.string().max(100).optional(),
  notes: Joi.string().max(1000).optional(),
  actif: Joi.boolean().optional()
}).min(1); // Au moins un champ doit être fourni

// Validation pour recherche de clients
const searchClientsSchema = Joi.object({
  nom: Joi.string().max(200).optional(),
  email: Joi.string().email().optional(),
  telephone: Joi.string().optional(),
  ville: Joi.string().max(100).optional(),
  actif: Joi.boolean().optional(),
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0),
  sort_by: Joi.string().valid('nom', 'email', 'created_at', 'ville').default('nom'),
  sort_order: Joi.string().valid('ASC', 'DESC').default('ASC')
});

// Validation pour import en masse de clients
const importClientsSchema = Joi.object({
  clients: Joi.array().items(createClientSchema).min(1).max(1000).required(),
  ignorer_doublons: Joi.boolean().default(false),
  mettre_a_jour_existants: Joi.boolean().default(false)
});

// Validation pour fusion de clients
const mergeClientsSchema = Joi.object({
  client_principal_id: Joi.number().integer().positive().required(),
  client_secondaire_id: Joi.number().integer().positive().required(),
  conserver_donnees_principal: Joi.boolean().default(true)
});

// Validation pour export de clients
const exportClientsSchema = Joi.object({
  format: Joi.string().valid('csv', 'excel', 'pdf').default('excel'),
  filtres: searchClientsSchema.optional(),
  inclure_statistiques: Joi.boolean().default(false),
  colonnes: Joi.array().items(
    Joi.string().valid('nom', 'email', 'telephone', 'adresse', 'ville', 'code_postal', 'pays', 'siret', 'created_at', 'actif')
  ).optional()
});

// Validation pour statistiques clients
const clientStatsSchema = Joi.object({
  date_debut: Joi.date().optional(),
  date_fin: Joi.date().min(Joi.ref('date_debut')).optional(),
  grouper_par: Joi.string().valid('mois', 'trimestre', 'annee', 'ville', 'pays').default('mois'),
  inclure_chiffre_affaires: Joi.boolean().default(true),
  inclure_factures_impayees: Joi.boolean().default(true)
});

module.exports = {
  createClientSchema,
  updateClientSchema,
  searchClientsSchema,
  importClientsSchema,
  mergeClientsSchema,
  exportClientsSchema,
  clientStatsSchema
};