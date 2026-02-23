const pool = require('../config/db').pool;
const bcrypt = require('bcrypt');

async function initDB() {
    console.log('🔄 Verificando esquema de base de datos...');

    try {
        // 1. Tabla de Usuarios
        await pool.query(`
            CREATE TABLE IF NOT EXISTS crm_users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role VARCHAR(20) DEFAULT 'agent',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Tabla de Influencers
        await pool.query(`
            CREATE TABLE IF NOT EXISTS influencers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                platform VARCHAR(50),
                profile_url TEXT UNIQUE NOT NULL,
                followers_count INTEGER DEFAULT 0,
                status VARCHAR(50) DEFAULT 'pending',
                assigned_to INTEGER REFERENCES crm_users(id),
                budget_offer NUMERIC(10, 2),
                currency VARCHAR(10) DEFAULT 'USD',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2.5 MIGRACIÓN AUTOMÁTICA: Agregar columnas nuevas a influencers
        try {
            await pool.query(`
                ALTER TABLE influencers 
                ADD COLUMN IF NOT EXISTS country VARCHAR(100),
                ADD COLUMN IF NOT EXISTS niche VARCHAR(100),
                ADD COLUMN IF NOT EXISTS avg_views INTEGER DEFAULT 0,
                ADD COLUMN IF NOT EXISTS email VARCHAR(150);
            `);
            console.log('✅ Columnas extra verificadas en influencers.');
        } catch (e) {
            console.log('ℹ️ Nota: Error menor verificando columnas influencers:', e.message);
        }

        // 3. Tabla de Interacciones
        await pool.query(`
            CREATE TABLE IF NOT EXISTS interactions (
                id SERIAL PRIMARY KEY,
                influencer_id INTEGER REFERENCES influencers(id) ON DELETE CASCADE,
                agent_id INTEGER REFERENCES crm_users(id),
                type VARCHAR(50),
                notes TEXT,
                screenshot_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 4. Tabla de Campañas
        await pool.query(`
            CREATE TABLE IF NOT EXISTS campaigns (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                status VARCHAR(20) DEFAULT 'active', -- active, paused, finished
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 4.5 MIGRACIÓN AUTOMÁTICA: Agregar target_config si no existe
        try {
            await pool.query(`
                ALTER TABLE campaigns 
                ADD COLUMN IF NOT EXISTS target_config JSONB DEFAULT '{}',
                ADD COLUMN IF NOT EXISTS require_all_fields BOOLEAN DEFAULT FALSE;
            `);
            console.log('✅ Columnas target_config y require_all_fields verificadas en campaigns.');
        } catch (e) {
            console.log('ℹ️ Nota: Error menor verificando columnas en campaigns:', e.message);
        }

        // 5. Tabla de Scripts (Corrección: Nombre correcto campaign_scripts)
        try {
            // Intento de migración: Si existe la tabla vieja 'scripts' y no la nueva, renombrarla.
            // Esto evita perder datos si se creó con el nombre incorrecto.
            await pool.query('ALTER TABLE IF EXISTS scripts RENAME TO campaign_scripts');
            console.log('🔄 Migración: Tabla scripts renombrada a campaign_scripts.');
        } catch (e) {
            // Ignorar error si ya existe campaign_scripts o si scripts no existe (Postgres < 9.2 sin IF EXISTS)
        }

        await pool.query(`
            CREATE TABLE IF NOT EXISTS campaign_scripts (
                id SERIAL PRIMARY KEY,
                campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
                title VARCHAR(100),
                content TEXT NOT NULL,
                is_global BOOLEAN DEFAULT FALSE,
                step_order INTEGER DEFAULT 0
            );
        `);

        // 6. Configuración Global (Settings)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS global_settings (
                key VARCHAR(50) PRIMARY KEY,
                value JSONB
            );
        `);

        console.log('✅ Tablas verificadas/creadas correctamente.');

        // Crear usuario admin por defecto si no existe ninguno
        const userCount = await pool.query('SELECT COUNT(*) FROM crm_users');
        if (parseInt(userCount.rows[0].count) === 0) {
            console.log('👤 Creando usuario admin por defecto...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query(
                "INSERT INTO crm_users (username, password_hash, role) VALUES ($1, $2, 'admin')",
                ['admin', hashedPassword]
            );
            console.log('✅ Admin creado: admin / admin123');
        }

    } catch (err) {
        console.error('❌ Error inicializando base de datos:', err);
    }
}

module.exports = initDB;
