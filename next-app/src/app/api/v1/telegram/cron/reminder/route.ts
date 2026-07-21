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

    const message = `🚨 *COMPAGNI MISTER, È ORA DI SCHIERARE LA FORMAZIONE!* 🚨\n\nIl Segretario Generale Breznev vi ordina di non cedere al capitalismo morale della panchina\\. Il bene della comunità calcistica dipende dalle vostre scelte\\. Usate il comando /best\\_team per farvi consigliare la formazione del popolo dal vostro Breznev di fiducia, o finirete direttamente in Siberia a spalare neve\\! ❄️`;

    await sendMessage(chatId, message);

    return NextResponse.json({ success: true, message: "Reminder sent" });
}
