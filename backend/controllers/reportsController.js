const pool = require('../config/db').pool;

exports.getActivityFeed = async (req, res) => {
    try {
        const query = `
            SELECT 
                al.id,
                al.type as action_type,
                al.notes,
                al.created_at, 
                u.username as agent_name,
                i.name as influencer_name,
                i.platform
            FROM interactions al
            JOIN crm_users u ON al.agent_id = u.id
            JOIN influencers i ON al.influencer_id = i.id
            ORDER BY al.created_at DESC
            LIMIT 50;
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error('Error getActivityFeed:', err.message);
        res.status(500).json({ error: 'Error cargando feed' });
    }
};

exports.getStats = async (req, res) => {
    try {
        const totalLeads = await pool.query('SELECT COUNT(*) FROM influencers');
        const closedDeals = await pool.query("SELECT COUNT(*) FROM influencers WHERE status = 'closed'");
        const todayLogs = await pool.query("SELECT COUNT(*) FROM interactions WHERE created_at >= NOW() - INTERVAL '24 HOURS'");

        res.json({
            total_leads: parseInt(totalLeads.rows[0].count),
            closed_deals: parseInt(closedDeals.rows[0].count),
            today_activity: parseInt(todayLogs.rows[0].count)
        });
    } catch (err) {
        console.error('Error getStats:', err.message);
        res.status(500).json({ error: 'Error stats' });
    }
};

exports.getAgentLeaderboard = async (req, res) => {
    try {
        // Obtenemos también el ID del agente para crear el Link
        const query = `
            SELECT 
                u.id as agent_id, 
                u.username,
                COUNT(DISTINCT i.id) as assigned_leads,
                COUNT(CASE WHEN i.status = 'closed' THEN 1 END) as closed_deals,
                MAX(inte.created_at) as last_activity
            FROM crm_users u
            LEFT JOIN influencers i ON i.assigned_to = u.id
            LEFT JOIN interactions inte ON inte.agent_id = u.id
            WHERE u.role = 'agent'
            GROUP BY u.id, u.username
            ORDER BY closed_deals DESC, assigned_leads DESC;
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error('Error leaderboard:', err.message);
        res.status(500).json({ error: 'Error cargando leaderboard' });
    }
};

// NUEVO: Detalle de Agente (Auditoría)
exports.getAgentDetail = async (req, res) => {
    const { agentId } = req.params;
    try {
        // 1. Perfil básico
        const agentRes = await pool.query('SELECT id, username, created_at FROM crm_users WHERE id = $1', [agentId]);
        if (agentRes.rows.length === 0) return res.status(404).json({ error: 'Agente no encontrado' });

        const agent = agentRes.rows[0];

        // 2. Leads asignados (Resumen)
        const leadsRes = await pool.query(`
            SELECT id, name, platform, status, followers_count, profile_url 
            FROM influencers 
            WHERE assigned_to = $1 
            ORDER BY created_at DESC
        `, [agentId]);

        // 3. Historial Completo de Interacciones
        const historyRes = await pool.query(`
            SELECT 
                inte.id, inte.influencer_id, inte.type, inte.notes, inte.created_at, inte.screenshot_url,
                i.name as influencer_name, i.platform
            FROM interactions inte
            JOIN influencers i ON inte.influencer_id = i.id
            WHERE inte.agent_id = $1
            ORDER BY inte.created_at DESC
        `, [agentId]);

        res.json({
            agent: agent,
            leads: leadsRes.rows,
            history: historyRes.rows
        });

    } catch (err) {
        console.error('Error agent detail:', err.message);
        res.status(500).json({ error: 'Error cargando detalle de agente' });
    }
};
