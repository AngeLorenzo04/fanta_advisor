import { NextResponse } from 'next/server';
import { sendMessage } from '../telegram-utils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
        } else if (text.startsWith('/id')) {
            await sendMessage(chatId, `Il Chat ID di questo gruppo/conversazione è: \`${chatId}\``);
        } else if (text.startsWith('/start')) {
            await sendMessage(chatId, "Benvenuto sotto la guida del Breznev Bot\\! I tuoi giocatori appartengono al popolo e le loro statistiche sono di proprietà dello Stato\\. Usa /best\\_team, /exchange, /mister o /rule per consultare il Piano Quinquennale\\.");
        } else if (text.startsWith('/')) {
            const rawCmd = text.split(' ')[0].replace('/', '').replace(/@.*$/, '').toLowerCase();
            const customCmd = await (prisma as any).customCommand.findUnique({ where: { name: rawCmd } });
            if (customCmd) {
                await sendMessage(chatId, escapeMarkdown(customCmd.response));
            }
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Webhook error:", e);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}

async function handleBestTeam(chatId: number, text: string) {
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
                }
            }
        });
    } else {
        participant = await prisma.auctionParticipant.findUnique({ where: { id: inputId } });
    }

    if (!participant) {
        await sendMessage(chatId, `Mister non trovato\\. Usa /mister per vedere la lista\\.`);
        return;
    }

    const misterId = participant.id;

    try {
        // Construct absolute URL for fetch in Next.js Server context
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/v1/lineups/${misterId}/optimal`);
        if (!res.ok) {
            await sendMessage(chatId, "Errore nel calcolo della formazione\\.");
            return;
        }
        
        const data = await res.json();
        if (!data || !data.starting11) {
            await sendMessage(chatId, "Nessuna rosa valida trovata\\.");
            return;
        }

        let msg = `🏆 *Miglior Formazione per ${escapeMarkdown(participant.name)}* 🏆\n\n`;
        msg += `📐 Modulo: *${escapeMarkdown(data.formation)}*\n`;
        msg += `🎯 Voto Atteso: *${escapeMarkdown(data.totalProjectedScore.toFixed(2))}*\n\n`;
        
        msg += `*Titolari:*\n`;
        data.starting11.forEach((p: any) => {
            msg += `\\- ${p.player.role} ${escapeMarkdown(p.player.name)} \\(${escapeMarkdown(p.expectedMatchScore.toFixed(2))}\\)\n`;
        });

        msg += `\n*Panchina:*\n`;
        data.bench.forEach((p: any) => {
            msg += `\\- ${p.player.role} ${escapeMarkdown(p.player.name)} \\(${escapeMarkdown(p.expectedMatchScore.toFixed(2))}\\)\n`;
        });

        await sendMessage(chatId, msg);

    } catch (e) {
        console.error("Error fetching optimal lineup:", e);
        await sendMessage(chatId, "Errore interno durante il calcolo\\.");
    }
}

async function handleExchange(chatId: number, text: string) {
    const parts = text.split(' ');
    if (parts.length < 5) {
        await sendMessage(chatId, "Uso corretto: /exchange \\[ID\\_Mister1\\] \\[Giocatore1\\] \\[ID\\_Mister2\\] \\[Giocatore2\\]\nEs: /exchange 1 Lukaku 2 Lautaro");
        return;
    }

    const id1 = parseInt(parts[1]);
    const player1Name = parts[2].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const id2 = parseInt(parts[3]);
    const player2Name = parts[4].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    if (isNaN(id1) || isNaN(id2)) {
        await sendMessage(chatId, "Gli ID Mister devono essere numeri\\.");
        return;
    }

    try {
        const p1 = await prisma.auctionParticipant.findUnique({ where: { id: id1 }, include: { purchases: { include: { player: true } } } });
        const p2 = await prisma.auctionParticipant.findUnique({ where: { id: id2 }, include: { purchases: { include: { player: true } } } });

        if (!p1 || !p2) {
            await sendMessage(chatId, "Uno dei mister non esiste\\.");
            return;
        }

        const bought1 = p1.purchases.find(p => p.player.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(player1Name));
        const bought2 = p2.purchases.find(p => p.player.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(player2Name));

        if (!bought1) {
            await sendMessage(chatId, `Il mister ${escapeMarkdown(p1.name)} non ha nessun giocatore chiamato ${escapeMarkdown(parts[2])}\\.`);
            return;
        }
        if (!bought2) {
            await sendMessage(chatId, `Il mister ${escapeMarkdown(p2.name)} non ha nessun giocatore chiamato ${escapeMarkdown(parts[4])}\\.`);
            return;
        }

        const g1 = bought1.player;
        const g2 = bought2.player;

        const val1 = g1.currentQuote || g1.initialQuote || 1;
        const val2 = g2.currentQuote || g2.initialQuote || 1;
        const diff = val2 - val1;

        let msg = `⚖️ *Analisi Scambio* ⚖️\n\n`;
        msg += `*${escapeMarkdown(p1.name)}* cede: ${g1.role} ${escapeMarkdown(g1.name)} \\(Valore: ${val1}\\)\n`;
        msg += `*${escapeMarkdown(p2.name)}* cede: ${g2.role} ${escapeMarkdown(g2.name)} \\(Valore: ${val2}\\)\n\n`;

        if (g1.role !== g2.role) {
            msg += `⚠️ *Attenzione:* I ruoli sono diversi \\(${g1.role} vs ${g2.role}\\)\\. Lo scambio potrebbe invalidare i limiti della rosa\\!\n\n`;
        }

        if (diff > 0) {
            msg += `📈 L'affare conviene matematicamente a *${escapeMarkdown(p1.name)}* \\(\\+${diff} in Valore rosa\\)\\.`;
        } else if (diff < 0) {
            msg += `📈 L'affare conviene matematicamente a *${escapeMarkdown(p2.name)}* \\(\\+${Math.abs(diff)} in Valore rosa\\)\\.`;
        } else {
            msg += `🤝 Lo scambio è *perfettamente equo* in termini di Valore\\!`;
        }

        await sendMessage(chatId, msg);

    } catch (e) {
        console.error("Error handling exchange:", e);
        await sendMessage(chatId, "Errore interno durante l'analisi dello scambio\\.");
    }
}

