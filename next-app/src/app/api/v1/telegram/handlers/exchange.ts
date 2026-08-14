import { prisma } from '@/lib/prisma';
import { sendMessage } from '../telegram-utils';

function escapeMarkdown(text: string): string {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

export async function handleExchange(chatId: number, text: string) {
    const parts = text.split(' ');
    if (parts.length < 5) {
        await sendMessage(chatId, "Direttiva errata\\. Uso corretto: /exchange \\[ID\\_Compagno1\\] \\[Lavoratore1\\] \\[ID\\_Compagno2\\] \\[Lavoratore2\\]\nEs: /exchange 1 Lukaku 2 Lautaro");
        return;
    }

    const id1 = parseInt(parts[1]);
    const player1Name = parts[2].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const id2 = parseInt(parts[3]);
    const player2Name = parts[4].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    if (isNaN(id1) || isNaN(id2)) {
        await sendMessage(chatId, "I codici identificativi dei compagni devono essere numerici\\.");
        return;
    }

    try {
        const p1 = await prisma.auctionParticipant.findUnique({ where: { id: id1 }, include: { purchases: { include: { player: true } } } });
        const p2 = await prisma.auctionParticipant.findUnique({ where: { id: id2 }, include: { purchases: { include: { player: true } } } });

        if (!p1 || !p2) {
            await sendMessage(chatId, "Uno dei compagni non risulta negli archivi statali\\.");
            return;
        }

        const bought1 = p1.purchases.find(p => p.player.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(player1Name));
        const bought2 = p2.purchases.find(p => p.player.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(player2Name));

        if (!bought1) {
            await sendMessage(chatId, `Il compagno ${escapeMarkdown(p1.name)} non detiene i diritti sul lavoratore ${escapeMarkdown(parts[2])}\\.`);
            return;
        }
        if (!bought2) {
            await sendMessage(chatId, `Il compagno ${escapeMarkdown(p2.name)} non detiene i diritti sul lavoratore ${escapeMarkdown(parts[4])}\\.`);
            return;
        }

        const g1 = bought1.player;
        const g2 = bought2.player;

        const val1 = g1.currentQuote || g1.initialQuote || 1;
        const val2 = g2.currentQuote || g2.initialQuote || 1;
        const diff = val2 - val1;

        let msg = `⚖️ *TRIBUNALE DEL POPOLO PER GLI SCAMBI* ⚖️\n\n`;
        msg += `Il KGB ha esaminato la proposta di baratto tra i compagni.\n`;
        msg += `*${escapeMarkdown(p1.name)}* cede al Soviet: ${g1.role} ${escapeMarkdown(g1.name)} \\(Quota Statale: ${val1} rubli\\)\n`;
        msg += `*${escapeMarkdown(p2.name)}* cede al Soviet: ${g2.role} ${escapeMarkdown(g2.name)} \\(Quota Statale: ${val2} rubli\\)\n\n`;

        if (g1.role !== g2.role) {
            msg += `⚠️ *ALLARME DEL MINISTERO:* Le classi lavoratrici differiscono \\(${g1.role} vs ${g2.role}\\)\\. Mischiare contadini e operai metallurgici potrebbe destabilizzare il Piano Quinquennale\\!\n\n`;
        }

        if (diff > 0) {
            msg += `🚨 *ATTENZIONE SABOTAGGIO!* L'esproprio arricchisce ingiustamente il capitalista *${escapeMarkdown(p1.name)}* \\(\\+${diff} rubli di profitto illecito\\)\\. Al Gulag\\!`;
        } else if (diff < 0) {
            msg += `🚨 *ATTENZIONE SABOTAGGIO!* L'esproprio arricchisce ingiustamente il capitalista *${escapeMarkdown(p2.name)}* \\(\\+${Math.abs(diff)} rubli di profitto illecito\\)\\. Al Gulag\\!`;
        } else {
            msg += `🤝 *APPROVATO DAL POLITBURO:* Lo scambio è perfettamente equo e comunista\\! Gloria a Lenin\\!`;
        }

        await sendMessage(chatId, msg);

    } catch (e) {
        console.error("Error handling exchange:", e);
        await sendMessage(chatId, "❌ La macchina da scrivere del ministero si è inceppata. Riprova più tardi.");
    }
}
