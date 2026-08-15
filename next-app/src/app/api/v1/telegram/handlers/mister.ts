import { prisma } from '@/lib/prisma';
import { sendMessage } from '../telegram-utils';

function escapeMarkdown(text: string): string {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

export async function handleMisterList(chatId: number) {
    try {
        const participants = await prisma.auctionParticipant.findMany();
        if (participants.length === 0) {
            await sendMessage(chatId, "Non ci sono mister registrati\\.");
            return;
        }

        let msg = `👤 *MEMBRI DEL SOVIET SUPREMO DELLA LEGA* 👤\n\n`;
        participants.forEach(p => {
            msg += `Tessera del Partito N\\. *${p.id}* \\- ${escapeMarkdown(p.name)}\n`;
        });
        
        await sendMessage(chatId, msg);
    } catch (e: any) {
        console.error("Error fetching mister list:", e);
        (global as any).lastWebhookError = e?.message || String(e);
        await sendMessage(chatId, "❌ Il KGB ha intercettato un errore nel recupero dei dossier dei compagni\\.");
    }
}
