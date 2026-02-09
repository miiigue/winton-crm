const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const connectionString = `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/postgres`;

async function createCrmDatabase() {
    const client = new Pool({ connectionString });
    try {
        await client.connect();
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'winton_crm'");
        if (res.rowCount === 0) {
            await client.query('CREATE DATABASE winton_crm');
            console.log('✅ Base de datos winton_crm creada exitosamente.');
        } else {
            console.log('ℹ️ La base de datos winton_crm ya existe.');
        }
    } catch (err) {
        console.error('❌ Error creando la base de datos:', err);
    } finally {
        await client.end();
    }
}

async function initTables() {
    const pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: 'winton_crm',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
    });

    try {
        // Tabla de Usuarios del CRM (Staff)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS crm_users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role VARCHAR(20) DEFAULT 'agent', -- 'admin' o 'agent'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tabla de Leads (Influencers)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS influencers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                platform VARCHAR(50), -- Instagram, TikTok, YouTube
                profile_url TEXT UNIQUE NOT NULL,
                followers_count INTEGER DEFAULT 0,
                status VARCHAR(50) DEFAULT 'pending', -- pending, contacted, negotiating, closed, rejected
                assigned_to INTEGER REFERENCES crm_users(id),
                budget_offer NUMERIC(10, 2),
                currency VARCHAR(10) DEFAULT 'USD',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tabla de Interacciones (Historial)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS interactions (
                id SERIAL PRIMARY KEY,
                influencer_id INTEGER REFERENCES influencers(id) ON DELETE CASCADE,
                agent_id INTEGER REFERENCES crm_users(id),
                type VARCHAR(50), -- initial_message, follow_up, negotiation, deal_closed
                notes TEXT,
                screenshot_url TEXT, -- OBLIGATORIO para validar trabajo
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ Tablas Winton CRM inicializadas correctamente.');
    } catch (err) {
        console.error('❌ Error inicializando tablas:', err);
    } finally {
        await pool.end();
    }
}

(async () => {
    await createCrmDatabase();
    await initTables();
})();
