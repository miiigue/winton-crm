const pool = require('../config/db').pool;

// --- Campañas Globales ---
exports.getAllCampaigns = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM campaigns ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error cargando campañas' });
    }
};

exports.createCampaign = async (req, res) => {
    const { name, description } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO campaigns (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creando campaña' });
    }
};

// --- Scripts de una Campaña ---
exports.getCampaignScripts = async (req, res) => {
    const { campaignId } = req.params;
    try {
        // Obtenemos scripts ordenados
        const { rows } = await pool.query(
            'SELECT * FROM campaign_scripts WHERE campaign_id = $1 ORDER BY step_order ASC, id ASC',
            [campaignId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error cargando scripts' });
    }
};

exports.addScript = async (req, res) => {
    const { campaignId } = req.params;
    const { title, content, step_order } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO campaign_scripts (campaign_id, title, content, step_order) VALUES ($1, $2, $3, COALESCE($4, 0)) RETURNING *',
            [campaignId, title, content, step_order]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error añadiendo script' });
    }
};

exports.updateScript = async (req, res) => {
    const { scriptId } = req.params;
    const { title, content } = req.body;
    try {
        const { rows } = await pool.query(
            'UPDATE campaign_scripts SET title = $1, content = $2 WHERE id = $3 RETURNING *',
            [title, content, scriptId]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Script no encontrado' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error actualizando script' });
    }
};

exports.deleteScript = async (req, res) => {
    const { scriptId } = req.params;
    try {
        await pool.query('DELETE FROM campaign_scripts WHERE id = $1', [scriptId]);
        res.json({ message: 'Script eliminado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error eliminando script' });
    }
};
