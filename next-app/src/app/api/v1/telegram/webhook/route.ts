import { NextResponse } from 'next/server';
import { sendMessage } from '../telegram-utils';
import { prisma } from '@/lib/prisma';

import { handleBestTeam } from '../handlers/best-team';
import { handleExchange } from '../handlers/exchange';
import { handleMisterList } from '../handlers/mister';
import { handleRule, handleInfo } from '../handlers/info-rules';
import { handleConsigli } from '../handlers/consigli';

function escapeMarkdown(text: string): string {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

export async function POST(request: Request) {
    try {
        const update = await request.json();
        
        if (!update.message || !update.message.text) {
            return NextResponse.json({ success: true }); // Acknowledge to stop Telegram from retrying
        }

        const chatId = update.message.chat.id;
        const text = update.message.text.trim();

        if (text.startsWith('/best_team')) {
            await handleBestTeam(chatId, text);
        } else if (text.startsWith('/exchange')) {
            await handleExchange(chatId, text);
        } else if (text.startsWith('/mister')) {
            await handleMisterList(chatId);
        } else if (text.startsWith('/rule')) {
            await handleRule(chatId);
        } else if (text.startsWith('/info')) {
            await handleInfo(chatId);
        } else if (text.startsWith('/consigli')) {
            await handleConsigli(chatId, text);
        } else if (text.startsWith('/id')) {
            await sendMessage(chatId, `Il Chat ID di questo gruppo/conversazione è: \`${chatId}\``);
        } else if (text.startsWith('/start')) {
            await sendMessage(chatId, "Benvenuto sotto la guida del Breznev Bot\\! I tuoi giocatori appartengono al popolo e le loro statistiche sono di proprietà dello Stato\\. Usa /best\\_team, /exchange, /mister, /rule o /info per consultare il Piano Quinquennale\\.");
        } else if (text.startsWith('/')) {
            // Comando non riconosciuto
            await sendMessage(chatId, "Comando non riconosciuto dal Politburo. Usa /start per la lista dei comandi approvati.");
        }

        return NextResponse.json({ success: true, debug: (global as any).lastWebhookError });
    } catch (e) {
        console.error("Webhook error:", e);
        return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
    }
}
