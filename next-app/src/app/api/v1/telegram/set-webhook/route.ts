import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const webhookUrl = url.searchParams.get('url');

    if (!webhookUrl) {
        return NextResponse.json({ error: "Please provide a ?url= query parameter with the full URL to the webhook endpoint (e.g. https://yourdomain.com/api/v1/telegram/webhook)" }, { status: 400 });
    }

    const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

    try {
        const res = await fetch(`${TELEGRAM_API_URL}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
        const data = await res.json();
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
