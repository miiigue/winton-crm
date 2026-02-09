const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', authController.login);
// CRUD Agentes (Admin)
router.post('/register', authMiddleware.authenticate, authMiddleware.isAdmin, authController.registerAgent);
router.get('/agents', authMiddleware.authenticate, authMiddleware.isAdmin, authController.listAgents);
router.delete('/agents/:id', authMiddleware.authenticate, authMiddleware.isAdmin, authController.deleteAgent);
router.patch('/agents/:id/password', authMiddleware.authenticate, authMiddleware.isAdmin, authController.updateAgentPassword);


module.exports = router;
