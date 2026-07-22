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
        } else if (text.startsWith('/info')) {
            await handleInfo(chatId);
        } else if (text.startsWith('/id')) {
            await sendMessage(chatId, `Il Chat ID di questo gruppo/conversazione è: \`${chatId}\``);
        } else if (text.startsWith('/start')) {
            await sendMessage(chatId, "Benvenuto sotto la guida del Breznev Bot\\! I tuoi giocatori appartengono al popolo e le loro statistiche sono di proprietà dello Stato\\. Usa /best\\_team, /exchange, /mister, /rule o /info per consultare il Piano Quinquennale\\.");
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

function evaluatePlayerForMatchday(player: any, fixtures: any[]) {
  const team = player.team;
  let opponentStrength = 3;
  let opponentTeam = "Sconosciuto";

  for (const f of fixtures) {
    if (f.homeTeam.toLowerCase() === team.toLowerCase()) {
      opponentStrength = f.awayTeamStrength;
      opponentTeam = f.awayTeam;
      break;
    } else if (f.awayTeam.toLowerCase() === team.toLowerCase()) {
      opponentStrength = f.homeTeamStrength;
      opponentTeam = f.homeTeam;
      break;
    }
  }

  let modifier = 0.0;
  switch (opponentStrength) {
    case 5: modifier = -0.5; break;
    case 4: modifier = -0.2; break;
    case 3: modifier = 0.0; break;
    case 2: modifier = 0.2; break;
    case 1: modifier = 0.5; break;
  }

  if (player.role === 'P') {
    modifier *= 1.5;
  } else if (player.role === 'A') {
    modifier *= 0.8;
  }

  // Starter probability (1.0 = starter, 0.5 = ballot, 0.0 = injured/suspended)
  // Attualmente non disponiamo di dati infortuni/squalifiche nel DB, assumiamo 1.0
  const starterChance = 1.0;

  let expectedMatchScore = (player.expectedValue || 6.0) + modifier;

  if (starterChance <= 0) {
    expectedMatchScore = 0.0;
  } else if (starterChance < 1.0) {
    expectedMatchScore = expectedMatchScore * (0.5 + starterChance * 0.5); 
  }

  expectedMatchScore = Math.max(0, Math.round(expectedMatchScore * 100.0) / 100.0);

  return { player, matchModifier: modifier, starterChance, expectedMatchScore, opponentTeam };
}

async function calculateOptimalLineup(misterId: number, requestedFormation: string | null = null) {
    const purchases = await prisma.purchase.findMany({
      where: { participantId: misterId },
      include: { player: true }
    });

    const fixtures = await prisma.matchFixture.findMany();

    let evaluatedPlayers = purchases.map(p => evaluatePlayerForMatchday(p.player, fixtures));
    evaluatedPlayers.sort((a, b) => b.expectedMatchScore - a.expectedMatchScore);

    let formations = ["3-4-3", "4-3-3", "3-5-2", "4-4-2", "5-3-2", "4-5-1", "5-4-1"];
    if (requestedFormation && formations.includes(requestedFormation)) {
      formations = [requestedFormation];
    }
    let bestLineup: any = null;
    let maxScore = -1000.0;

    for (const formationStr of formations) {
      const parts = formationStr.split("-");
      const reqD = parseInt(parts[0]);
      const reqC = parseInt(parts[1]);
      const reqA = parseInt(parts[2]);

      const pList = evaluatedPlayers.filter(p => p.player.role === 'P');
      const dList = evaluatedPlayers.filter(p => p.player.role === 'D');
      const cList = evaluatedPlayers.filter(p => p.player.role === 'C');
      const aList = evaluatedPlayers.filter(p => p.player.role === 'A');

      if (pList.length >= 1 && dList.length >= reqD && cList.length >= reqC && aList.length >= reqA) {
        let starters = [
          pList[0],
          ...dList.slice(0, reqD),
          ...cList.slice(0, reqC),
          ...aList.slice(0, reqA)
        ];

        let currentScore = starters.reduce((sum, p) => sum + p.expectedMatchScore, 0);
        currentScore = Math.round(currentScore * 100.0) / 100.0;

        if (currentScore > maxScore) {
          maxScore = currentScore;
          
          let bench = evaluatedPlayers.filter(p => !starters.includes(p));
          
          bestLineup = {
            starting11: starters,
            bench,
            totalProjectedScore: currentScore,
            formation: formationStr
          };
        }
      }
    }

    if (!bestLineup) {
      bestLineup = {
        starting11: evaluatedPlayers,
        bench: [],
        totalProjectedScore: 0.0,
        formation: "N/A"
      };
    }

    return bestLineup;
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

async function handleExchange(chatId: number, text: string) {
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

        let msg = `⚖️ *Valutazione Ministeriale dell'Esproprio* ⚖️\n\n`;
        msg += `*${escapeMarkdown(p1.name)}* dona allo stato: ${g1.role} ${escapeMarkdown(g1.name)} \\(Valore Produttivo: ${val1}\\)\n`;
        msg += `*${escapeMarkdown(p2.name)}* dona allo stato: ${g2.role} ${escapeMarkdown(g2.name)} \\(Valore Produttivo: ${val2}\\)\n\n`;

        if (g1.role !== g2.role) {
            msg += `⚠️ *Attenzione:* Le classi lavoratrici differiscono \\(${g1.role} vs ${g2.role}\\)\\. L'esproprio potrebbe violare il Piano Quinquennale\\!\n\n`;
        }

        if (diff > 0) {
            msg += `📈 L'esproprio arricchisce ingiustamente il compagno *${escapeMarkdown(p1.name)}* \\(\\+${diff} in quota produttiva\\)\\.`;
        } else if (diff < 0) {
            msg += `📈 L'esproprio arricchisce ingiustamente il compagno *${escapeMarkdown(p2.name)}* \\(\\+${Math.abs(diff)} in quota produttiva\\)\\.`;
        } else {
            msg += `🤝 L'esproprio è *perfettamente comunista* ed equo per il Partito\\!`;
        }

        await sendMessage(chatId, msg);

    } catch (e) {
        console.error("Error handling exchange:", e);
        await sendMessage(chatId, "Errore burocratico durante l'esproprio di Stato\\.");
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
    let msg = `📜 *Direttive del Partito sui Comandi del Bot* 📜\n\n`;
    msg += `Il Comitato Centrale ha approvato i seguenti strumenti per il popolo:\n\n`;
    msg += `* /best\\_team \\[ID\\_Mister\\]* \\- Richiedi al Soviet Supremo la migliore formazione calcolata scientificamente per massimizzare la produzione del tuo collettivo\\.\n`;
    msg += `* /exchange \\[ID1\\] \\[Gioc1\\] \\[ID2\\] \\[Gioc2\\]* \\- Invia una richiesta al Ministero del Commercio per valutare se uno scambio rispetta i principi di equità proletaria\\.\n`;
    msg += `* /mister* \\- Consulta gli archivi del KGB per ottenere l'ID di Partito di tutti i compagni fantallenatori\\.\n`;
    msg += `* /rule* \\- Consulta questo manifesto dei comandi di Partito\\.\n`;
    msg += `* /info* \\- Richiedi il dossier dettagliato sul funzionamento dell'algoritmo di Stato \\(API\\)\\.\n`;
    
    await sendMessage(chatId, msg);
}

async function handleInfo(chatId: number) {
    let msg = `⚙️ *Dossier Tecnico: L'Infrastruttura di Stato \\(API\\)* ⚙️\n\n`;
    msg += `L'applicazione centrale \\(API\\) funziona come l'apparato burocratico perfetto, distribuendo le risorse secondo le necessità di ogni compagno, senza favoritismi borghesi\\.\n\n`;
    msg += `*1\\. Raccolta Dati \\(Web Scraping\\)*\nI nostri ispettori statali prelevano quotidianamente i dati dalle fonti ufficiali, espropriando le statistiche dei lavoratori del pallone per inserirle nei nostri archivi centrali\\.\n\n`;
    msg += `*2\\. Modello Matematico di Valutazione*\nIl calcolatore centrale di Mosca analizza le prestazioni\\. Nessun voto è lasciato al caso o all'interpretazione borghese\\. Si assegna un "Expected Base Rating" \\(Voto di Stato\\) e un "Expected Value" \\(Fanta\\-Valore\\), aggiungendo bonus per i lavoratori specializzati in calci piazzati e rigori\\.\n\n`;
    msg += `*3\\. Pianificazione Formazione \\(Lineup\\)*\nIl sistema utilizza la programmazione lineare per schierare i compagni più produttivi\\. Non puoi scegliere la formazione: è lo Stato che sceglie la formazione migliore per te, rispettando i limiti strutturali \\(il modulo\\)\\.\n\n`;
    msg += `*4\\. Gestione delle Transazioni*\nOgni acquisto o scambio è registrato nel registro centrale \\(Database Relazionale\\)\\. Qualsiasi tentativo di accumulare crediti in modo illecito viene bloccato dal KGB\\.\n\n`;
    msg += `Gloria all'algoritmo\\!`;
    
    await sendMessage(chatId, msg);
}
