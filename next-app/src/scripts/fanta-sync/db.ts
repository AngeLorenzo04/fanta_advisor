import { PrismaClient } from '@prisma/client';
import { ScrapedTeam, ScrapedPlayer } from './scraper';

const prisma = new PrismaClient();

export class DatabaseService {
  async syncTeams(scrapedTeams: ScrapedTeam[]) {
    console.log(`\n✅ Sincronizzazione Rose nel Database...`);
    let totalPurchases = 0;

    for (const team of scrapedTeams) {
      console.log(`- ${team.name}: ${team.players.length} giocatori, Budget: ${team.initialBudget || 500}`);
        
      await prisma.auctionParticipant.upsert({
        where: { name: team.name },
        update: { 
           initialBudget: 500,
           remainingBudget: team.initialBudget || 500
        },
        create: {
          name: team.name,
          initialBudget: 500,
          remainingBudget: team.initialBudget || 500
        }
      });
  
      const participant = await prisma.auctionParticipant.findFirst({
        where: { name: { contains: team.name, mode: 'insensitive' } }
      });
      
      if (participant) {
        let teamPurchases = 0;
        for (const p of team.players) {
          const cleanedName = p.name.split(' ')[0].toLowerCase();
          
          const dbPlayer = await prisma.player.findFirst({
            where: { name: { startsWith: cleanedName, mode: 'insensitive' } }
          });
          
          if (dbPlayer) {
            const existingPurchase = await prisma.purchase.findUnique({
              where: { playerId: dbPlayer.id }
            });
            
            if (!existingPurchase) {
              await prisma.purchase.create({
                data: {
                  playerId: dbPlayer.id,
                  participantId: participant.id,
                  price: p.cost
                }
              });
              teamPurchases++;
              totalPurchases++;
            }
          }
        }
        if (teamPurchases > 0) {
          console.log(`📥 Inseriti ${teamPurchases} nuovi acquisti per ${team.name}`);
        }
      }
    }
    console.log(`🎉 Rose sincronizzate! Totale nuovi acquisti inseriti: ${totalPurchases}`);
  }

  async syncPlayers(scrapedPlayers: ScrapedPlayer[]) {
    console.log(`\n✅ Sincronizzazione Listone (Calciatori) nel Database...`);
    let added = 0;
    let updated = 0;

    for (const p of scrapedPlayers) {
      // Find the player by exact name or create
      // Using an upsert or findFirst to be robust against slight name variations
      const existing = await prisma.player.findFirst({
        where: { 
          name: { equals: p.name, mode: 'insensitive' },
          team: { equals: p.team, mode: 'insensitive' } 
        }
      });

      if (existing) {
        await prisma.player.update({
          where: { id: existing.id },
          data: {
            role: p.role !== "Sconosciuto" ? p.role : existing.role,
            initialQuote: p.initialQuote || existing.initialQuote,
            currentQuote: p.currentQuote || existing.currentQuote,
            expectedValue: p.fvm || existing.expectedValue
          }
        });
        updated++;
      } else {
        await prisma.player.create({
          data: {
            name: p.name,
            team: p.team,
            role: p.role,
            initialQuote: p.initialQuote,
            currentQuote: p.currentQuote,
            expectedValue: p.fvm
          }
        });
        added++;
      }
    }

    console.log(`🎉 Listone sincronizzato! Aggiunti: ${added}, Aggiornati: ${updated}`);
  }

  async disconnect() {
    await prisma.$disconnect();
  }
}
