const express = require('express');
const router = express.Router();
const influencerController = require('../controllers/influencerController');
const authMiddleware = require('../middleware/authMiddleware');

// Listar todos los leads (influencers)
router.get('/', authMiddleware.authenticate, influencerController.getLeads);

// Crear nuevo lead (Ahora permitido para Agentes Prospectors)
router.post('/', authMiddleware.authenticate, influencerController.createLead);

// Asignar lead a agente (Solo Admin)
router.post('/assign', authMiddleware.authenticate, authMiddleware.isAdmin, influencerController.assignLead);

// Registro masivo y validación por lote
router.post('/validate-batch', authMiddleware.authenticate, influencerController.validateBatch);
router.post('/bulk-create', authMiddleware.authenticate, influencerController.bulkCreate);

// Registrar interacción (mensaje enviado, respuesta recibida)
// Esta es la ruta principal que usarán los agentes
router.post('/interactions', authMiddleware.authenticate, influencerController.logInteraction);

module.exports = router;
