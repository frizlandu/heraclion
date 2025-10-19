const Joi = require('joi');
const documentValidators = require('./documentValidators');
const clientValidators = require('./clientValidators');
const entrepriseValidators = require('./entrepriseValidators');
const stockValidators = require('./stockValidators');
const comptabiliteValidators = require('./comptabiliteValidators');
const userValidators = require('./userValidators');

/**
 * Index principal des validateurs
 * Centralise tous les schémas de validation pour l'application
 */

module.exports = {
  // Documents (Factures & Proformas)
  documents: documentValidators,
  
  // Clients
  clients: clientValidators,
  
  // Entreprises
  entreprises: entrepriseValidators,
  
  // Gestion des stocks
  stocks: stockValidators,
  
  // Comptabilité
  comptabilite: comptabiliteValidators,
  
  // Utilisateurs
  users: userValidators,
  
  // Schémas communs réutilisables
  common: {
    // Validation d'ID
    idSchema: Joi.number().integer().positive().required(),
    
    // Validation de pagination
    paginationSchema: {
      limit: Joi.number().integer().min(1).max(1000).default(50),
      offset: Joi.number().integer().min(0).default(0),
      sort_order: Joi.string().valid('ASC', 'DESC').default('ASC')
    },
    
    // Validation de dates
    dateRangeSchema: {
      date_debut: Joi.date().optional(),
      date_fin: Joi.date().min(Joi.ref('date_debut')).optional()
    },
    
    // Validation de fichier
    fileUploadSchema: {
      originalname: Joi.string().required(),
      size: Joi.number().positive().required()
    },
    
    // Validation d'email
    emailSchema: Joi.string().email().max(100),
    
    // Validation de téléphone
    phoneSchema: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)\.]{8,20}$/),
    
    // Validation de montant
    amountSchema: Joi.number().precision(2).min(0),
    
    // Validation de pourcentage
    percentageSchema: Joi.number().precision(2).min(0).max(100),
    
    // Validation de code postal français
    postalCodeSchema: Joi.string().pattern(/^[0-9]{5}$/),
    
    // Validation SIRET
    siretSchema: Joi.string().pattern(/^[0-9]{14}$/),
    
    // Validation TVA intracommunautaire
    tvaSchema: Joi.string().pattern(/^[A-Z]{2}[0-9A-Z]{2,12}$/),
    
    // Validation IBAN
    ibanSchema: Joi.string().pattern(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/),
    
    // Validation BIC
    bicSchema: Joi.string().pattern(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/)
  }
};

/**
 * Fonction utilitaire pour valider des données avec gestion d'erreur
 * @param {Object} schema - Schéma Joi à utiliser
 * @param {Object} data - Données à valider
 * @param {Object} options - Options de validation
 * @returns {Object} - Résultat de la validation
 */
function validateData(schema, data, options = {}) {
  const defaultOptions = {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  };
  
  const validationOptions = { ...defaultOptions, ...options };
  
  const { error, value } = schema.validate(data, validationOptions);
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      type: detail.type
    }));
    
    throw new Error(`Erreur de validation: ${JSON.stringify(errors)}`);
  }
  
  return value;
}

/**
 * Middleware Express pour validation automatique
 * @param {Object} schema - Schéma Joi à utiliser
 * @param {string} source - Source des données ('body', 'query', 'params')
 * @returns {Function} - Middleware Express
 */
function validationMiddleware(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const validatedData = validateData(schema, dataToValidate);
      req[source] = validatedData;
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: JSON.parse(error.message.replace('Erreur de validation: ', ''))
      });
    }
  };
}

module.exports.validateData = validateData;
module.exports.validationMiddleware = validationMiddleware;