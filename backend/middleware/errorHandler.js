const { logger } = require('./logger');

/**
 * Gestionnaire d'erreurs global
 */
const errorHandler = (error, req, res, next) => {
  // Log de l'erreur
  logger.error('Erreur non gérée', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user ? { id: req.user.id, email: req.user.email } : null
  });

  // Si les headers ont déjà été envoyés, déléguer à Express
  if (res.headersSent) {
    return next(error);
  }

  // Déterminer le status code et le message selon le type d'erreur
  let statusCode = 500;
  let message = 'Erreur interne du serveur';
  let details = null;

  // Erreurs de validation
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Données de validation invalides';
    details = error.details || error.message;
  }

  // Erreurs de base de données
  else if (error.code === '23505') { // Contrainte unique PostgreSQL
    statusCode = 409;
    message = 'Cette ressource existe déjà';
    details = 'Une entrée avec ces valeurs existe déjà dans la base de données';
  }
  else if (error.code === '23503') { // Contrainte de clé étrangère PostgreSQL
    statusCode = 400;
    message = 'Référence invalide';
    details = 'La ressource référencée n\'existe pas';
  }
  else if (error.code === '23502') { // Contrainte NOT NULL PostgreSQL
    statusCode = 400;
    message = 'Champ obligatoire manquant';
    details = 'Un ou plusieurs champs obligatoires sont manquants';
  }

  // Erreurs JWT
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token d\'authentification invalide';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token d\'authentification expiré';
  }

  // Erreurs de cast (ID invalide, etc.)
  else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Format de données invalide';
    details = `Format invalide pour le champ: ${error.path}`;
  }

  // Erreurs de syntaxe JSON
  else if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    statusCode = 400;
    message = 'Format JSON invalide';
    details = 'Le contenu de la requête n\'est pas un JSON valide';
  }

  // Erreurs de taille de fichier (multer)
  else if (error.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'Fichier trop volumineux';
    details = `La taille du fichier dépasse la limite autorisée`;
  }
  else if (error.code === 'LIMIT_FILE_COUNT') {
    statusCode = 413;
    message = 'Trop de fichiers';
    details = 'Le nombre de fichiers dépasse la limite autorisée';
  }

  // Erreurs personnalisées
  else if (error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  }

  // Réponse d'erreur standardisée
  const errorResponse = {
    error: message,
    status: statusCode,
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  };

  // Ajouter les détails en développement
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = details || error.message;
    errorResponse.stack = error.stack;
  } else if (details) {
    errorResponse.details = details;
  }

  // Ajouter un ID d'erreur pour le suivi
  const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  errorResponse.errorId = errorId;

  // Log avec l'ID d'erreur
  logger.error('Réponse d\'erreur envoyée', {
    errorId,
    statusCode,
    message,
    method: req.method,
    url: req.url,
    ip: req.ip
  });

  res.status(statusCode).json(errorResponse);
};

/**
 * Gestionnaire pour les routes non trouvées (404)
 */
const notFoundHandler = (req, res) => {
  logger.warn('Route non trouvée', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    error: 'Route non trouvée',
    status: 404,
    message: `La route ${req.method} ${req.url} n'existe pas`,
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  });
};

/**
 * Wrapper pour les fonctions async pour capturer les erreurs
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Créer une erreur personnalisée
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware de gestion des erreurs de validation Joi
 */
const joiErrorHandler = (error, req, res, next) => {
  if (error.isJoi) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));

    return res.status(400).json({
      error: 'Erreur de validation',
      status: 400,
      details,
      timestamp: new Date().toISOString(),
      path: req.url,
      method: req.method
    });
  }
  next(error);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  joiErrorHandler
};