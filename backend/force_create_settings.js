const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function forceCreateSettings() {
    try {
        console.log('Conectando a DB para crear tabla settings...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                key VARCHAR(50) PRIMARY KEY,
                value TEXT NOT NULL
            );
        `);
        console.log('✅ Tabla system_settings creada (o ya existía).');

        const defaultMessage = "Hola! 👋\n\nSoy parte del equipo de WintonCoin, un proyecto fintech en crecimiento en LATAM.\n\nEstamos colaborando con creadores para campañas pagas y quería consultarte si trabajas con promociones.\n\n¿Podrías compartirme tu media kit o tarifas?\n\nGracias!";

        await pool.query(`
            INSERT INTO system_settings (key, value)
            VALUES ('outreach_message', $1)
            ON CONFLICT (key) DO NOTHING;
        `, [defaultMessage]);

        console.log('✅ Mensaje por defecto asegurado.');

    } catch (err) {
        console.error('❌ Error creando tabla:', err);
    } finally {
        pool.end();
    }
}

forceCreateSettings();
