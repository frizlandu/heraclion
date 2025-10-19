const cors = require('cors');
const { logger } = require('./logger');

// Configuration CORS flexible selon l'environnement
const getCorsOptions = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const allowedOrigins = process.env.FRONTEND_URL ? 
    process.env.FRONTEND_URL.split(',').map(url => url.trim()) : 
    ['http://localhost:3001'];

  return {
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origin en développement (Postman, etc.)
      if (isDevelopment && !origin) {
        return callback(null, true);
      }

      // Vérifier si l'origin est autorisé
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn('CORS: Origin non autorisé', { 
          origin, 
          allowedOrigins,
          userAgent: process.env.USER_AGENT || 'unknown'
        });
        callback(new Error('Non autorisé par la politique CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Page-Count',
      'X-Current-Page',
      'X-Rate-Limit-Limit',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset'
    ],
    credentials: true, // Autoriser les cookies/sessions
    maxAge: 86400 // Cache preflight pendant 24h
  };
};

// Middleware CORS personnalisé avec logging
const corsMiddleware = () => {
  const corsOptions = getCorsOptions();
  
  return (req, res, next) => {
    // Log des requêtes CORS en développement
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Requête CORS', {
        origin: req.get('Origin'),
        method: req.method,
        url: req.url,
        headers: req.headers
      });
    }

    // Appliquer CORS
    cors(corsOptions)(req, res, (err) => {
      if (err) {
        logger.error('Erreur CORS', {
          error: err.message,
          origin: req.get('Origin'),
          method: req.method,
          url: req.url
        });
        
        return res.status(403).json({
          error: 'Accès interdit par la politique CORS',
          message: 'Votre domaine n\'est pas autorisé à accéder à cette API'
        });
      }
      next();
    });
  };
};

// Configuration CORS spécifique pour les uploads
const corsUploadOptions = {
  ...getCorsOptions(),
  maxAge: 3600 // Cache plus court pour les uploads
};

// Configuration CORS pour les endpoints publics (documentation, health check)
const corsPublicOptions = {
  origin: '*',
  methods: ['GET'],
  allowedHeaders: ['Content-Type'],
  credentials: false
};

module.exports = {
  corsMiddleware,
  corsUploadOptions,
  corsPublicOptions,
  getCorsOptions
};