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

async function insertIntrigueCampaign() {
    try {
        console.log('🚀 Creando Campaña de Intriga...');

        // 1. Crear la Campaña
        const campRes = await pool.query(`
            INSERT INTO campaigns (name, description) 
            VALUES ('Campaña Intriga BLUE iou', 'Estrategia de reclutamiento de fundadores mediante tokens BLUE iou') 
            RETURNING id
        `);
        const campId = campRes.rows[0].id;
        console.log(`✅ Campaña creada con ID: ${campId}`);

        // 2. Definir los Scripts del Árbol
        const scripts = [
            {
                title: '1. Gancho (Intriga)',
                content: "Hola! 👋 Te sigo hace tiempo y tu perfil encaja con el *Círculo Fundador* que estamos armando para una nueva fintech en LATAM. 🤫\n\nNo es publicidad tradicional. ¿Te gustaría saber de qué se trata antes de que lo hagamos público?",
                step: 1
            },
            {
                title: '2. Explicación (WintonCoin)',
                content: "Es sobre WintonCoin. 🌐 Estamos en fase *stealth* (pre-lanzamiento) y seleccionando a 50 creadores clave para recibir 'BLUE iou', nuestros tokens de fundadores.\n\nNo buscamos un post pagado ahora, buscamos *partners* que crezcan con el valor del proyecto. ¿Te interesa ver el ecosistema?",
                step: 2
            },
            {
                title: '3. La Oferta (BLUE iou)',
                content: "Justo eso es lo diferente. 💎 No pagamos en fiat por ahora porque estamos repartiendo *equity* del protocolo a través de BLUE iou.\n\nEs una apuesta a largo plazo: creas contenido hoy, y si el token sube, tu pago se multiplica. ¿Sueles trabajar con modelos de *vesting* o tokens?",
                step: 3
            },
            {
                title: '4. Cierre (Onboarding)',
                content: "¡Brutal! 🚀 El primer paso es registrarte en la whitelist de agentes.\n\n🔗 [Link de Registro]\n\nAvísame cuando te registres para asignarte tus primeros 1,000 BLUE iou de bienvenida. ¡Bienvenido al equipo!",
                step: 4
            },
            {
                title: '5. Objeción (Solo Fiat)',
                content: "Te entiendo perfectamente 100%. 🤝\n\nHagamos esto: Mantente en mi radar. Cuando lancemos la fase pública con presupuesto en USD, te buscaré primero. ¡Un abrazo!",
                step: 5
            }
        ];

        // 3. Insertar Scripts
        for (const s of scripts) {
            await pool.query(
                'INSERT INTO campaign_scripts (campaign_id, title, content, step_order) VALUES ($1, $2, $3, $4)',
                [campId, s.title, s.content, s.step]
            );
        }
        console.log('✅ Scripts insertados correctamente.');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        pool.end();
    }
}

insertIntrigueCampaign();
