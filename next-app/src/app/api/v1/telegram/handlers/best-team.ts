import { prisma } from '@/lib/prisma';
import { sendMessage } from '../telegram-utils';
import { calculateOptimalLineup } from '@/lib/fanta-math';

function escapeMarkdown(text: string): string {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

export async function handleBestTeam(chatId: number, text: string) {
    const parts = text.split(' ');
    if (parts.length < 2) {
        await sendMessage(chatId, "Uso corretto: /best\\_team \\[ID\\_Mister\\]");
        return;
    }

    let participant;
    const inputId = parseInt(parts[1]);
    
    if (isNaN(inputId)) {
        // Se non è un numero, cerchiamo per nome
        const nameQuery = parts.slice(1).join(' ').toLowerCase();
        participant = await prisma.auctionParticipant.findFirst({
            where: {
                name: {
                    contains: nameQuery,
                    mode: 'insensitive'
                }
            }
        });
    } else {
        participant = await prisma.auctionParticipant.findUnique({ where: { id: inputId } });
    }

    if (!participant) {
        await sendMessage(chatId, `Compagno non trovato agli atti\\. Usa /mister per consultare l'archivio\\.`);
        return;
    }

    const misterId = participant.id;

    try {
        const data = await calculateOptimalLineup(misterId);
        
        if (!data || !data.starting11 || data.starting11.length === 0) {
            await sendMessage(chatId, "Nessun collettivo proletario trovato\\.");
            return;
        }

        let msg = `☭ *Il Comitato Centrale ha decretato il seguente schieramento per il compagno ${escapeMarkdown(participant.name)}* ☭\n\n`;
        msg += `📐 Assetto di Classe: *${escapeMarkdown(data.formation)}*\n`;
        msg += `🏭 Quota di Produzione Attesa: *${escapeMarkdown(data.totalProjectedScore.toFixed(2))}*\n\n`;
        
        msg += `*Compagni al Fronte:*\n`;
        data.starting11.forEach((p: any) => {
            msg += `\\- ${p.player.role} ${escapeMarkdown(p.player.name)} \\(${escapeMarkdown(p.expectedMatchScore.toFixed(2))}\\)\n`;
        });

        msg += `\n*Riserve (Pronti all'Esproprio):*\n`;
        data.bench.forEach((p: any) => {
            msg += `\\- ${p.player.role} ${escapeMarkdown(p.player.name)} \\(${escapeMarkdown(p.expectedMatchScore.toFixed(2))}\\)\n`;
        });

        await sendMessage(chatId, msg);

    } catch (e: any) {
        console.error("Error fetching optimal lineup:", e);
        const errStr = e && e.message ? e.message : String(e);
        await sendMessage(chatId, `Errore burocratico interno: ${escapeMarkdown(errStr)}`);
    }
}
