// src/queue/producer.js
const { Queue } = require('bullmq');
const { getRedisClient } = require('../config/redis');

// Lazy init — Queue is created on first use, not at require() time.
// This avoids calling getRedisClient() before dotenv has loaded REDIS_URI.
let classificationQueue = null;

function getQueue() {
  if (!classificationQueue) {
    classificationQueue = new Queue('classification-queue', {
      connection: getRedisClient(),
      defaultJobOptions: {
        attempts: 3, // Retry 3 times if fails
        backoff: {
          type: 'exponential', // Wait longer each retry
          delay: 1000,         // Start with 1 second
        },
        removeOnComplete: true, // Auto-cleanup after success
        removeOnFail: false,    // Keep failed jobs for debugging
      },
    });
  }
  return classificationQueue;
}

/**
 * Add a job to the queue for AI processing
 * @param {string} problemId - The ID of the problem
 * @param {string} text - The problem description text
 * @param {Array<string>} imageUrls - Cloudinary image URLs
 * @param {object} location - { lat, lng, district }
 */
const enqueueClassification = async (problemId, text, imageUrls = [], location = null) => {
  await getQueue().add('classify', { problemId, text, imageUrls, location });
  console.log(`📤 [Queue] Job added for problem: ${problemId}`);
};

module.exports = { getQueue, enqueueClassification };