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

const addColumns = async () => {
    try {
        console.log('🔄 Añadiendo columnas faltantes a la tabla influencers...');

        // Añadir columnas si no existen
        await pool.query(`
            ALTER TABLE influencers 
            ADD COLUMN IF NOT EXISTS country VARCHAR(100),
            ADD COLUMN IF NOT EXISTS niche VARCHAR(100),
            ADD COLUMN IF NOT EXISTS avg_views INTEGER,
            ADD COLUMN IF NOT EXISTS email VARCHAR(255);
        `);

        console.log('✅ Columnas añadidas correctamente: country, niche, avg_views, email');
    } catch (err) {
        console.error('❌ Error actualizando tabla:', err);
    } finally {
        pool.end();
    }
};

addColumns();
