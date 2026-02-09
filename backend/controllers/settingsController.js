const pool = require('../config/db').pool;

// Scripts por defecto (Hardcoded fallback)
const DEFAULT_SCRIPTS = {
    initial: "Hola! 👋\n\nSoy parte del equipo de WintonCoin, un proyecto fintech en crecimiento en LATAM.\n\nEstamos colaborando con creadores para campañas pagas y quería consultarte si trabajas con promociones.\n\n¿Podrías compartirme tu media kit o tarifas?\n\nGracias!",
    reply_rates: "Gracias por la info! 🚀\n\nEstamos revisando tu perfil y nos encaja bastante. ¿Podrías confirmarme si aceptas pago en cripto (stablecoins) o solo fiat?\n\nQuedo atento.",
    reply_collab: "Genial! Nos gustaría proponerte una colaboración para un Reel de 30-60s explicando cómo usar WintonCoin.\n\n¿Tendrías disponibilidad para publicar esta semana?",
    follow_up: "Hola de nuevo! 👋\n\nQuería saber si pudiste ver mi mensaje anterior. Estamos cerrando el presupuesto de campañas de este mes y nos encantaría contarte.\n\nAvísame!"
};

exports.getSettings = async (req, res) => {
    try {
        // Intentar leer de DB
        const result = await pool.query("SELECT * FROM information_schema.tables WHERE table_name = 'system_settings'");

        // Si no existe tabla, devolver defaults sin error
        if (result.rows.length === 0) {
            console.log('⚠️ Tabla system_settings no encontrada, usando defaults en memoria.');
            return res.json(DEFAULT_SCRIPTS);
        }

        const { rows } = await pool.query("SELECT * FROM system_settings WHERE key LIKE 'script_%'");

        // Si la tabla existe pero está vacía de scripts, devolver defaults
        if (rows.length === 0) {
            return res.json(DEFAULT_SCRIPTS);
        }

        // Construir objeto desde DB (esperamos claves como 'script_initial', 'script_follow_up')
        const settings = {};
        rows.forEach(row => {
            const cleanKey = row.key.replace('script_', '');
            settings[cleanKey] = row.value;
        });

        // Mezclar con defaults por si falta alguna
        const finalSettings = { ...DEFAULT_SCRIPTS, ...settings };
        res.json(finalSettings);

    } catch (err) {
        console.error('Error en getSettings (usando fallback):', err.message);
        res.json(DEFAULT_SCRIPTS);
    }
};

exports.updateSettings = async (req, res) => {
    const { key, value } = req.body; // key ej: 'initial'
    const dbKey = 'script_' + key;

    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                key VARCHAR(50) PRIMARY KEY,
                value TEXT NOT NULL
            );
        `);

        await pool.query(
            'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
            [dbKey, value]
        );
        res.json({ message: 'Script guardado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error guardando script' });
    }
};
