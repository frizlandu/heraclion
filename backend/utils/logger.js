/**
 * Logger cockpitifié avec Winston + rotation journalière
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Définition des niveaux personnalisés
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

// Format console lisible
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} ${level}: ${message}`;
  })
);

// Format JSON pour fichiers
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Transports dynamiques
const transports = [
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    format: consoleFormat
  })
];

if (process.env.NODE_ENV !== 'test') {
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      handleExceptions: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat
    }),
    new DailyRotateFile({
      filename: path.join('logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat
    })
  );
}

// Création du logger principal
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: fileFormat,
  defaultMeta: { service: 'heraclion-backend' },
  transports,
  exitOnError: false
});

// Gestion des exceptions et rejections
if (process.env.NODE_ENV !== 'test') {
  logger.exceptions.handle(
    new winston.transports.File({ filename: path.join('logs', 'exceptions.log') })
  );

  logger.rejections.handle(
    new winston.transports.File({ filename: path.join('logs', 'rejections.log') })
  );
}

/**
 * Middleware Express pour logger les requêtes HTTP
 */
const morganLogger = (req, res, next) => {
  logger.http(`${req.method} ${req.originalUrl} - ${req.ip}`);
  next();
};

/**
 * Middleware Express pour logger les erreurs
 */
const errorLogger = (err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  next(err);
};

/**
 * Créer un logger enfant avec un contexte spécifique
 */
const createChildLogger = (service) => logger.child({ service });

module.exports = {
  logger,
  morganLogger,
  errorLogger,
  createChildLogger
};
