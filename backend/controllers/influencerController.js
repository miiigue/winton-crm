const pool = require('../config/db').pool;

// Listar influencers
exports.getLeads = async (req, res) => {
    const { status, assigned_to } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    let query = 'SELECT * FROM influencers WHERE 1=1';
    let params = [];

    // SI ES AGENTE: Forzar que solo vea sus propios leads
    if (userRole === 'agent') {
        query += ' AND assigned_to = $1';
        params.push(userId);
    } else {
        // SI ES ADMIN: Puede filtrar por cualquier agente si lo desea
        if (assigned_to) {
            query += ' AND assigned_to = $1';
            params.push(assigned_to);
        }
    }

    if (status) {
        const statusParamIndex = params.length + 1;
        query += ` AND status = $${statusParamIndex}`;
        params.push(status);
    }

    try {
        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Crear nuevo influencer (Lead) - Ahora permitido para Agentes (Prospectors)
// Crear nuevo influencer (Lead) - Ahora permitido para Agentes (Prospectors)
// Crear nuevo influencer (Lead)
exports.createLead = async (req, res) => {
    const { name, platform, profile_url, followers_count, country, niche, avg_views, email } = req.body;
    const agentId = req.user.id;

    // Solo validamos Nombre y Plataforma como base absoluta
    if (!name || !platform) {
        return res.status(400).json({ error: 'El Nombre/Handle y la Plataforma son obligatorios' });
    }

    try {
        const { rows } = await pool.query(
            'INSERT INTO influencers (name, platform, profile_url, followers_count, assigned_to, status, country, niche, avg_views, email) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
            [name, platform, profile_url || '', followers_count || 0, agentId, 'pending', country, niche, avg_views || 0, email]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        // Manejo amigable de errores de duplicados (Postgres code 23505)
        if (err.code === '23505') {
            if (err.constraint === 'influencers_profile_url_key') {
                return res.status(400).json({ error: '⚠️ Este enlace de perfil ya ha sido registrado por otro agente.' });
            }
            if (err.constraint === 'influencers_name_key') {
                return res.status(400).json({ error: '⚠️ Este Nombre/Handle ya existe en el sistema.' });
            }
            return res.status(400).json({ error: '⚠️ Ya existe un registro con estos datos.' });
        }

        console.error(err);
        res.status(500).json({ error: 'Error interno al registrar el prospecto' });
    }
};

// Asignar influencer a agente
exports.assignLead = async (req, res) => {
    const { leadId, agentId } = req.body;
    try {
        await pool.query('UPDATE influencers SET assigned_to = $1 WHERE id = $2', [agentId, leadId]);
        res.json({ message: 'Asignado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Registrar interacción y cambiar estado (CORE FUNCTIONALITY)
exports.logInteraction = async (req, res) => {
    const { leadIds, type, notes, screenshot_url, new_status, budget_offer } = req.body;
    const agentId = req.user.id; // Asumiendo middleware de auth

    try {
        // Permitir actualizar múltiples leads a la vez (por ejemplo, "Contactar a todos")
        const ids = Array.isArray(leadIds) ? leadIds : [leadIds];

        for (const leadId of ids) {
            // 1. Guardar la interacción
            await pool.query(
                'INSERT INTO interactions (influencer_id, agent_id, type, notes, screenshot_url) VALUES ($1, $2, $3, $4, $5)',
                [leadId, agentId, type, notes, screenshot_url]
            );

            // 2. Actualizar el estado del lead si se especifica
            if (new_status) {
                await pool.query(
                    'UPDATE influencers SET status = $1, updated_at = NOW() WHERE id = $2',
                    [new_status, leadId]
                );
            }

            // 3. Si hay oferta de presupuesto, actualizarla
            if (budget_offer) {
                await pool.query(
                    'UPDATE influencers SET budget_offer = $1 WHERE id = $2',
                    [budget_offer, leadId]
                );
            }
        }

        res.json({ message: 'Interacción registrada exitosamente' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error registrando interacción' });
    }
};
