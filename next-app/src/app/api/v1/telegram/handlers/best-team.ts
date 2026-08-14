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

        let msg = `☭ *IL SOVIET SUPREMO HA DECISO PER IL COMPAGNO ${escapeMarkdown(participant.name)}* ☭\n\n`;
        msg += `🏭 Modello Organizzativo del Collettivo: *${escapeMarkdown(data.formation)}*\n`;
        msg += `📈 Quota di Produzione Stacanovista Stimata: *${escapeMarkdown(data.totalProjectedScore.toFixed(2))}*\n\n`;
        
        msg += `*🎖 Lavoratori al Fronte (Titolari):*\n`;
        data.starting11.forEach((p: any) => {
            msg += `\\- ${p.player.role} ${escapeMarkdown(p.player.name)} \\(Produttività: ${escapeMarkdown(p.expectedMatchScore.toFixed(2))}\\)\n`;
        });

        msg += `\n*⛏ Nelle Miniere di Carbone (Riserve pronte al sacrificio):*\n`;
        data.bench.forEach((p: any) => {
            msg += `\\- ${p.player.role} ${escapeMarkdown(p.player.name)} \\(Produttività: ${escapeMarkdown(p.expectedMatchScore.toFixed(2))}\\)\n`;
        });

        await sendMessage(chatId, msg);

    } catch (e: any) {
        console.error("Error fetching optimal lineup:", e);
        const errStr = e && e.message ? e.message : String(e);
        await sendMessage(chatId, `❌ I sabotatori capitalisti hanno corrotto i nostri archivi: ${escapeMarkdown(errStr)}`);
    }
}
