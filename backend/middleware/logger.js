const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

// Configuration des logs rotatifs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Transport pour les logs d'erreur
const errorTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat
});

// Transport pour tous les logs
const combinedTransport = new DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat
});

// Configuration du logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    errorTransport,
    combinedTransport
  ]
});

// Ajouter console en développement
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Middleware de logging des requêtes
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log de la requête entrante
  logger.info('Requête entrante', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Override de la fonction end pour logger la réponse
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    res.end = originalEnd;
    res.end(chunk, encoding);
    
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger.log(logLevel, 'Réponse envoyée', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || 0,
      timestamp: new Date().toISOString()
    });
  };

  next();
};

// Middleware de logging des erreurs
const errorLogger = (error, req, res, next) => {
  logger.error('Erreur serveur', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    timestamp: new Date().toISOString(),
    body: req.body,
    params: req.params,
    query: req.query
  });

  next(error);
};

module.exports = {
  logger,
  requestLogger,
  errorLogger
};