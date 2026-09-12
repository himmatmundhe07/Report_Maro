// routes/project.routes.js
const express = require('express');
const { getProjects, getProjectById, submitProposal, fundProject, updateMilestone } = require('../controllers/project.controller');
const authMiddleware = require('../middleware/auth.middleware');
const rbacMiddleware = require('../middleware/rbac.middlewre');

const router = express.Router();

// List & Detail
router.get('/', authMiddleware, getProjects);
router.get('/:id', authMiddleware, getProjectById);

// University: Submit proposal
router.post('/:id/proposal', authMiddleware, rbacMiddleware(['university']), submitProposal);

// University & Mentors: Update milestone
router.put('/:id/milestones/:idx', authMiddleware, rbacMiddleware(['university', 'admin']), updateMilestone);

// Industry: Fund project
router.put('/:id/fund', authMiddleware, rbacMiddleware(['industry']), fundProject);

module.exports = router;