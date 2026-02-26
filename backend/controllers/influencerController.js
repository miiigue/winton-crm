const pool = require('../config/db').pool;

// Listar influencers
exports.getLeads = async (req, res) => {
    const { status, assigned_to } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    let query = `
        SELECT i.*, 
            (SELECT notes FROM interactions WHERE influencer_id = i.id ORDER BY created_at DESC LIMIT 1) as last_note,
            (SELECT created_at FROM interactions WHERE influencer_id = i.id ORDER BY created_at DESC LIMIT 1) as last_interaction_date
        FROM influencers i 
        WHERE 1=1
    `;
    let params = [];

    // SI ES AGENTE: Forzar que solo vea sus propios leads
    if (userRole === 'agent') {
        query += ' AND i.assigned_to = $1';
        params.push(userId);
    } else {
        // SI ES ADMIN: Puede filtrar por cualquier agente si lo desea
        if (assigned_to) {
            query += ' AND i.assigned_to = $1';
            params.push(assigned_to);
        }
    }

    if (status) {
        const statusParamIndex = params.length + 1;
        query += ` AND i.status = $${statusParamIndex}`;
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

// --- OPERACIONES MASIVAS (BATCH) ---

// Validar lote antes de importar
exports.validateBatch = async (req, res) => {
    const { items } = req.body; // Array de {name, profile_url}
    if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'Formato inválido' });

    try {
        const results = [];
        for (const item of items) {
            // Buscamos si existe por Nombre o por Link
            const { rows } = await pool.query(
                `SELECT i.name, i.profile_url, u.username as owner 
                 FROM influencers i 
                 LEFT JOIN crm_users u ON i.assigned_to = u.id 
                 WHERE i.name = $1 OR (i.profile_url != '' AND i.profile_url = $2)`,
                [item.name, item.profile_url]
            );

            if (rows.length > 0) {
                results.push({
                    ...item,
                    status: 'conflict',
                    owner: rows[0].owner,
                    message: `Ya registrado por ${rows[0].owner}`
                });
            } else {
                results.push({ ...item, status: 'ok' });
            }
        }
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error validando lote' });
    }
};

// Creación Masiva
exports.bulkCreate = async (req, res) => {
    const { items } = req.body;
    const agentId = req.user.id;

    if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'Formato inválido' });

    try {
        let count = 0;
        for (const item of items) {
            // Verificación manual de existencia (Nombre o Link)
            // Esto es más seguro que ON CONFLICT si las restricciones fallaron en la migración
            const { rows: existing } = await pool.query(
                "SELECT id FROM influencers WHERE name = $1 OR (profile_url != '' AND profile_url = $2) LIMIT 1",
                [item.name, item.profile_url]
            );

            if (existing.length === 0) {
                const query = `
                    INSERT INTO influencers 
                    (name, platform, profile_url, followers_count, assigned_to, status, country, niche, avg_views, email) 
                    VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, $9)
                `;
                const params = [
                    item.name,
                    item.platform || 'Instagram',
                    item.profile_url || '',
                    item.followers_count || 0,
                    agentId,
                    item.country || '',
                    item.niche || '',
                    item.avg_views || 0,
                    item.email || ''
                ];

                await pool.query(query, params);
                count++;
            }
        }
        res.json({ message: `Se han importado ${count} prospectos exitosamente.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en la importación masiva' });
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

// Actualizar un prospecto (Edición de datos tácticos)
exports.updateLead = async (req, res) => {
    const { id } = req.params;
    const { name, platform, profile_url, followers_count, country, niche, avg_views, email, status } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // Verificar propiedad antes de editar (si no es admin)
        if (userRole !== 'admin') {
            const { rows: check } = await pool.query('SELECT assigned_to FROM influencers WHERE id = $1', [id]);
            if (check.length === 0 || check[0].assigned_to !== userId) {
                return res.status(403).json({ error: 'No tienes permiso para editar este prospecto' });
            }
        }

        const query = `
            UPDATE influencers 
            SET name = $1, platform = $2, profile_url = $3, followers_count = $4, country = $5, 
                niche = $6, avg_views = $7, email = $8, status = $9, updated_at = NOW() 
            WHERE id = $10 
            RETURNING *
        `;
        const params = [name, platform, profile_url, followers_count, country, niche, avg_views, email, status, id];

        const { rows } = await pool.query(query, params);
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error actualizando prospecto' });
    }
};

// Borrado Masivo (Bulk Delete)
exports.deleteLeads = async (req, res) => {
    const { ids } = req.body; // Array de IDs
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'Formato inválido' });

    try {
        let deletedCount = 0;
        if (userRole === 'admin') {
            const { rowCount } = await pool.query('DELETE FROM influencers WHERE id = ANY($1)', [ids]);
            deletedCount = rowCount;
        } else {
            // Un agente solo borra los suyos
            const { rowCount } = await pool.query('DELETE FROM influencers WHERE id = ANY($1) AND assigned_to = $2', [ids, userId]);
            deletedCount = rowCount;
        }
        res.json({ message: `Se han eliminado ${deletedCount} prospectos exitosamente.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error eliminando prospectos' });
    }
};

