const Joi = require('joi');

/**
 * Schémas de validation pour les utilisateurs
 */

const ROLES = ['ADMIN', 'COMPTABLE', 'COMMERCIAL', 'RESPONSABLE_STOCK', 'UTILISATEUR'];
const STATUT_UTILISATEUR = ['ACTIF', 'INACTIF', 'SUSPENDU', 'EN_ATTENTE'];

// Validation pour création d'utilisateur
const createUserSchema = Joi.object({
  // Informations personnelles
  nom: Joi.string().min(2).max(50).required(),
  prenom: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().max(100).required(),
  telephone: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)\.]{8,20}$/).optional(),
  
  // Authentification
  mot_de_passe: Joi.string().min(8).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .message('Le mot de passe doit contenir au moins 8 caractères avec une majuscule, une minuscule, un chiffre et un caractère spécial')
    .required(),
  confirmer_mot_de_passe: Joi.string().valid(Joi.ref('mot_de_passe')).required()
    .messages({
      'any.only': 'La confirmation du mot de passe ne correspond pas'
    }),
  
  // Rôles et permissions
  role: Joi.string().valid(...ROLES).required(),
  permissions_specifiques: Joi.array().items(Joi.string()).optional(),
  
  // Entreprises associées
  entreprises_ids: Joi.array().items(
    Joi.number().integer().positive()
  ).min(1).required(),
  entreprise_principale_id: Joi.number().integer().positive().required(),
  
  // Configuration
  langue: Joi.string().valid('FR', 'EN', 'ES').default('FR'),
  timezone: Joi.string().default('Europe/Paris'),
  notifications_email: Joi.boolean().default(true),
  notifications_push: Joi.boolean().default(true),
  
  // Informations professionnelles
  poste: Joi.string().max(100).optional(),
  service: Joi.string().max(50).optional(),
  manager_id: Joi.number().integer().positive().optional(),
  
  // Dates
  date_embauche: Joi.date().optional(),
  date_fin_contrat: Joi.date().min(Joi.ref('date_embauche')).optional(),
  
  actif: Joi.boolean().default(true)
}).custom((value, helpers) => {
  // Validation: l'entreprise principale doit être dans la liste des entreprises
  if (!value.entreprises_ids.includes(value.entreprise_principale_id)) {
    return helpers.error('any.custom', {
      message: 'L\'entreprise principale doit être dans la liste des entreprises associées'
    });
  }
  return value;
});

// Validation pour mise à jour d'utilisateur
const updateUserSchema = Joi.object({
  nom: Joi.string().min(2).max(50).optional(),
  prenom: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().max(100).optional(),
  telephone: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)\.]{8,20}$/).optional(),
  
  role: Joi.string().valid(...ROLES).optional(),
  permissions_specifiques: Joi.array().items(Joi.string()).optional(),
  
  entreprises_ids: Joi.array().items(
    Joi.number().integer().positive()
  ).min(1).optional(),
  entreprise_principale_id: Joi.number().integer().positive().optional(),
  
  langue: Joi.string().valid('FR', 'EN', 'ES').optional(),
  timezone: Joi.string().optional(),
  notifications_email: Joi.boolean().optional(),
  notifications_push: Joi.boolean().optional(),
  
  poste: Joi.string().max(100).optional(),
  service: Joi.string().max(50).optional(),
  manager_id: Joi.number().integer().positive().optional(),
  
  date_embauche: Joi.date().optional(),
  date_fin_contrat: Joi.date().optional(),
  
  actif: Joi.boolean().optional()
}).min(1);

// Validation pour changement de mot de passe
const changePasswordSchema = Joi.object({
  ancien_mot_de_passe: Joi.string().required(),
  nouveau_mot_de_passe: Joi.string().min(8).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .message('Le nouveau mot de passe doit contenir au moins 8 caractères avec une majuscule, une minuscule, un chiffre et un caractère spécial')
    .required(),
  confirmer_nouveau_mot_de_passe: Joi.string().valid(Joi.ref('nouveau_mot_de_passe')).required()
    .messages({
      'any.only': 'La confirmation du nouveau mot de passe ne correspond pas'
    })
});

// Validation pour réinitialisation de mot de passe
const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  url_retour: Joi.string().uri().optional()
});

const confirmResetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  nouveau_mot_de_passe: Joi.string().min(8).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required(),
  confirmer_nouveau_mot_de_passe: Joi.string().valid(Joi.ref('nouveau_mot_de_passe')).required()
});

