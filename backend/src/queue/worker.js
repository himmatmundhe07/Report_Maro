// src/queue/worker.js
const { Worker } = require('bullmq');
const axios = require('axios');
const { OpenAI } = require('openai');
const { getRedisClient } = require('../config/redis');

// Get Redis connection
const redis = getRedisClient();

/**
 * ⚡ NVIDIA NIM AI Client Setup
 * Uses OpenAI-compatible client endpoint: https://integrate.api.nvidia.com/v1
 */
const getNvidiaClient = () => {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ [AI Worker] NVIDIA_API_KEY is not set in environment. Falling back to rule-based fallback.');
    return null;
  }
  return new OpenAI({
    apiKey,
    baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
  });
};

/**
 * Fallback classification function (rule-based)
 */
const fallbackClassify = (text) => {
  const words = text.toLowerCase().split(' ');
  const categories = {
    water: ['water', 'pond', 'river', 'drinking', 'flood', 'irrigation', 'drainage'],
    road: ['road', 'pothole', 'bridge', 'construction', 'drain', 'street'],
    health: ['hospital', 'doctor', 'medicine', 'disease', 'health', 'clinic'],
    other: [],
  };

  let bestCategory = 'other';
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(categories)) {
    const score = keywords.filter((k) => words.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  const urgentWords = ['emergency', 'critical', 'urgent', 'death', 'accident', 'flood'];
  const priority = urgentWords.some((w) => words.includes(w)) ? 'high' : 'medium';

  return {
    category: bestCategory,
    priority,
    confidence: 0.70,
  };
};

/**
 * 🧠 NVIDIA Build Model Inference Call
 */
const analyzeProblemWithAI = async (text, imageUrls = []) => {
  const nvidia = getNvidiaClient();
  if (!nvidia) {
    return fallbackClassify(text);
  }

  const modelName = process.env.NVIDIA_MODEL_NAME || 'meta/llama-3.2-11b-vision-instruct';

  const systemPrompt = `You are an AI classifier for civic problem reports in Jharkhand (SIH Report_Maro portal).
Analyze the citizen report and return a JSON object with:
- "category": must be exactly one of ["water", "road", "health", "other"]
- "priority": must be exactly one of ["low", "medium", "high"]
- "confidence": float between 0.0 and 1.0 indicating report clarity/certainty
- "reasoning": 1 brief sentence justifying category & priority choice

Respond ONLY with valid JSON. No markdown formatting.`;

  try {
    const userMessageContent = `Problem Report Text: "${text}"`;

    const response = await nvidia.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessageContent },
      ],
      temperature: 0.2,
      max_tokens: 200,
    });

    const rawOutput = response.choices[0]?.message?.content?.trim() || '';
    const cleanJson = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    // Validate enums strictly against database model
    const validCategories = ['water', 'road', 'health', 'other'];
    const validPriorities = ['low', 'medium', 'high'];

    const category = validCategories.includes(parsed.category) ? parsed.category : 'other';
    const priority = validPriorities.includes(parsed.priority) ? parsed.priority : 'medium';
    const confidence = typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.85;

    return { category, priority, confidence };
  } catch (err) {
    console.error(`⚠️ [AI Worker] NVIDIA API call failed (${err.message}). Using fallback classification.`);
    return fallbackClassify(text);
  }
};

const Problem = require('../models/problem.model');

// Spatial distance calculation (Haversine formula in meters)
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371e3; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Jaccard word-level similarity
const computeTextSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  const words1 = new Set(str1.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(str2.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 2));
  if (words1.size === 0 || words2.size === 0) return 0;
  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }
  const union = words1.size + words2.size - intersection;
  return union > 0 ? intersection / union : 0;
};

/**
 * BullMQ Worker Instance with Rate Limiting (30 RPM safely under 35 RPM cap)
 */
const worker = new Worker(
  'classification-queue',
  async (job) => {
    const { problemId, text, imageUrls, location } = job.data;
    console.log(`🧠 [Worker] Processing job for problem: ${problemId}`);

    // 1. Run AI classification using NVIDIA NIM API
    const { category, priority, confidence } = await analyzeProblemWithAI(text, imageUrls);
    console.log(`📊 [Worker] Result: Category=${category}, Priority=${priority}, Confidence=${confidence}`);

    // 2. Run Spatial & Text Deduplication Check
    let duplicateOf = null;
    try {
      const currentProblem = await Problem.findById(problemId);
      if (currentProblem) {
        const candidates = await Problem.find({
          _id: { $ne: problemId },
          status: { $in: ['submitted', 'verified', 'assigned', 'in_progress'] },
          duplicate_of: null,
        }).limit(60);

        for (const candidate of candidates) {
          let spatialMatch = false;
          if (
            currentProblem.location?.lat &&
            currentProblem.location?.lng &&
            candidate.location?.lat &&
            candidate.location?.lng
          ) {
            const dist = haversineDistance(
              currentProblem.location.lat,
              currentProblem.location.lng,
              candidate.location.lat,
              candidate.location.lng
            );
            if (dist <= 750) { // within 750 meters
              spatialMatch = true;
            }
          } else if (
            currentProblem.district &&
            candidate.district &&
            currentProblem.district.toLowerCase() === candidate.district.toLowerCase()
          ) {
            spatialMatch = true;
          }

          const sim = computeTextSimilarity(
            `${currentProblem.title} ${currentProblem.description}`,
            `${candidate.title} ${candidate.description}`
          );

          if ((spatialMatch && sim >= 0.30) || sim >= 0.65) {
            duplicateOf = candidate._id;
            console.log(`🔍 [AI Worker] Deduplication match: Problem ${problemId} is duplicate of ${candidate._id} (dist match: ${spatialMatch}, text sim: ${sim.toFixed(2)})`);
            break;
          }
        }
      }
    } catch (dedupeErr) {
      console.warn('⚠️ [AI Worker] Deduplication check skipped:', dedupeErr.message);
    }

    // 3. Send result to Backend via Internal API
    try {
      const internalApiUrl = process.env.INTERNAL_API_URL || 'http://localhost:3000';
      await axios.patch(
        `${internalApiUrl}/api/internal/problems/${problemId}`,
        {
          category,
          priority: duplicateOf ? 'high' : priority,
          confidence,
          status: 'verified',
          duplicate_of: duplicateOf,
        },
        {
          headers: {
            'x-internal-api-key': process.env.INTERNAL_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`✅ [Worker] Problem ${problemId} updated successfully (duplicate_of: ${duplicateOf || 'none'})`);
      return { success: true, category, priority: duplicateOf ? 'high' : priority, confidence, duplicateOf };
    } catch (error) {
      console.error(`❌ [Worker] Failed to update problem ${problemId}:`, error.message);
      throw error; // BullMQ retries automatically
    }
  },
  {
    connection: redis,
    concurrency: 2,
    limiter: {
      max: 30,          // Maximum 30 requests per minute (strictly <= 35 RPM limit)
      duration: 60000,  // 1 minute window
    },
  }
);

worker.on('completed', (job) => {
  console.log(`✅ [Worker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ [Worker] Job ${job.id} failed: ${err.message}`);
});

console.log('🚀 NVIDIA AI Worker started with 35 RPM Rate Limiter protection! Waiting for jobs...');

module.exports = worker;