const pool = require('../config/db').pool;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM crm_users WHERE username = $1', [username]);

        if (result.rows.length === 0) {
            // Lógica de admin inicial (mantener igual)
            const userCount = await pool.query('SELECT COUNT(*) FROM crm_users');
            if (parseInt(userCount.rows[0].count) === 0 && username === 'admin' && password === 'admin123') {
                const hashedPassword = await bcrypt.hash('admin123', 10);
                const newUser = await pool.query(
                    "INSERT INTO crm_users (username, password_hash, role) VALUES ($1, $2, 'admin') RETURNING *",
                    ['admin', hashedPassword]
                );
                const token = jwt.sign({ id: newUser.id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
                return res.json({ token, role: 'admin', username: 'admin' });
            }
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, role: user.role, username: user.username, id: user.id }); // Devuelvo ID también

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.registerAgent = async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            "INSERT INTO crm_users (username, password_hash, role) VALUES ($1, $2, $3)",
            [username, hashedPassword, role || 'agent']
        );
        res.status(201).json({ message: 'Usuario creado exitosamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creando usuario' });
    }
};

// Listar agentes (para el admin)
exports.listAgents = async (req, res) => {
    try {
        // Agrego created_at para mostrar cuándo se unieron
        const result = await pool.query("SELECT id, username, role, created_at FROM crm_users WHERE role = 'agent' ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error obteniendo agentes' });
    }
};

// Eliminar Agente (y liberar sus leads)
exports.deleteAgent = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Liberar leads asignados (poner en NULL o asignar a admin si se prefiere, por ahora NULL)
        await pool.query("UPDATE influencers SET assigned_to = NULL WHERE assigned_to = $1", [id]);

        // 2. Borrar usuario
        await pool.query("DELETE FROM crm_users WHERE id = $1 AND role = 'agent'", [id]);

        res.json({ message: 'Agente eliminado y leads liberados' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error eliminando agente' });
    }
};

// Cambiar Contraseña de Agente
exports.updateAgentPassword = async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) return res.status(400).json({ error: 'Falta nueva contraseña' });

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query("UPDATE crm_users SET password_hash = $1 WHERE id = $2", [hashedPassword, id]);
        res.json({ message: 'Contraseña actualizada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error actualizando contraseña' });
    }
};