// Validation pour authentification
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  mot_de_passe: Joi.string().required(),
  se_souvenir: Joi.boolean().default(false),
  entreprise_id: Joi.number().integer().positive().optional()
});

// Validation pour recherche d'utilisateurs
const searchUsersSchema = Joi.object({
  nom: Joi.string().max(50).optional(),
  prenom: Joi.string().max(50).optional(),
  email: Joi.string().email().optional(),
  role: Joi.string().valid(...ROLES).optional(),
  entreprise_id: Joi.number().integer().positive().optional(),
  actif: Joi.boolean().optional(),
  service: Joi.string().max(50).optional(),
  
  limit: Joi.number().integer().min(1).max(200).default(50),
  offset: Joi.number().integer().min(0).default(0),
  sort_by: Joi.string().valid('nom', 'prenom', 'email', 'role', 'created_at').default('nom'),
  sort_order: Joi.string().valid('ASC', 'DESC').default('ASC')
});

// Validation pour permissions utilisateur
const updatePermissionsSchema = Joi.object({
  permissions: Joi.array().items(
    Joi.object({
      module: Joi.string().valid(
        'FACTURES', 'CLIENTS', 'STOCKS', 'COMPTABILITE', 
        'UTILISATEURS', 'ENTREPRISES', 'RAPPORTS'
      ).required(),
      actions: Joi.array().items(
        Joi.string().valid('LIRE', 'CREER', 'MODIFIER', 'SUPPRIMER', 'VALIDER', 'EXPORTER')
      ).min(1).required()
    })
  ).required(),
  utilisateur_id: Joi.number().integer().positive().required()
});

// Validation pour profil utilisateur
const updateProfileSchema = Joi.object({
  nom: Joi.string().min(2).max(50).optional(),
  prenom: Joi.string().min(2).max(50).optional(),
  telephone: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)\.]{8,20}$/).optional(),
  
  langue: Joi.string().valid('FR', 'EN', 'ES').optional(),
  timezone: Joi.string().optional(),
  notifications_email: Joi.boolean().optional(),
  notifications_push: Joi.boolean().optional(),
  
  // Préférences d'affichage
  theme: Joi.string().valid('CLAIR', 'SOMBRE', 'AUTO').default('AUTO'),
  items_par_page: Joi.number().integer().min(10).max(100).default(25),
  format_date: Joi.string().valid('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD').default('DD/MM/YYYY'),
  format_nombre: Joi.string().valid('FR', 'EN', 'DE').default('FR'),
  
  // Photo de profil
  avatar: Joi.string().max(255).optional()
}).min(1);

// Validation pour upload d'avatar
const uploadAvatarSchema = Joi.object({
  avatar: Joi.object({
    originalname: Joi.string().required(),
    mimetype: Joi.string().valid('image/jpeg', 'image/png', 'image/gif').required(),
    size: Joi.number().max(2 * 1024 * 1024).required() // 2MB max
  }).required()
});

// Validation pour session utilisateur
const sessionSchema = Joi.object({
  include_permissions: Joi.boolean().default(false),
  include_entreprises: Joi.boolean().default(true),
  include_preferences: Joi.boolean().default(true)
});

// Validation pour logs d'activité utilisateur
const activityLogsSchema = Joi.object({
  utilisateur_id: Joi.number().integer().positive().optional(),
  date_debut: Joi.date().optional(),
  date_fin: Joi.date().min(Joi.ref('date_debut')).optional(),
  action: Joi.string().max(50).optional(),
  module: Joi.string().max(50).optional(),
  
  limit: Joi.number().integer().min(1).max(500).default(100),
  offset: Joi.number().integer().min(0).default(0),
  sort_order: Joi.string().valid('ASC', 'DESC').default('DESC')
});

// Validation pour suspension/réactivation utilisateur
const userStatusSchema = Joi.object({
  statut: Joi.string().valid(...STATUT_UTILISATEUR).required(),
  motif: Joi.string().max(500).optional(),
  date_fin_suspension: Joi.date().when('statut', {
    is: 'SUSPENDU',
    then: Joi.date().greater('now').optional(),
    otherwise: Joi.forbidden()
  }),
  notifier_utilisateur: Joi.boolean().default(true)
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  resetPasswordSchema,
  confirmResetPasswordSchema,
  loginSchema,
  searchUsersSchema,
  updatePermissionsSchema,
  updateProfileSchema,
  uploadAvatarSchema,
  sessionSchema,
  activityLogsSchema,
  userStatusSchema,
  ROLES,
  STATUT_UTILISATEUR
};