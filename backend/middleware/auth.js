const jwt = require('jsonwebtoken');
const { logger } = require('./logger');

/**
 * Middleware d'authentification JWT
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Token d\'authentification manquant',
        message: 'Veuillez fournir un token d\'authentification'
      });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        error: 'Format de token invalide',
        message: 'Le token doit être au format "Bearer <token>"'
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier si le token n'est pas expiré
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({
        error: 'Token expiré',
        message: 'Veuillez vous reconnecter'
      });
    }

    // Ajouter les informations utilisateur à la requête
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      entreprise_id: decoded.entreprise_id
    };

    logger.info('Authentification réussie', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      method: req.method,
      url: req.url
    });

    next();
  } catch (error) {
    logger.warn('Échec authentification', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.url
    });

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token invalide',
        message: 'Le token fourni n\'est pas valide'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expiré',
        message: 'Veuillez vous reconnecter'
      });
    }

    return res.status(401).json({
      error: 'Erreur d\'authentification',
      message: 'Impossible de vérifier votre identité'
    });
  }
};

/**
 * Middleware d'autorisation par rôle
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Non authentifié',
        message: 'Vous devez être connecté pour accéder à cette ressource'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Accès non autorisé', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        method: req.method,
        url: req.url,
        ip: req.ip
      });

      return res.status(403).json({
        error: 'Accès interdit',
        message: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource'
      });
    }

    next();
  };
};

/**
 * Middleware d'autorisation par entreprise
 * Vérifie que l'utilisateur appartient à la même entreprise que la ressource demandée
 */
const authorizeEntreprise = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Non authentifié',
      message: 'Vous devez être connecté pour accéder à cette ressource'
    });
  }

  // Les admins peuvent accéder à toutes les entreprises
  if (req.user.role === 'ADMIN') {
    return next();
  }

  // Vérifier l'entreprise dans l'URL ou le body
  const entrepriseId = req.params.entrepriseId || 
                      req.body.entreprise_id || 
                      req.query.entreprise_id;

  if (entrepriseId && parseInt(entrepriseId) !== req.user.entreprise_id) {
    logger.warn('Tentative d\'accès à une autre entreprise', {
      userId: req.user.id,
      userEntrepriseId: req.user.entreprise_id,
      requestedEntrepriseId: entrepriseId,
      method: req.method,
      url: req.url,
      ip: req.ip
    });

    return res.status(403).json({
      error: 'Accès interdit',
      message: 'Vous ne pouvez accéder qu\'aux ressources de votre entreprise'
    });
  }

  next();
};

/**
 * Middleware optionnel d'authentification
 * N'échoue pas si aucun token n'est fourni, mais décode le token s'il est présent
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return next();
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      entreprise_id: decoded.entreprise_id
    };
  } catch (error) {
    // Ignorer les erreurs de token en mode optionnel
    logger.debug('Token optionnel invalide', {
      error: error.message,
      ip: req.ip
    });
  }

  next();
};

/**
 * Génère un token JWT
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    entreprise_id: user.entreprise_id
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: 'heraclion-backend',
    audience: 'heraclion-frontend'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

/**
 * Génère un refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    type: 'refresh'
  };

  const options = {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'heraclion-backend'
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, options);
};

module.exports = {
  authenticate,
  authorize,
  authorizeEntreprise,
  optionalAuth,
  generateToken,
  generateRefreshToken
};