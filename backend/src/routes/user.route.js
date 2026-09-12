// routes/user.route.js
//
// Additive route — see controllers/user.controller.js for why this exists.
const express = require('express');
const { getUsers, verifyUser } = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const rbacMiddleware = require('../middleware/rbac.middleware');

const router = express.Router();

// Any authenticated user can look up organizations by role
router.get('/', authMiddleware, getUsers);

// Admin can verify/clear users
router.patch('/:id/verify', authMiddleware, rbacMiddleware(['admin']), verifyUser);

module.exports = router;
