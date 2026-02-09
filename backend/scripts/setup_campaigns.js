const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function setupCampaigns() {
    try {
        console.log('📦 Configurando tablas de Campañas...');

        // 1. Tabla de Campañas
        await pool.query(`
            CREATE TABLE IF NOT EXISTS campaigns (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tabla campaigns creada.');

        // 2. Tabla de Scripts (Mensajes)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS campaign_scripts (
                id SERIAL PRIMARY KEY,
                campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
                title VARCHAR(100) NOT NULL,
                content TEXT NOT NULL,
                step_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tabla campaign_scripts creada.');

        // 3. Crear datos de ejemplo (Campaña Default) si está vacío
        const { rowCount } = await pool.query('SELECT * FROM campaigns');
        if (rowCount === 0) {
            console.log('🌱 Insertando campaña por defecto...');
            const campRes = await pool.query(`
                INSERT INTO campaigns (name, description) 
                VALUES ('Prospección General', 'Scripts estándar para contacto en IG/TikTok') 
                RETURNING id
            `);
            const campId = campRes.rows[0].id;

            const defaultScripts = [
                { title: '1. Primer Contacto', content: "Hola! 👋\n\nSoy parte del equipo de WintonCoin..." },
                { title: '2. Piden Info', content: "Claro! WintonCoin es un proyecto fintech..." },
                { title: '3. Acuerdo', content: "Genial, nos gustaría proponerte..." }
            ];

            for (let i = 0; i < defaultScripts.length; i++) {
                await pool.query(
                    'INSERT INTO campaign_scripts (campaign_id, title, content, step_order) VALUES ($1, $2, $3, $4)',
                    [campId, defaultScripts[i].title, defaultScripts[i].content, i]
                );
            }
        }

    } catch (err) {
        console.error('❌ Error setupCampaigns:', err);
    } finally {
        pool.end();
    }
}

setupCampaigns();
