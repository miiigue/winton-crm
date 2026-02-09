const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const authMiddleware = require('../middleware/authMiddleware');

// Solo Admin puede ver reportes completos
router.get('/feed', authMiddleware.authenticate, authMiddleware.isAdmin, reportsController.getActivityFeed);
router.get('/stats', authMiddleware.authenticate, authMiddleware.isAdmin, reportsController.getStats);
router.get('/leaderboard', authMiddleware.authenticate, authMiddleware.isAdmin, reportsController.getAgentLeaderboard);
router.get('/agent/:agentId', authMiddleware.authenticate, authMiddleware.isAdmin, reportsController.getAgentDetail);

module.exports = router;
