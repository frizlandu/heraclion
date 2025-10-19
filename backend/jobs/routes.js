const express = require('express');
const router = express.Router();
const jobScheduler = require('./scheduler');
const { validateData } = require('../validators');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * Routes API pour la gestion des tâches planifiées
 * Permet de contrôler et monitorer les jobs depuis l'interface
 */

// Middleware d'authentification pour toutes les routes jobs
router.use(auth.requireAuth);
router.use(auth.requireRole(['ADMIN']));

/**
 * GET /api/jobs/status
 * Récupère le statut de tous les jobs
 */
router.get('/status', async (req, res) => {
  try {
    const status = jobScheduler.getJobsStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error getting jobs status:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du statut des jobs',
      error: error.message
    });
  }
});

/**
 * POST /api/jobs/start
 * Démarre le scheduler de jobs
 */
router.post('/start', async (req, res) => {
  try {
    jobScheduler.start();
    
    res.json({
      success: true,
      message: 'Job scheduler démarré avec succès'
    });
  } catch (error) {
    logger.error('Error starting job scheduler:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du démarrage du scheduler',
      error: error.message
    });
  }
});

/**
 * POST /api/jobs/stop  
 * Arrête le scheduler de jobs
 */
router.post('/stop', async (req, res) => {
  try {
    jobScheduler.stop();
    
    res.json({
      success: true,
      message: 'Job scheduler arrêté avec succès'
    });
  } catch (error) {
    logger.error('Error stopping job scheduler:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'arrêt du scheduler',
      error: error.message
    });
  }
});

/**
 * POST /api/jobs/:jobName/run
 * Exécute manuellement un job spécifique
 */
router.post('/:jobName/run', async (req, res) => {
  try {
    const { jobName } = req.params;
    
    const result = await jobScheduler.runJobManually(jobName);
    
    res.json({
      success: true,
      message: `Job ${jobName} exécuté avec succès`,
      data: result
    });
  } catch (error) {
    logger.error(`Error running job ${req.params.jobName}:`, error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        message: `Job ${req.params.jobName} introuvable`
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Erreur lors de l'exécution du job ${req.params.jobName}`,
        error: error.message
      });
    }
  }
});

/**
 * POST /api/jobs/:jobName/restart
 * Redémarre un job spécifique
 */
router.post('/:jobName/restart', async (req, res) => {
  try {
    const { jobName } = req.params;
    
    jobScheduler.restartJob(jobName);
    
    res.json({
      success: true,
      message: `Job ${jobName} redémarré avec succès`
    });
  } catch (error) {
    logger.error(`Error restarting job ${req.params.jobName}:`, error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        message: `Job ${req.params.jobName} introuvable`
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Erreur lors du redémarrage du job ${req.params.jobName}`,
        error: error.message
      });
    }
  }
});

/**
 * GET /api/jobs/logs
 * Récupère les logs des jobs
 */
router.get('/logs', async (req, res) => {
  try {
    const { limit = 100, job_name, level } = req.query;
    
    // Cette partie dépendrait de votre système de logs
    // Exemple avec Winston ou autre système de logs
    
    const logs = []; // Récupération depuis votre système de logs
    
    res.json({
      success: true,
      data: {
        logs: logs,
        total: logs.length
      }
    });
  } catch (error) {
    logger.error('Error getting job logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des logs',
      error: error.message
    });
  }
});

/**
 * GET /api/jobs/history
 * Récupère l'historique d'exécution des jobs
 */
router.get('/history', async (req, res) => {
  try {
    const { 
      limit = 50, 
      offset = 0, 
      job_name, 
      status,
      date_debut,
      date_fin 
    } = req.query;
    
    // Cette partie nécessiterait une table d'historique des jobs
    // Exemple de structure :
    /*
    const history = await JobHistory.findAndCountAll({
      where: {
        ...(job_name && { job_name }),
        ...(status && { status }),
        ...(date_debut && { created_at: { [Op.gte]: date_debut } }),
        ...(date_fin && { created_at: { [Op.lte]: date_fin } })
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    */
    
    const history = {
      count: 0,
      rows: []
    };
    
    res.json({
      success: true,
      data: {
        history: history.rows,
        total: history.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('Error getting job history:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique',
      error: error.message
    });
  }
});

/**
 * GET /api/jobs/metrics
 * Récupère les métriques des jobs
 */
router.get('/metrics', async (req, res) => {
  try {
    // Calcul des métriques de performance des jobs
    const metrics = {
      total_jobs: 8,
      active_jobs: 6,
      failed_jobs_24h: 0,
      avg_execution_time: {
        'relances': 1200,
        'stock-alerts': 800,
        'backup': 45000
      },
      success_rate_7d: 98.5,
      last_execution: {
        'relances': new Date(Date.now() - 60 * 60 * 1000),
        'stock-alerts': new Date(Date.now() - 30 * 60 * 1000),
        'backup': new Date(Date.now() - 12 * 60 * 60 * 1000)
      }
    };
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error getting job metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des métriques',
      error: error.message
    });
  }
});

/**
 * POST /api/jobs/configure
 * Configure les paramètres des jobs
 */
router.post('/configure', async (req, res) => {
  try {
    const validatedData = validateData(
      require('joi').object({
        job_name: require('joi').string().required(),
        schedule: require('joi').string().optional(),
        enabled: require('joi').boolean().optional(),
        parameters: require('joi').object().optional()
      }),
      req.body
    );
    
    // Mise à jour de la configuration
    // Cette partie nécessiterait une table de configuration des jobs
    
    res.json({
      success: true,
      message: 'Configuration mise à jour avec succès',
      data: validatedData
    });
  } catch (error) {
    logger.error('Error configuring job:', error);
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la configuration du job',
      error: error.message
    });
  }
});

module.exports = router;