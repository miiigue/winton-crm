const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Importar Controladores y Middleware
const authMiddleware = require('./middleware/authMiddleware');
const settingsController = require('./controllers/settingsController');
const authRoutes = require('./routes/authRoutes');
const influencerRoutes = require('./routes/influencerRoutes');

// Middleware Global
app.use(cors());
app.use(express.json()); // Body parser para JSON

// Servir frontend estático
app.use(express.static(path.join(__dirname, '../frontend')));

// Ruta Raíz (Frontend)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Rutas API - Settings (Scripts)
app.get('/api/settings', authMiddleware.authenticate, settingsController.getSettings);
app.post('/api/settings', authMiddleware.authenticate, authMiddleware.isAdmin, settingsController.updateSettings);

// Rutas API - Módulos Principales
app.use('/api/auth', authRoutes);
const campaignRoutes = require('./routes/campaignRoutes');
app.use('/api/campaigns', campaignRoutes);
const reportsRoutes = require('./routes/reportsRoutes');
app.use('/api/reports', reportsRoutes);
app.use('/api/influencers', influencerRoutes);

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Algo salió mal en el servidor CRM!' });
});

// Iniciar Servidor
app.listen(PORT, () => {
    console.log(`🚀 Winton CRM Server corriendo en http://localhost:${PORT}`);
});
