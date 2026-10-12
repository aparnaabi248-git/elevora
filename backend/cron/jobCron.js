const cron = require('node-cron');
const { fetchAndSyncJobs } = require('../services/jobFetcherService');
const Job = require('../models/Job');

const initCron = () => {
  // Run every 6 hours: '0 */6 * * *'
  // For safety and testing verification in dev, also support a quick schedule (optional)
  cron.schedule('0 */6 * * *', async () => {
    console.log('Cron Job: Syncing external jobs and removing expired postings...');
    try {
      // 1. Sync jobs
      await fetchAndSyncJobs();
      
      // 2. Remove expired jobs
      const now = new Date();
      const deleteResult = await Job.deleteMany({
        $or: [
          { expiresAt: { $lt: now } },
          // Optional: Clear out mock syncs older than 30 days
          { createdAt: { $lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }, externalId: { $exists: true } }
        ]
      });
      console.log(`Cron Job: Removed ${deleteResult.deletedCount} expired or outdated jobs.`);
    } catch (error) {
      console.error('Cron Job failed:', error.message);
    }
  });

  console.log('Cron jobs scheduled (Every 6 hours job sync active).');
};

module.exports = initCron;
