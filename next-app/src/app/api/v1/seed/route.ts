import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SEED_PLAYERS = [
  // Portieri
  { name: "Meret", team: "Napoli", role: "P", initialQuote: 18, currentQuote: 18, expectedValue: 6.4 },
  { name: "Di Gregorio", team: "Juventus", role: "P", initialQuote: 20, currentQuote: 20, expectedValue: 6.6 },
  { name: "Sommer", team: "Inter", role: "P", initialQuote: 22, currentQuote: 22, expectedValue: 6.7 },
  { name: "Maignan", team: "Milan", role: "P", initialQuote: 24, currentQuote: 24, expectedValue: 6.8 },
  { name: "Provedel", team: "Lazio", role: "P", initialQuote: 16, currentQuote: 16, expectedValue: 6.2 },
  { name: "Svilar", team: "Roma", role: "P", initialQuote: 17, currentQuote: 17, expectedValue: 6.5 },
  { name: "Carnesecchi", team: "Atalanta", role: "P", initialQuote: 15, currentQuote: 15, expectedValue: 6.3 },
  { name: "De Gea", team: "Fiorentina", role: "P", initialQuote: 14, currentQuote: 14, expectedValue: 6.1 },

  // Difensori
  { name: "Bastoni", team: "Inter", role: "D", initialQuote: 26, currentQuote: 26, expectedValue: 6.9 },
  { name: "Bremer", team: "Juventus", role: "D", initialQuote: 24, currentQuote: 24, expectedValue: 6.7 },
  { name: "Di Lorenzo", team: "Napoli", role: "D", initialQuote: 22, currentQuote: 22, expectedValue: 6.8 },
  { name: "Theo Hernandez", team: "Milan", role: "D", initialQuote: 30, currentQuote: 30, expectedValue: 7.4, isSetPieceSpecialist: true, isOop: true, oopIndex: 0.8 },
  { name: "Dimarco", team: "Inter", role: "D", initialQuote: 28, currentQuote: 28, expectedValue: 7.2, isSetPieceSpecialist: true, isOop: true, oopIndex: 0.7 },
  { name: "Dumfries", team: "Inter", role: "D", initialQuote: 20, currentQuote: 20, expectedValue: 6.9, isOop: true, oopIndex: 0.5 },
  { name: "Cambiaso", team: "Juventus", role: "D", initialQuote: 18, currentQuote: 18, expectedValue: 6.7, isOop: true, oopIndex: 0.5 },
  { name: "Buongiorno", team: "Napoli", role: "D", initialQuote: 19, currentQuote: 19, expectedValue: 6.6 },
  { name: "Angelino", team: "Roma", role: "D", initialQuote: 17, currentQuote: 17, expectedValue: 6.8, isSetPieceSpecialist: true },
  { name: "Bellanova", team: "Atalanta", role: "D", initialQuote: 16, currentQuote: 16, expectedValue: 6.7, isOop: true, oopIndex: 0.5 },
  { name: "Gosens", team: "Fiorentina", role: "D", initialQuote: 15, currentQuote: 15, expectedValue: 6.6 },
  { name: "Tavares", team: "Lazio", role: "D", initialQuote: 21, currentQuote: 21, expectedValue: 7.0, isSetPieceSpecialist: true },
  { name: "Kalulu", team: "Juventus", role: "D", initialQuote: 12, currentQuote: 12, expectedValue: 6.3 },
  { name: "Tomori", team: "Milan", role: "D", initialQuote: 13, currentQuote: 13, expectedValue: 6.4 },

  // Centrocampisti
  { name: "Barella", team: "Inter", role: "C", initialQuote: 28, currentQuote: 28, expectedValue: 7.3 },
  { name: "Koopmeiners", team: "Juventus", role: "C", initialQuote: 30, currentQuote: 30, expectedValue: 7.5, isSetPieceSpecialist: true, penaltyTakerPercentage: 0.7 },
  { name: "Pulisic", team: "Milan", role: "C", initialQuote: 34, currentQuote: 34, expectedValue: 8.1, isSetPieceSpecialist: true, penaltyTakerPercentage: 0.4 },
  { name: "McTominay", team: "Napoli", role: "C", initialQuote: 26, currentQuote: 26, expectedValue: 7.6 },
  { name: "Kvaratskhelia", team: "Napoli", role: "C", initialQuote: 38, currentQuote: 38, expectedValue: 8.4, isSetPieceSpecialist: true },
  { name: "Zaccagni", team: "Lazio", role: "C", initialQuote: 24, currentQuote: 24, expectedValue: 7.4, isSetPieceSpecialist: true, penaltyTakerPercentage: 0.8 },
  { name: "Dybala", team: "Roma", role: "C", initialQuote: 32, currentQuote: 32, expectedValue: 7.9, isSetPieceSpecialist: true, penaltyTakerPercentage: 0.9 },
  { name: "Reijnders", team: "Milan", role: "C", initialQuote: 22, currentQuote: 22, expectedValue: 7.1 },
  { name: "Fagioli", team: "Juventus", role: "C", initialQuote: 16, currentQuote: 16, expectedValue: 6.6 },
  { name: "Frattesi", team: "Inter", role: "C", initialQuote: 18, currentQuote: 18, expectedValue: 6.9 },
  { name: "Anguissa", team: "Napoli", role: "C", initialQuote: 20, currentQuote: 20, expectedValue: 7.0 },
  { name: "Loftus-Cheek", team: "Milan", role: "C", initialQuote: 17, currentQuote: 17, expectedValue: 6.7 },
  { name: "Pellegrini", team: "Roma", role: "C", initialQuote: 21, currentQuote: 21, expectedValue: 7.0, isSetPieceSpecialist: true },
  { name: "Guendouzi", team: "Lazio", role: "C", initialQuote: 15, currentQuote: 15, expectedValue: 6.6 },
  { name: "Calhanoglu", team: "Inter", role: "C", initialQuote: 32, currentQuote: 32, expectedValue: 8.2, isSetPieceSpecialist: true, penaltyTakerPercentage: 0.95 },

  // Attaccanti
  { name: "Lautaro Martinez", team: "Inter", role: "A", initialQuote: 45, currentQuote: 45, expectedValue: 8.9, isSetPieceSpecialist: true, penaltyTakerPercentage: 0.8 },
  { name: "Vlahovic", team: "Juventus", role: "A", initialQuote: 42, currentQuote: 42, expectedValue: 8.5, isSetPieceSpecialist: true, penaltyTakerPercentage: 0.85 },
  { name: "Lukaku", team: "Napoli", role: "A", initialQuote: 40, currentQuote: 40, expectedValue: 8.4, isSetPieceSpecialist: true, penaltyTakerPercentage: 0.8 },
  { name: "Thuram", team: "Inter", role: "A", initialQuote: 38, currentQuote: 38, expectedValue: 8.3 },
  { name: "Retegui", team: "Atalanta", role: "A", initialQuote: 36, currentQuote: 36, expectedValue: 8.2, isSetPieceSpecialist: true, penaltyTakerPercentage: 0.7 },
  { name: "Dovbyk", team: "Roma", role: "A", initialQuote: 34, currentQuote: 34, expectedValue: 8.0, isSetPieceSpecialist: true, penaltyTakerPercentage: 0.7 },
  { name: "Castellanos", team: "Lazio", role: "A", initialQuote: 28, currentQuote: 28, expectedValue: 7.6 },
  { name: "Kean", team: "Fiorentina", role: "A", initialQuote: 30, currentQuote: 30, expectedValue: 7.8 },
  { name: "Zapata", team: "Torino", role: "A", initialQuote: 26, currentQuote: 26, expectedValue: 7.4, isSetPieceSpecialist: true, penaltyTakerPercentage: 0.5 },
  { name: "Morata", team: "Milan", role: "A", initialQuote: 27, currentQuote: 27, expectedValue: 7.5 },
  { name: "Krstovic", team: "Lecce", role: "A", initialQuote: 20, currentQuote: 20, expectedValue: 7.1 },
  { name: "Lucca", team: "Udinese", role: "A", initialQuote: 18, currentQuote: 18, expectedValue: 6.9 },
  { name: "Lookman", team: "Atalanta", role: "A", initialQuote: 35, currentQuote: 35, expectedValue: 8.1, isSetPieceSpecialist: true, penaltyTakerPercentage: 0.6 },
];

