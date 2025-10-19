const express = require('express');
const { swaggerGenerator } = require('./swagger');
const router = express.Router();

/**
 * Routes pour la documentation API
 */

// Servir la documentation Swagger UI
const { serve, setup } = swaggerGenerator.getMiddleware();
router.use('/docs', serve);
router.get('/docs', setup);

// Export de la documentation en JSON
router.get('/swagger.json', (req, res) => {
  try {
    const docs = swaggerGenerator.generateDocs();
    res.json(docs);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate API documentation',
      message: error.message
    });
  }
});

// Validation de la documentation
router.get('/validate', (req, res) => {
  try {
    const validation = swaggerGenerator.validateDocs();
    res.json(validation);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to validate API documentation',
      message: error.message
    });
  }
});

// Export des tests d'API
router.get('/tests', (req, res) => {
  try {
    const tests = swaggerGenerator.generateApiTests();
    res.json({
      total: tests.length,
      tests: tests
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate API tests',
      message: error.message
    });
  }
});

// Redirection vers la documentation
router.get('/', (req, res) => {
  res.redirect('/api/docs');
});

module.exports = router;