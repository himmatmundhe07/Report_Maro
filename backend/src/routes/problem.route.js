// routes/problem.routes.js
const express = require('express');
const {
  createProblem,
  getProblems,
  getProblemById,
  assignProblem,
  getStats,
  submitFeedback,
} = require('../controllers/problem.controller');
const authMiddleware = require('../middleware/auth.middleware');
const rbacMiddleware = require('../middleware/rbac.middlewre');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

// Citizen routes
router.post(
  '/',
  authMiddleware,
  rbacMiddleware(['citizen']),
  upload.array('images', 5),
  createProblem
);

// All authenticated users
router.get('/', authMiddleware, getProblems);
router.get('/:id', authMiddleware, getProblemById);

// Admin & Government
router.put('/:id/assign', authMiddleware, rbacMiddleware(['admin', 'government']), assignProblem);
router.get('/stats/dashboard', authMiddleware, rbacMiddleware(['admin', 'government']), getStats);

// Citizen Resolution Feedback
router.post('/:id/feedback', authMiddleware, rbacMiddleware(['citizen', 'admin']), submitFeedback);

module.exports = router;