const SEED_PARTICIPANTS = [
  "FC Ranocchia",
  "Real Sconcerti",
  "AS Panchina",
  "Bomber United",
  "Deportivo Fantallenatore",
  "Inter Nazionale",
  "Catenaccio FC",
  "Golazo Squad"
];

const SEED_FIXTURES = [
  { homeTeam: "Inter", awayTeam: "Lecce", homeTeamStrength: 5, awayTeamStrength: 2 },
  { homeTeam: "Juventus", awayTeam: "Como", homeTeamStrength: 5, awayTeamStrength: 2 },
  { homeTeam: "Milan", awayTeam: "Torino", homeTeamStrength: 5, awayTeamStrength: 3 },
  { homeTeam: "Napoli", awayTeam: "Bologna", homeTeamStrength: 5, awayTeamStrength: 3 },
  { homeTeam: "Roma", awayTeam: "Empoli", homeTeamStrength: 4, awayTeamStrength: 2 },
  { homeTeam: "Lazio", awayTeam: "Venezia", homeTeamStrength: 4, awayTeamStrength: 1 },
  { homeTeam: "Atalanta", awayTeam: "Fiorentina", homeTeamStrength: 5, awayTeamStrength: 4 },
  { homeTeam: "Cagliari", awayTeam: "Genoa", homeTeamStrength: 2, awayTeamStrength: 3 },
  { homeTeam: "Parma", awayTeam: "Udinese", homeTeamStrength: 2, awayTeamStrength: 2 },
  { homeTeam: "Verona", awayTeam: "Monza", homeTeamStrength: 2, awayTeamStrength: 3 },
];

