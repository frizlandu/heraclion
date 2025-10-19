console.log('=== Début du chargement de app.js ===');
console.log('=== Fin du chargement de app.js, avant module.exports ===');
process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
});
console.log('=== DÉMARRAGE SERVEUR ===');
// Rendre la structure mock de la caisse accessible globalement pour la paie
global.operations = global.operations || [
  {
    id: 1,
    date: '2025-10-10',
    libelle: 'Achat carburant',
    type: 'sortie',
    categorie: 'Carburant',
    montant: -20000,
  },
  {
    id: 2,
    date: '2025-10-10',
    libelle: 'Entrée caisse',
    type: 'entree',
    categorie: 'Dépôt',
    montant: 100000,
  },
  {
    id: 3,
    date: '2025-10-11',
    libelle: 'Paiement agent',
    type: 'sortie',
    categorie: 'Salaire',
    montant: -30000,
  },
];

/**
 * Configuration principale de l'application Express
 * Middleware, routes et gestion d'erreurs
 */

console.log('Début app.js');
console.log('Avant require express');
const express = require('express');
console.log('Après require express');
console.log('Avant require cors');
const cors = require('cors');
console.log('Après require cors');
console.log('Avant require helmet');
const helmet = require('helmet');
console.log('Après require helmet');
console.log('Avant require compression');
const compression = require('compression');
console.log('Après require compression');
console.log('Avant require rateLimit');
const rateLimit = require('express-rate-limit');
console.log('Après require rateLimit');
console.log('Avant require logger');
const { logger, morganLogger, errorLogger } = require('./utils/logger');
console.log('Après require logger');
console.log('Avant require db');
const db = require('./config/database');
console.log('Après require db');

// Créer l'application Express
const app = express();
// Correction X-Forwarded-For/express-rate-limit : faire confiance au proxy
app.set('trust proxy', 1); // ou true si plusieurs proxies
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
        'http://localhost:3001', // Ajout pour le frontend sur 3001
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

// ===== ROUTES API =====


console.log('Avant require ./routes/caisse');
const caisseRoutes = require('./routes/caisse');
console.log('Après require ./routes/caisse');
app.use('/api/caisse', caisseRoutes);

// Déplacer l'import des routes "corbeille" ici, une fois que `app` est créé
console.log('Avant require ./routes/corbeille');
const corbeilleRoutes = require('./routes/corbeille');
console.log('Après require ./routes/corbeille');
app.use('/api/v1/corbeille', corbeilleRoutes);

// Route bénéficiaires
console.log('Avant require ./routes/beneficiaires');
const beneficiairesRoutes = require('./routes/beneficiaires');
console.log('Après require ./routes/beneficiaires');
app.use('/api/beneficiaires', beneficiairesRoutes);

if (process.env.NODE_ENV !== 'production') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerSpec = require('./docs/swagger');
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Heraclion API Documentation'
  }));
}

console.log('Avant require ./routes/health');
const healthRoutes = require('./routes/health');
console.log('Après require ./routes/health');
console.log('Avant require ./routes/auth');
const { router: authRoutes, authenticateToken } = require('./routes/auth');
console.log('Après require ./routes/auth');
console.log('Avant require ./routes/dashboard');
const dashboardRoutes = require('./routes/dashboard');
console.log('Après require ./routes/dashboard');
console.log('Avant require ./routes/entreprises');
const entreprisesRoutes = require('./routes/entreprises');
console.log('Après require ./routes/entreprises');
console.log('Avant require ./routes/clients');
const clientsRoutes = require('./routes/clients');
console.log('Après require ./routes/clients');
console.log('Avant require ./routes/stocks');
const stocksRoutes = require('./routes/stocks');
console.log('Après require ./routes/stocks');
console.log('Avant require ./routes/documents');
const documentsRoutes = require('./routes/documents');
console.log('Après require ./routes/documents');

console.log('Avant require ./routes/pdf-config');
const pdfConfigRoutes = require('./routes/pdf-config');
console.log('Après require ./routes/pdf-config');

console.log('Avant require ./routes/reports');
const reportsRoutes = require('./routes/reports');
console.log('Après require ./routes/reports');

console.log('Avant require ./routes/users');
const usersRoutes = require('./routes/users');
console.log('Après require ./routes/users');

// Ajout de la route all-factures
console.log('Avant require ./routes/all-factures');
const allFacturesRoutes = require('./routes/all-factures');
console.log('Après require ./routes/all-factures');

// Servir les fichiers statiques
app.use('/logos', express.static('public/logos'));
app.use('/exports', express.static('public/exports'));

app.use('/api/v1', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/entreprises', entreprisesRoutes);
app.use('/api/v1/clients', clientsRoutes);
app.use('/api/v1/stocks', stocksRoutes);
app.use('/api/v1/documents', documentsRoutes);
app.use('/api/v1/pdf-config', pdfConfigRoutes);

// Reports mock API
app.use('/api/v1/reports', reportsRoutes);

// Exposer /api/users pour la compatibilité avec le frontend qui appelle `api/users`
app.use('/api/users', usersRoutes);

app.use('/api/v1/all-factures', allFacturesRoutes);

app.use('/api/auth', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Route d\'authentification en cours de développement'
  });
});




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