async function handleMisterList(chatId: number) {
    try {
        const participants = await prisma.auctionParticipant.findMany();
        if (participants.length === 0) {
            await sendMessage(chatId, "Non ci sono mister registrati\\.");
            return;
        }

        let msg = `👤 *Lista dei Compagni Mister registrati al PCUS* 👤\n\n`;
        participants.forEach(p => {
            msg += `ID di Partito: *${p.id}* \\- ${escapeMarkdown(p.name)}\n`;
        });
        
        await sendMessage(chatId, msg);
    } catch (e) {
        console.error("Error fetching mister list:", e);
        await sendMessage(chatId, "Il KGB ha intercettato un errore nel recupero della lista Compagni\\.");
    }
}

async function handleRule(chatId: number) {
    let msg = `📘 *Piano Quinquennale di Calcolo Breznev* 📘\n\n`;
    
    msg += `*1\\. Punteggi dei singoli compagni:*\n`;
    msg += `Vengono calcolati espropriando le statistiche individuali a favore della collettività\\. Il modello matematico produce un *Expected Base Rating* \\(voto del comitato\\) e un *Expected Value* \\(fantavoto proletario\\), premiando la produttività nei calci piazzati e nei rigori per i lavoratori più meritevoli\\.\n\n`;
 
    msg += `*2\\. Rendimento della Cooperativa Agricola \\(Rosa\\):*\n`;
    msg += `Il punteggio totale previsto per la collettività è la somma dell'*Expected Value* degli 11 lavoratori ottimali schierati per raggiungere le quote di produzione stabilite dal modulo\\. Il nostro algoritmo statale sceglie scientificamente la formazione che massimizza il bene comune, bandendo l'individualismo capitalista\\.\n\n`;
 
    msg += `*3\\. Costo pianificato dello scambio:*\n`;
    msg += `Il costo di un compagno è regolato dal calmiere statale\\. Qualsiasi plusvalenza privata derivante da scambi non autorizzati dal Comitato Centrale è considerata alto tradimento\\, valutiamo se lo scambio rispetta i principi di redistribuzione equa della ricchezza\\.`;

    await sendMessage(chatId, msg);
}
