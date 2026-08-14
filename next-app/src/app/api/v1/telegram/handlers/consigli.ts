import { prisma } from '@/lib/prisma';
import { sendMessage } from '../telegram-utils';
import { getSuggestedPrice } from '@/lib/fanta-math';

function escapeMarkdown(text: string): string {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

export async function handleConsigli(chatId: number, text: string) {
    const parts = text.split(' ');
    if (parts.length < 2) {
        await sendMessage(chatId, "Uso corretto: /consigli \\[ID\\_Mister o Nome\\]");
        return;
    }

    let participant;
    const inputId = parseInt(parts[1]);
    
    if (isNaN(inputId)) {
        const nameQuery = parts.slice(1).join(' ').toLowerCase();
        participant = await prisma.auctionParticipant.findFirst({
            where: { name: { contains: nameQuery, mode: 'insensitive' } }
        });
    } else {
        participant = await prisma.auctionParticipant.findUnique({ where: { id: inputId } });
    }

    if (!participant) {
        await sendMessage(chatId, `Compagno non trovato agli atti\\. Usa /mister per consultare l'archivio\\.`);
        return;
    }

    try {
        const purchases = await prisma.purchase.findMany({ include: { player: true } });
        const teamPurchases = purchases.filter(p => p.participantId === participant.id);
        const boughtIds = new Set(purchases.map(p => p.playerId));
        
        const allPlayers = await prisma.player.findMany();
        
        const initialBudget = participant.initialBudget || 500;
        const spent = teamPurchases.reduce((sum, p) => sum + p.price, 0);
        const budget = initialBudget - spent;
        
        const remainingOverallSlots = Math.max(0, 25 - teamPurchases.length);
        const maxBid = budget - (remainingOverallSlots - 1);
        
        if (remainingOverallSlots === 0) {
            await sendMessage(chatId, `✅ Il compagno *${escapeMarkdown(participant.name)}* ha già riempito tutti i posti disponibili nella fabbrica\\. Nessun reclutamento necessario\\.`);
            return;
        }

        const availablePlayers = allPlayers.filter(p => !boughtIds.has(p.id));
        const roles = ["P", "D", "C", "A"];
        const roleLimits: Record<string, number> = { P: 3, D: 8, C: 8, A: 6 };
        
        let msg = `🕵️‍♂️ *Dossier Scouting per ${escapeMarkdown(participant.name)}* 🕵️‍♂️\n\n`;
        msg += `Fondi dello Stato: *${budget} cr*\n`;
        msg += `Posti vacanti: *${remainingOverallSlots}*\n\n`;

        let foundAny = false;

        for (const role of roles) {
            const rolePurchases = teamPurchases.filter(p => p.player.role === role);
            const count = rolePurchases.length;
            const missing = roleLimits[role] - count;
            
            if (missing <= 0) continue;
            
            const avgRoleEv = count > 0 ? rolePurchases.reduce((acc, p) => acc + (p.player.expectedValue || 6.0), 0) / count : 0;
            
            let candidates = availablePlayers.filter(p => p.role === role && getSuggestedPrice(p) <= maxBid);
            
            candidates.sort((a, b) => {
              const evA = a.expectedValue || 6.0;
              const evB = b.expectedValue || 6.0;
              if (avgRoleEv < 6.4 || role === 'P') {
                return evB - evA;
              } else {
                const valueA = evA / Math.max(1, getSuggestedPrice(a));
                const valueB = evB / Math.max(1, getSuggestedPrice(b));
                return valueB - valueA;
              }
            });
            
            const top3 = candidates.slice(0, 3);
            if (top3.length === 0) continue;
            
            foundAny = true;
            msg += `*Reparto ${role}* \\(mancano ${missing}\\):\n`;
            
            top3.forEach((p, idx) => {
                const ev = (p.expectedValue || 6.0);
                const price = getSuggestedPrice(p);
                const strat = (avgRoleEv < 6.4 || ev >= 7.0) ? "Top" : "Low Cost";
                msg += `  ${idx + 1}\\. ${escapeMarkdown(p.name)} \\(${escapeMarkdown(p.team)}\\)\n`;
                msg += `      EV: ${escapeMarkdown(ev.toFixed(1))} \\| Max: ${price}cr \\| _${escapeMarkdown(strat)}_\n`;
            });
            msg += `\n`;
        }
        
        if (!foundAny) {
            msg += `Nessun lavoratore raccomandabile con i fondi attuali\\.`;
        }

        await sendMessage(chatId, msg);

    } catch (e: any) {
        console.error("Error in scouting:", e);
        await sendMessage(chatId, "Errore durante la perlustrazione dei lavoratori svincolati\\.");
    }
}