export async function POST() {
  try {
    let playersCreated = 0;
    let playersUpdated = 0;
    let participantsCreated = 0;
    let fixturesCreated = 0;

    // 1. Fetch existing players to prevent duplicates
    const existingPlayers = await prisma.player.findMany();
    const existingPlayersMap = new Map<string, number>();
    for (const p of existingPlayers) {
      existingPlayersMap.set(p.name.toLowerCase().trim(), p.id);
    }

    // 2. Upsert Players
    for (const p of SEED_PLAYERS) {
      const nameKey = p.name.toLowerCase().trim();
      const existingId = existingPlayersMap.get(nameKey);

      if (existingId) {
        // Update existing player with latest quotes & stats without duplicating
        await prisma.player.update({
          where: { id: existingId },
          data: {
            team: p.team,
            role: p.role,
            initialQuote: p.initialQuote,
            currentQuote: p.currentQuote,
            expectedValue: p.expectedValue,
            isOop: p.isOop ?? false,
            oopIndex: p.oopIndex ?? 0,
            isSetPieceSpecialist: p.isSetPieceSpecialist ?? false,
            penaltyTakerPercentage: p.penaltyTakerPercentage ?? 0,
          },
        });
        playersUpdated++;
      } else {
        // Create new player record
        const newP = await prisma.player.create({
          data: {
            name: p.name,
            team: p.team,
            role: p.role,
            initialQuote: p.initialQuote,
            currentQuote: p.currentQuote,
            expectedValue: p.expectedValue,
            isOop: p.isOop ?? false,
            oopIndex: p.oopIndex ?? 0,
            isSetPieceSpecialist: p.isSetPieceSpecialist ?? false,
            penaltyTakerPercentage: p.penaltyTakerPercentage ?? 0,
          },
        });
        existingPlayersMap.set(nameKey, newP.id);
        playersCreated++;
      }
    }

    // 3. Upsert Participants (Mister)
    for (const pName of SEED_PARTICIPANTS) {
      const existing = await prisma.auctionParticipant.findUnique({
        where: { name: pName },
      });

      if (!existing) {
        await prisma.auctionParticipant.create({
          data: {
            name: pName,
            initialBudget: 500,
            remainingBudget: 500,
          },
        });
        participantsCreated++;
      }
    }

    // 4. Upsert Fixtures if empty
    const currentFixturesCount = await prisma.matchFixture.count();
    if (currentFixturesCount === 0) {
      await prisma.matchFixture.createMany({
        data: SEED_FIXTURES,
      });
      fixturesCreated = SEED_FIXTURES.length;
    }

    return NextResponse.json({
      success: true,
      message: "Database sincronizzato con successo!",
      playersCreated,
      playersUpdated,
      totalPlayers: existingPlayersMap.size,
      participantsCreated,
      fixturesCreated,
    });
  } catch (error: any) {
    console.error("Seed API Error:", error);
    return NextResponse.json({ error: error.message || "Errore nella sincronizzazione DB" }, { status: 500 });
  }
}
