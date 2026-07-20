import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

    try {
        // Send deactivation message first
        if (process.env.TELEGRAM_GROUP_CHAT_ID) {
            await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: process.env.TELEGRAM_GROUP_CHAT_ID,
                    text: '😴 *Fanta Advisor Bot Disattivato*\n\nIl bot è stato spento e non risponderà più ai comandi.',
                    parse_mode: 'Markdown'
                })
            });
        }

        // Delete Webhook
        const resWebhook = await fetch(`${TELEGRAM_API_URL}/deleteWebhook`);
        const dataWebhook = await resWebhook.json();

        return NextResponse.json({ webhook_deleted: dataWebhook });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
