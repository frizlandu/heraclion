/**
 * Index principal du système de jobs
 * Point d'entrée pour toutes les tâches planifiées
 */

const jobScheduler = require('./scheduler');
const jobRoutes = require('./routes');

module.exports = {
  scheduler: jobScheduler,
  routes: jobRoutes,
  
  // Méthodes de convenance
  start: () => jobScheduler.start(),
  stop: () => jobScheduler.stop(),
  getStatus: () => jobScheduler.getJobsStatus(),
  runManually: (jobName) => jobScheduler.runJobManually(jobName)
};