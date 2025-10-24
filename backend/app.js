console.log('=== Début du chargement de app.js ===');
process.on('uncaughtException', err => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', err => console.error('Unhandled Rejection:', err));

global.operations = global.operations || [
  { id: 1, date: '2025-10-10', libelle: 'Achat carburant', type: 'sortie', categorie: 'Carburant', montant: -20000 },
  { id: 2, date: '2025-10-10', libelle: 'Entrée caisse', type: 'entree', categorie: 'Dépôt', montant: 100000 },
  { id: 3, date: '2025-10-11', libelle: 'Paiement agent', type: 'sortie', categorie: 'Salaire', montant: -30000 },
];

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { logger, morganLogger, errorLogger } = require('./utils/logger');
const db = require('./config/database');

const app = express();
app.set('trust proxy', 1);
app.locals.operations = global.operations;

// ===== MIDDLEWARE DE SÉCURITÉ =====
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
    },
  },
}));

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',') || []
    : [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
      ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));
app.use(compression());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ===== MIDDLEWARE DE PARSING =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morganLogger);

// ===== MIDDLEWARE DE SANTÉ =====
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Serveur Heraclion opérationnel',
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    }
  });
});

app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({
      success: true,
      message: 'API Heraclion opérationnelle',
      data: {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
        database: 'Connected'
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Service indisponible',
      data: {
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        database: 'Disconnected',
        error: error.message
      }
    });
  }
});

// ✅ Route de test Vercel ↔ Render
app.get('/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'pong',
    data: {
      method: req.method,
      url: req.originalUrl,
      timestamp: new Date().toISOString()
    }
  });
});

// ===== ROUTES API =====
app.use('/api/caisse', require('./routes/caisse'));
app.use('/api/v1/corbeille', require('./routes/corbeille'));
app.use('/api/beneficiaires', require('./routes/beneficiaires'));
app.use('/api/v1', require('./routes/health'));
app.use('/api/v1/auth', require('./routes/auth').router);
app.use('/api/v1/dashboard', require('./routes/dashboard'));
app.use('/api/v1/entreprises', require('./routes/entreprises'));
app.use('/api/v1/clients', require('./routes/clients'));
app.use('/api/v1/stocks', require('./routes/stocks'));
app.use('/api/v1/documents', require('./routes/documents'));
app.use('/api/v1/pdf-config', require('./routes/pdf-config'));
app.use('/api/v1/reports', require('./routes/reports'));
app.use('/api/users', require('./routes/users'));
app.use('/api/v1/all-factures', require('./routes/all-factures'));

app.use('/api/auth', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Route d\'authentification en cours de développement'
  });
});

// ===== FICHIERS STATIQUES =====
app.use('/logos', express.static('public/logos'));
app.use('/exports', express.static('public/exports'));

// ===== GESTION D'ERREURS =====
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    data: {
      method: req.method,
      url: req.originalUrl,
      timestamp: new Date().toISOString()
    }
  });
});

app.use(errorLogger);

app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: err.details?.map(detail => detail.message) || [err.message]
    });
  }
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'JSON invalide dans la requête'
    });
  }
  if (err.code && err.code.startsWith('42')) {
    return res.status(400).json({
      success: false,
      message: 'Erreur de requête'
    });
  }
  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Erreur interne du serveur' 
    : err.message;

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && {
      stack: err.stack,
      error: err
    })
  });
});

module.exports = app;
