import { NextResponse } from 'next/server';
import { sendMessage } from '../../telegram/telegram-utils';

export async function GET(request: Request) {
  return handleCronJob(request);
}

export async function POST(request: Request) {
  return handleCronJob(request);
}

async function handleCronJob(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || request.headers.get('x-cron-secret');

  if (token !== (process.env.CRON_SECRET || '123')) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // 1. Scrape latest probable lineups
    const lineupsRes = await fetch(`${baseUrl}/api/v1/scraper/lineups`, { method: 'POST' });
    const lineupsData = await lineupsRes.json();

    // 2. Optional: Notify Telegram group
    const chatId = process.env.TELEGRAM_GROUP_CHAT_ID;
    if (chatId) {
      const msg = `📊 *BREZNEV \\- AGGIORNAMENTO GIORNATA* 📊\n\n` +
        `Sono stati aggiornati i punteggi attesi e la titolarità dei giocatori per la prossima giornata\\!\n\n` +
        `💡 Usa il comando /best\\_team per calcolare subito la tua formazione ottimale, il bene della comunità prima di tutto!\\.`;
      await sendMessage(chatId, msg);
    }

    return NextResponse.json({
      success: true,
      message: "Cron comunist job eseguito con successo!",
      lineupsData,
      telegramNotificationSent: Boolean(chatId),
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Cron Job Error:", error);
    return NextResponse.json({ error: error.message || "Errore durante l'esecuzione del Cron Job" }, { status: 500 });
  }
}
