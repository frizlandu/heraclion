/**
 * Routes pour le health check et les informations système
 */
const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Vérification de l'état du serveur
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Serveur opérationnel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Temps de fonctionnement en secondes
 *                 memory:
 *                   type: object
 *                   properties:
 *                     used:
 *                       type: number
 *                     total:
 *                       type: number
 *                 environment:
 *                   type: string
 *                   example: development
 */
router.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    },
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  };

  res.status(200).json({
    success: true,
    data: healthCheck
  });
});

/**
 * @swagger
 * /status:
 *   get:
 *     summary: Status détaillé du système
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Status système détaillé
 */
router.get('/status', (req, res) => {
  const status = {
    server: 'running',
    database: 'connected', // Sera vérifiée dynamiquement plus tard
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    node_version: process.version,
    platform: process.platform,
    memory: process.memoryUsage(),
    cpu_usage: process.cpuUsage()
  };

  res.status(200).json({
    success: true,
    data: status
  });
});

module.exports = router;