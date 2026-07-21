import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const url = new URL(request.url);

    // Resolve the public-facing origin using proxy headers (Render injects these)
    // Fallback: use NEXT_PUBLIC_API_BASE_URL env var, or url.origin as last resort
    const host = request.headers.get('x-forwarded-host') ?? url.hostname;
    const proto = request.headers.get('x-forwarded-proto') ?? 'https';
    const publicOrigin = process.env.NEXT_PUBLIC_API_BASE_URL
        ? process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/api\/v1\/?$/, '')
        : `${proto}://${host}`;

    // If no ?url= param, default to this server's own webhook endpoint
    const webhookUrl = url.searchParams.get('url')
        ?? `${publicOrigin}/api/v1/telegram/webhook`;


    const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

    try {
        // Set Webhook
        const resWebhook = await fetch(`${TELEGRAM_API_URL}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
        const dataWebhook = await resWebhook.json();

        // Set Commands (Suggestions)
        const commands = [
            { command: 'best_team', description: 'Ottieni la miglior formazione per un mister' },
            { command: 'exchange', description: 'Analizza uno scambio tra mister' },
            { command: 'mister', description: 'Elenca tutti i mister e i loro ID' },
            { command: 'rule', description: 'Spiega come vengono calcolati i punteggi e i costi' }
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
