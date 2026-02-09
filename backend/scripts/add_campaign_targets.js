const pool = require('../config/db').pool;

async function addTargetConfigColumn() {
    console.log('🔄 Agregando columna target_config a la tabla campaigns...');
    try {
        await pool.query(`
            ALTER TABLE campaigns 
            ADD COLUMN IF NOT EXISTS target_config JSONB DEFAULT '{}';
        `);
        console.log('✅ Columna target_config agregada correctamente.');
    } catch (err) {
        console.error('❌ Error actualizando tabla campaigns:', err);
    } finally {
        // No cerramos el pool aquí si se usa en un flujo continuo, 
        // pero para un script standalone sí.
        process.exit();
    }
}

addTargetConfigColumn();
