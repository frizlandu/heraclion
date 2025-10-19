const cron = require('node-cron');
const logger = require('../utils/logger');
const { 
  processRelances, 
  processStockAlerts, 
  processBackups,
  processPeriodicReports,
  processEcheanceNotifications,
  processDataCleanup,
  processStatisticsUpdate
} = require('./jobHandlers');

/**
 * Gestionnaire principal des tâches planifiées
 * Centralise toutes les tâches automatisées du système
 */

class JobScheduler {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * Démarre tous les jobs planifiés
   */
  start() {
    if (this.isRunning) {
      logger.warn('Job scheduler already running');
      return;
    }

    logger.info('Starting job scheduler...');
    
    // Relances automatiques - tous les jours à 9h00
    this.scheduleJob('relances', '0 9 * * *', async () => {
      logger.info('Starting automatic payment reminders job');
      await processRelances();
    });

    // Alertes stock - toutes les heures
    this.scheduleJob('stock-alerts', '0 * * * *', async () => {
      logger.info('Starting stock alerts job');
      await processStockAlerts();
    });

    // Notifications d'échéance - tous les jours à 8h00
    this.scheduleJob('echeance-notifications', '0 8 * * *', async () => {
      logger.info('Starting due date notifications job');
      await processEcheanceNotifications();
    });

    // Sauvegarde quotidienne - tous les jours à 2h00
    this.scheduleJob('daily-backup', '0 2 * * *', async () => {
      logger.info('Starting daily backup job');
      await processBackups('daily');
    });

    // Sauvegarde hebdomadaire - dimanche à 1h00
    this.scheduleJob('weekly-backup', '0 1 * * 0', async () => {
      logger.info('Starting weekly backup job');
      await processBackups('weekly');
    });

    // Rapports périodiques - lundi à 7h00
    this.scheduleJob('periodic-reports', '0 7 * * 1', async () => {
      logger.info('Starting periodic reports job');
      await processPeriodicReports();
    });

    // Nettoyage des données - premier du mois à 3h00
    this.scheduleJob('data-cleanup', '0 3 1 * *', async () => {
      logger.info('Starting data cleanup job');
      await processDataCleanup();
    });

    // Mise à jour des statistiques - toutes les 6 heures
    this.scheduleJob('statistics-update', '0 */6 * * *', async () => {
      logger.info('Starting statistics update job');
      await processStatisticsUpdate();
    });

    // Job de santé - toutes les 30 minutes
    this.scheduleJob('health-check', '*/30 * * * *', async () => {
      await this.healthCheck();
    });

    this.isRunning = true;
    logger.info('Job scheduler started successfully');
  }

  /**
   * Arrête tous les jobs planifiés
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('Job scheduler is not running');
      return;
    }

    logger.info('Stopping job scheduler...');
    
    this.jobs.forEach((job, name) => {
      job.destroy();
      logger.info(`Stopped job: ${name}`);
    });

    this.jobs.clear();
    this.isRunning = false;
    logger.info('Job scheduler stopped');
  }

  /**
   * Planifie un job avec gestion d'erreur
   */
  scheduleJob(name, schedule, handler) {
    try {
      const job = cron.schedule(schedule, async () => {
        const startTime = Date.now();
        
        try {
          await handler();
          const duration = Date.now() - startTime;
          logger.info(`Job ${name} completed successfully in ${duration}ms`);
        } catch (error) {
          logger.error(`Job ${name} failed:`, error);
          
          // Notification en cas d'erreur critique
          if (this.isCriticalJob(name)) {
            await this.notifyJobFailure(name, error);
          }
        }
      }, {
        scheduled: false,
        timezone: 'Europe/Paris'
      });

      this.jobs.set(name, job);
      job.start();
      
      logger.info(`Scheduled job: ${name} with cron ${schedule}`);
    } catch (error) {
      logger.error(`Failed to schedule job ${name}:`, error);
    }
  }

  /**
   * Exécute manuellement un job
   */
  async runJobManually(jobName) {
    const handlers = {
      'relances': processRelances,
      'stock-alerts': processStockAlerts,
      'echeance-notifications': processEcheanceNotifications,
      'daily-backup': () => processBackups('daily'),
      'weekly-backup': () => processBackups('weekly'),
      'periodic-reports': processPeriodicReports,
      'data-cleanup': processDataCleanup,
      'statistics-update': processStatisticsUpdate
    };

    const handler = handlers[jobName];
    if (!handler) {
      throw new Error(`Job ${jobName} not found`);
    }

    logger.info(`Running job ${jobName} manually`);
    const startTime = Date.now();
    
    try {
      await handler();
      const duration = Date.now() - startTime;
      logger.info(`Manual job ${jobName} completed in ${duration}ms`);
      return { success: true, duration };
    } catch (error) {
      logger.error(`Manual job ${jobName} failed:`, error);
      throw error;
    }
  }

  /**
   * Retourne le statut de tous les jobs
   */
  getJobsStatus() {
    const status = [];
    
    this.jobs.forEach((job, name) => {
      status.push({
        name,
        running: job.running,
        scheduled: job.scheduled
      });
    });

    return {
      scheduler_running: this.isRunning,
      total_jobs: this.jobs.size,
      jobs: status
    };
  }

  /**
   * Vérifie la santé du système
   */
  async healthCheck() {
    try {
      // Vérifications basiques du système
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      // Log des métriques système
      if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
        logger.warn(`High memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
      }
      
      // Vérification base de données (simplifiée)
      // Cette partie serait à adapter selon votre ORM/base de données
      
      logger.debug(`Health check - Uptime: ${Math.round(uptime)}s, Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    } catch (error) {
      logger.error('Health check failed:', error);
    }
  }

  /**
   * Détermine si un job est critique
   */
  isCriticalJob(jobName) {
    const criticalJobs = ['daily-backup', 'weekly-backup', 'data-cleanup'];
    return criticalJobs.includes(jobName);
  }

  /**
   * Notifie l'échec d'un job critique
   */
  async notifyJobFailure(jobName, error) {
    try {
      const notificationService = require('../services/notificationService');
      
      await notificationService.sendSystemAlert({
        type: 'JOB_FAILURE',
        severity: 'HIGH',
        message: `Critical job ${jobName} failed`,
        details: error.message,
        timestamp: new Date()
      });
    } catch (notifyError) {
      logger.error('Failed to send job failure notification:', notifyError);
    }
  }

  /**
   * Redémarre un job spécifique
   */
  restartJob(jobName) {
    const job = this.jobs.get(jobName);
    if (!job) {
      throw new Error(`Job ${jobName} not found`);
    }

    job.stop();
    job.start();
    logger.info(`Restarted job: ${jobName}`);
  }

  /**
   * Met à jour la planification d'un job
   */
  updateJobSchedule(jobName, newSchedule) {
    const job = this.jobs.get(jobName);
    if (!job) {
      throw new Error(`Job ${jobName} not found`);
    }

    // Arrêter l'ancien job
    job.destroy();
    this.jobs.delete(jobName);

    // Note: Cette méthode nécessiterait de stocker les handlers
    // pour pouvoir re-créer le job avec le nouveau planning
    logger.info(`Updated schedule for job ${jobName} to ${newSchedule}`);
  }
}

// Instance singleton du scheduler
const jobScheduler = new JobScheduler();

// Gestion des signaux système
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, stopping job scheduler...');
  jobScheduler.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, stopping job scheduler...');
  jobScheduler.stop();
  process.exit(0);
});

module.exports = jobScheduler;