import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error("❌ Errore: TELEGRAM_BOT_TOKEN non configurato nel file .env");
    process.exit(1);
}

const TELEGRAM_API = `https://api.telegram.org/bot${token}`;
const LOCAL_WEBHOOK_URL = 'http://localhost:3000/api/v1/telegram/webhook';

let lastUpdateId = 0;

async function poll() {
    try {
        const res = await fetch(`${TELEGRAM_API}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
        const data = await res.json() as any;

        if (data.ok && data.result.length > 0) {
            for (const update of data.result) {
                lastUpdateId = update.update_id;
                
                // Proxy the update to the local Next.js API
                try {
                    await fetch(LOCAL_WEBHOOK_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(update)
                    });
                    console.log(`✅ Forwarded update ${lastUpdateId} to local API`);
                } catch (e) {
                    console.error(`❌ Impossibile inoltrare al server locale (è acceso localhost:3000?):`, e);
                }
            }
        }
    } catch (error) {
        console.error("Errore durante il long polling:", error);
    } finally {
        // Poll immediately again
        setTimeout(poll, 1000);
    }
}

async function start() {
    console.log("🤖 Inizializzazione Telegram Bot (Long Polling)...");
    
    // Rimuoviamo il webhook se impostato, altrimenti getUpdates va in errore
    await fetch(`${TELEGRAM_API}/deleteWebhook`);
    console.log("✅ Webhook rimosso (modalità Polling attivata)");
    
    console.log(`📡 In ascolto per nuovi messaggi su Telegram...`);
    poll();
}

start();
