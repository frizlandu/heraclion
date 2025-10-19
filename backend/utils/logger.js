/**
 * Configuration et utilitaires de logging avec Winston
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Niveaux de log personnalisés
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Couleurs pour la console
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Format des logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Transports selon l'environnement
const transports = [];

// Console (toujours actif)
transports.push(
  new winston.transports.Console({
    format: format,
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
  })
);

// Fichiers rotatifs (pas en test)
if (process.env.NODE_ENV !== 'test') {
  // Logs d'erreurs
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      handleExceptions: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  );

  // Logs combinés
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  );
}

// Créer le logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: winston.format.json(),
  defaultMeta: { service: 'heraclion-backend' },
  transports,
  exitOnError: false,
});

// Gestion des exceptions non gérées
logger.exceptions.handle(
  new winston.transports.File({ filename: path.join('logs', 'exceptions.log') })
);

// Gestion des rejections non gérées
logger.rejections.handle(
  new winston.transports.File({ filename: path.join('logs', 'rejections.log') })
);

/**
 * Logger pour les requêtes HTTP
 * @param {object} req - Objet request Express
 * @param {object} res - Objet response Express
 * @param {Function} next - Fonction next d'Express
 */
const morganLogger = (req, res, next) => {
  logger.http(`${req.method} ${req.url} - ${req.ip}`);
  next();
};

/**
 * Logger d'erreurs pour Express
 * @param {Error} err - Erreur
 * @param {object} req - Objet request Express
 * @param {object} res - Objet response Express
 * @param {Function} next - Fonction next d'Express
 */
const errorLogger = (err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  next(err);
};

/**
 * Créer un logger enfant avec un contexte spécifique
 * @param {string} service - Nom du service
 * @returns {object} Logger enfant
 */
const createChildLogger = (service) => {
  return logger.child({ service });
};

module.exports = {
  logger,
  morganLogger,
  errorLogger,
  createChildLogger
};