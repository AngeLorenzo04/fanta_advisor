import { NextResponse } from 'next/server';
import { sendMessage } from '../../telegram-utils';

export async function GET(request: Request) {
    // Basic security check: you should ideally pass a secret token in the cron job
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    
    if (token !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatId = process.env.TELEGRAM_GROUP_CHAT_ID;
    if (!chatId) {
        return NextResponse.json({ error: "TELEGRAM_GROUP_CHAT_ID not configured" }, { status: 500 });
    }

    const message = `🚨 *MISTER, È ORA DI SCHIERARE LA FORMAZIONE!* 🚨\n\nNon fatevi trovare impreparati, il calcio d'inizio si avvicina\\. Usate il comando /best\\_team per farvi consigliare la miglior formazione dal Fanta Advisor\\!`;

    await sendMessage(chatId, message);

    return NextResponse.json({ success: true, message: "Reminder sent" });
}
