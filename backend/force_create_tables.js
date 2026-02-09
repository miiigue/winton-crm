const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'winton_crm',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function forceCreate() {
    console.log('Iniciando script de creación forzada de tablas...');
    try {
        await pool.query('CREATE TABLE IF NOT EXISTS crm_users (id SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, password_hash TEXT NOT NULL, role VARCHAR(20) DEFAULT \'agent\', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);');
        console.log('✅ Tabla crm_users creada/verificada.');

        await pool.query('CREATE TABLE IF NOT EXISTS influencers (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, platform VARCHAR(50), profile_url TEXT UNIQUE NOT NULL, followers_count INTEGER DEFAULT 0, status VARCHAR(50) DEFAULT \'pending\', assigned_to INTEGER REFERENCES crm_users(id), budget_offer NUMERIC(10, 2), currency VARCHAR(10) DEFAULT \'USD\', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);');
        console.log('✅ Tabla influencers creada/verificada.');

        await pool.query('CREATE TABLE IF NOT EXISTS interactions (id SERIAL PRIMARY KEY, influencer_id INTEGER REFERENCES influencers(id) ON DELETE CASCADE, agent_id INTEGER REFERENCES crm_users(id), type VARCHAR(50), notes TEXT, screenshot_url TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);');
        console.log('✅ Tabla interactions creada/verificada.');

    } catch (err) {
        console.error('❌ Error fatal creando tablas:', err);
    } finally {
        await pool.end();
    }
}

forceCreate();
