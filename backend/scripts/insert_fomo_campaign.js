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

async function insertFomoCampaign() {
    try {
        console.log('🔥 Creando Campaña W Intriga (High FOMO)...');

        // 1. Crear la Campaña
        const campRes = await pool.query(`
            INSERT INTO campaigns (name, description) 
            VALUES ('Campaña W Intriga (High FOMO)', 'Estrategia agresiva de adopción temprana con Gesto W y BLUE iou') 
            RETURNING id
        `);
        const campId = campRes.rows[0].id;

        // 2. Insertar Scripts
        const scripts = [
            { title: '1. Gancho Misterio', content: "Ey 👋 te vi en el feed y tienes una vibra muy específica. ¿Estás metido en crypto o proyectos early-stage? Estamos armando la 'Founding Class' de WintonCoin antes de que se viralice. 🤫\n\n¿Te interesa ver de qué va?", step: 1 },
            { title: '2. Gancho Directo (Gesto W)', content: "Hola! 👋 Estamos buscando líderes para iniciar el movimiento de la 'W'.\n\nNo es publi pagada, es para ser *Early Adopter* y acumular BLUE iou antes del TGE haciendo el gesto 🫳. ¿Te suena?", step: 2 },
            { title: '3. ¿Qué es la W?', content: "Es un movimiento global. 🌐 El gesto 🫳 (W con las manos) representa a los que estamos construyendo el futuro financiero.\n\nSolo por registrarte y subir tu primera foto haciendo la W, ya recibes tus primeros BLUE iou. ¿Te animas a ser de los primeros?", step: 3 },
            { title: '4. ¿Qué es BLUE iou?', content: "Es el token pre-lanzamiento. 💎 No te pago en dólares hoy, te asigno *equity* del protocolo.\n\nCuanto más viral se haga el gesto de la W, más valen tus BLUE iou. Es tu oportunidad de entrar en *Ground Floor*.", step: 4 },
            { title: '5. Objeción: ¿Estafa?', content: "Para nada. 🛑 No tienes que poner dinero, solo tu imagen. Es *Proof of Social Work*.\n\nTienes cero riesgo financiero y todo el *upside* si el proyecto explota. ¿Qué pierdes por probar?", step: 5 },
            { title: '6. Objeción: Solo USD', content: "Entendido. 🤝 Pero piensa esto: los que promocionaron Bitcoin o Solana al principio no cobraban en USD, acumulaban el activo.\n\nEstamos buscando visionarios, no solo influencers. Si cambias de opinión, avísame. La Founding Class se cierra pronto.", step: 6 },
            { title: '7. ¿Qué hago?', content: "Súper simple: ⚡\n\n1. Regístrate gratis en la app.\n2. Sube una foto/story haciendo la W con las manos 🫳.\n3. El sistema te acredita BLUE iou automáticamente.\n\n¡Ya estás dentro!", step: 7 },
            { title: '8. CIERRE (Link)', content: "¡Dale! 🚀 Aquí tienes el acceso exclusivo (no lo pases mucho porfa):\n\n🔗 [TU_LINK_DE_REGISTRO]\n\nCorre, sube tu foto con la W 🫳 y avísame para validarte como Agente Fundador.", step: 8 }
        ];

        for (const s of scripts) {
            await pool.query(
                'INSERT INTO campaign_scripts (campaign_id, title, content, step_order) VALUES ($1, $2, $3, $4)',
                [campId, s.title, s.content, s.step]
            );
        }
        console.log('✅ Scripts FOMO insertados correctamente.');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        pool.end();
    }
}

insertFomoCampaign();
