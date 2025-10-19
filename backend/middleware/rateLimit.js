const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { logger } = require('./logger');

// Configuration générale pour l'API
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requêtes par fenêtre
  message: {
    error: 'Trop de requêtes depuis cette adresse IP, veuillez réessayer plus tard.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Inclut les headers rate limit
  legacyHeaders: false, // Désactive les headers X-RateLimit-*
  handler: (req, res) => {
    logger.warn('Rate limit dépassé', {
      ip: req.ip,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      error: 'Trop de requêtes depuis cette adresse IP, veuillez réessayer plus tard.',
      retryAfter: '15 minutes'
    });
  }
});

// Limitation stricte pour les endpoints sensibles (auth, etc.)
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives par fenêtre
  message: {
    error: 'Trop de tentatives de connexion, veuillez réessayer plus tard.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit strict dépassé', {
      ip: req.ip,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      error: 'Trop de tentatives de connexion, veuillez réessayer plus tard.',
      retryAfter: '15 minutes'
    });
  }
});

// Ralentissement progressif des requêtes
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Commencer à ralentir après 50 requêtes
  delayMs: 500, // Ajouter 500ms de délai par requête après delayAfter
  maxDelayMs: 20000, // Délai maximum de 20 secondes
  handler: (req, res, next, delay) => {
    logger.info('Ralentissement appliqué', {
      ip: req.ip,
      delay: `${delay}ms`,
      method: req.method,
      url: req.url
    });
    next();
  }
});

// Limitation pour les uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20, // 20 uploads par heure
  message: {
    error: 'Limite d\'upload atteinte, veuillez réessayer plus tard.',
    retryAfter: '1 heure'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Limitation pour les exports/rapports
const exportLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 exports par 5 minutes
  message: {
    error: 'Limite d\'export atteinte, veuillez réessayer plus tard.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Limitation par utilisateur (nécessite l'authentification)
const createUserLimiter = (maxRequests = 200, windowMs = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: (req) => {
      // Utiliser l'ID utilisateur si disponible, sinon l'IP
      return req.user?.id ? `user_${req.user.id}` : req.ip;
    },
    message: {
      error: 'Limite de requêtes atteinte pour cet utilisateur.',
      retryAfter: `${windowMs / 60000} minutes`
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

module.exports = {
  apiLimiter,
  strictLimiter,
  speedLimiter,
  uploadLimiter,
  exportLimiter,
  createUserLimiter
};