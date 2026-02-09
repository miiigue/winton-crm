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

async function checkTables() {
    try {
        console.log('Conectando a base de datos winton_crm...');
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        `);
        
        console.log('Tablas encontradas:');
        if (res.rows.length === 0) {
            console.log('Warning: NO SE ENCONTRARON TABLAS (Base de datos vacía)');
        } else {
            res.rows.forEach(row => console.log(` - ${row.table_name}`));
        }
    } catch (err) {
        console.error('Error conectando:', err);
    } finally {
        await pool.end();
    }
}

checkTables();
