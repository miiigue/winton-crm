const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const authMiddleware = require('../middleware/authMiddleware');

// Rutas Públicas (Agents)
router.get('/', authMiddleware.authenticate, campaignController.getAllCampaigns);
router.get('/:campaignId/scripts', authMiddleware.authenticate, campaignController.getCampaignScripts);

// Rutas Privadas (Admin)
router.post('/', authMiddleware.authenticate, authMiddleware.isAdmin, campaignController.createCampaign); // Crear Campaña
router.post('/:campaignId/scripts', authMiddleware.authenticate, authMiddleware.isAdmin, campaignController.addScript); // Agregar Script
router.put('/scripts/:scriptId', authMiddleware.authenticate, authMiddleware.isAdmin, campaignController.updateScript); // Editar Script
router.delete('/scripts/:scriptId', authMiddleware.authenticate, authMiddleware.isAdmin, campaignController.deleteScript); // Eliminar Script

module.exports = router;
