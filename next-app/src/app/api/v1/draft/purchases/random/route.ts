import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/v1/draft/purchases/random
// Assegna in modo casuale rose complete a tutti i manager registrati nel DB
export async function POST() {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Pulisci tutti gli acquisti esistenti
      await tx.purchase.deleteMany({});

      // 2. Reset dei budget dei mister
      await tx.auctionParticipant.updateMany({
        data: { remainingBudget: 500 }
      });

      // 3. Prendi tutti i mister
      const participants = await tx.auctionParticipant.findMany();
      if (participants.length === 0) {
        throw new Error('Nessun mister registrato. Crea prima le squadre!');
      }

      // 4. Prendi tutti i giocatori disponibili
      const allPlayers = await tx.player.findMany();
      if (allPlayers.length < participants.length * 25) {
        throw new Error('Giocatori insufficienti nel database per coprire 25 giocatori per mister!');
      }

      // Raggruppa i giocatori disponibili per ruolo
      const pool: Record<string, typeof allPlayers> = {
        P: allPlayers.filter(p => p.role === 'P'),
        D: allPlayers.filter(p => p.role === 'D'),
        C: allPlayers.filter(p => p.role === 'C'),
        A: allPlayers.filter(p => p.role === 'A')
      };

      // Shuffla gli array del pool
      const shuffle = (array: any[]) => {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
      };
      
      shuffle(pool.P);
      shuffle(pool.D);
      shuffle(pool.C);
      shuffle(pool.A);

      const roleLimits: Record<string, number> = { P: 3, D: 8, C: 8, A: 6 };

      // Per ogni mister, proviamo ad assegnare la rosa
      for (const participant of participants) {
        let currentBudget = 500;

        for (const role of ['P', 'D', 'C', 'A']) {
          const limit = roleLimits[role];
          for (let k = 0; k < limit; k++) {
            const player = pool[role].pop();
            if (!player) {
              throw new Error(`Giocatori insufficienti per il ruolo ${role}!`);
            }

            // Costo casuale realistico (es. tra 1 e 30 crediti, limitato dal budget rimanente)
            // Assicuriamoci di conservare almeno 1 credito per i futuri giocatori della rosa
            const maxCost = Math.min(35, currentBudget - (25 - (k + 1))); 
            const cost = Math.max(1, Math.floor(Math.random() * maxCost) + 1);

            currentBudget -= cost;

            // Crea acquisto
            await tx.purchase.create({
              data: {
                playerId: player.id,
                participantId: participant.id,
                price: cost
              }
            });

            // Aggiorna quotazione corrente
            await tx.player.update({
              where: { id: player.id },
              data: { currentQuote: cost }
            });
          }
        }

        // Salva il budget residuo finale del mister
        await tx.auctionParticipant.update({
          where: { id: participant.id },
          data: { remainingBudget: currentBudget }
        });
      }
    });

    return NextResponse.json({ message: 'Assegnazione casuale delle rose completata con successo!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
