import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const webhookUrl = url.searchParams.get('url');

    if (!webhookUrl) {
        return NextResponse.json({ error: "Please provide a ?url= query parameter with the full URL to the webhook endpoint (e.g. https://yourdomain.com/api/v1/telegram/webhook)" }, { status: 400 });
    }

    const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

    try {
        // Set Webhook
        const resWebhook = await fetch(`${TELEGRAM_API_URL}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
        const dataWebhook = await resWebhook.json();

        // Set Commands (Suggestions)
        const commands = [
            { command: 'best_team', description: 'Ottieni la miglior formazione per un mister' },
            { command: 'exchange', description: 'Analizza uno scambio tra mister' },
            { command: 'mister', description: 'Elenca tutti i mister e i loro ID' }
        ];

        const resCommands = await fetch(`${TELEGRAM_API_URL}/setMyCommands`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commands })
        });
        const dataCommands = await resCommands.json();

        // Send activation message
        if (process.env.TELEGRAM_GROUP_CHAT_ID) {
            await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: process.env.TELEGRAM_GROUP_CHAT_ID,
                    text: '🤖 *Fanta Advisor Bot Attivato!*\n\nIl bot è ora online e in ascolto per i comandi.',
                    parse_mode: 'Markdown'
                })
            });
        }

        return NextResponse.json({ webhook: dataWebhook, commands: dataCommands });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
