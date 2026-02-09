const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'winton_crm', // Base de datos separada
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

pool.on('error', (err) => {
    console.error('Error inesperado en cliente PG inactivo', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
