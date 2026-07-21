import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as cheerio from 'cheerio';

const TEAM_STRENGTH: Record<string, number> = {
  "Inter": 5, "Juventus": 5, "Milan": 5, "Napoli": 5, "Atalanta": 5,
  "Roma": 4, "Lazio": 4, "Bologna": 3, "Fiorentina": 4, "Torino": 3,
  "Genoa": 3, "Monza": 3, "Lecce": 2, "Verona": 2, "Empoli": 2,
  "Udinese": 2, "Cagliari": 2, "Parma": 2, "Como": 2, "Venezia": 1,
  "Pisa": 2, "Sassuolo": 3, "Cremonese": 2, "Spezia": 2
};

function mapTeamAbbreviation(abbr: string): string {
  const map: Record<string, string> = {
    "INT": "Inter", "MIL": "Milan", "JUV": "Juventus", "NAP": "Napoli",
    "ROM": "Roma", "LAZ": "Lazio", "ATA": "Atalanta", "FIO": "Fiorentina",
    "TOR": "Torino", "BOL": "Bologna", "MON": "Monza", "GEN": "Genoa",
    "PAR": "Parma", "EMP": "Empoli", "VER": "Verona", "UDI": "Udinese",
    "CAG": "Cagliari", "LEC": "Lecce", "VEN": "Venezia", "COM": "Como",
    "PIS": "Pisa", "PISA": "Pisa", "SAS": "Sassuolo", "CRE": "Cremonese",
    "SPE": "Spezia"
  };
  return map[abbr] || (abbr ? abbr.charAt(0).toUpperCase() + abbr.slice(1).toLowerCase() : "Svincolato");
}

function cleanPlayerName(raw: string): string {
  if (!raw) return "";
  let cleaned = raw.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
  const words = cleaned.split(' ');
  
  if (words.length >= 2 && words.every(w => w.toLowerCase() === words[0].toLowerCase())) {
    return words[0];
  }
  if (words.length >= 3 && words.length % 3 === 0) {
    const unitSize = words.length / 3;
    const unit1 = words.slice(0, unitSize).join(' ');
    const unit2 = words.slice(unitSize, unitSize * 2).join(' ');
    const unit3 = words.slice(unitSize * 2).join(' ');
    if (unit1.toLowerCase() === unit2.toLowerCase() && unit2.toLowerCase() === unit3.toLowerCase()) {
      return unit1;
    }
  }
  if (words.length >= 2 && words.length % 2 === 0) {
    const unitSize = words.length / 2;
    const unit1 = words.slice(0, unitSize).join(' ');
    const unit2 = words.slice(unitSize).join(' ');
    if (unit1.toLowerCase() === unit2.toLowerCase()) {
      return unit1;
    }
  }
  return cleaned;
}

function calculatePlayerStats(name: string, role: string, currentQuote: number, fvm: number = 0) {
  let expectedBaseRating = role === 'P' ? 6.0 : role === 'C' ? 5.9 : role === 'A' ? 6.1 : 5.8;
  expectedBaseRating += Math.min(0.8, (currentQuote || fvm || 1) / 50.0);
  expectedBaseRating = Math.round(expectedBaseRating * 100.0) / 100.0;

  let penalty = 0.0, freekick = 0.0, corner = 0.0;
  let setPieceSpecialist = false;
  let oopIndex = 0.0;
  let isOop = false;

  const nameLower = name.toLowerCase();
  if (nameLower.includes("calhanoglu")) {
    penalty = 0.95; freekick = 0.6; corner = 0.5; setPieceSpecialist = true;
  } else if (nameLower.includes("dybala")) {
    penalty = 0.9; freekick = 0.7; corner = 0.6; setPieceSpecialist = true;
  } else if (nameLower.includes("vlahovic")) {
    penalty = 0.85; freekick = 0.5; setPieceSpecialist = true;
  } else if (nameLower.includes("dimarco")) {
    freekick = 0.4; corner = 0.7; setPieceSpecialist = true; isOop = true; oopIndex = 0.7;
  } else if (nameLower.includes("hernandez") && nameLower.includes("theo")) {
    penalty = 0.2; freekick = 0.3; setPieceSpecialist = true; isOop = true; oopIndex = 0.8;
  } else if (nameLower.includes("koopmeiners")) {
    penalty = 0.7; freekick = 0.3; corner = 0.4; setPieceSpecialist = true;
  } else if (nameLower.includes("pulisic")) {
    penalty = 0.4; corner = 0.3; setPieceSpecialist = true;
  } else if (nameLower.includes("zaccagni")) {
    penalty = 0.8; freekick = 0.5; corner = 0.4; setPieceSpecialist = true;
  } else if (nameLower.includes("lautaro")) {
    penalty = 0.8; setPieceSpecialist = true;
  } else if (nameLower.includes("retegui")) {
    penalty = 0.7; setPieceSpecialist = true;
  } else if (nameLower.includes("lukaku")) {
    penalty = 0.8; setPieceSpecialist = true;
  } else if (nameLower.includes("dovbyk")) {
    penalty = 0.7; setPieceSpecialist = true;
  } else if (nameLower.includes("kvaratskhelia")) {
    penalty = 0.5; freekick = 0.3; setPieceSpecialist = true;
  } else if (nameLower.includes("tramoni")) {
    penalty = 0.6; freekick = 0.5; setPieceSpecialist = true;
  } else if (nameLower.includes("berardi")) {
    penalty = 0.9; freekick = 0.6; setPieceSpecialist = true;
  } else {
    if (currentQuote > 20 && (role === 'A' || role === 'C')) {
      penalty = 0.15; setPieceSpecialist = true;
    }
    if (role === 'D' && (nameLower.includes("bellanova") || nameLower.includes("carlos augusto") || nameLower.includes("cambiaso") || nameLower.includes("dodo") || nameLower.includes("dumfries") || nameLower.includes("beruatto"))) {
      isOop = true; oopIndex = 0.5;
    }
  }

  let expectedValue = expectedBaseRating + (penalty * 3.0) + (freekick * 3.0) + (corner * 1.0);
  if (isOop) expectedValue += (oopIndex * 1.5);
  expectedValue = Math.round(expectedValue * 100.0) / 100.0;

  return {
    expectedBaseRating, penalty, freekick, corner, setPieceSpecialist, isOop, oopIndex, expectedValue
  };
}

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
  { homeTeam: "Inter", awayTeam: "Monza", homeTeamStrength: 5, awayTeamStrength: 3 },
  { homeTeam: "Juventus", awayTeam: "Parma", homeTeamStrength: 5, awayTeamStrength: 2 },
  { homeTeam: "Milan", awayTeam: "Venezia", homeTeamStrength: 5, awayTeamStrength: 1 },
  { homeTeam: "Napoli", awayTeam: "Cagliari", homeTeamStrength: 5, awayTeamStrength: 2 },
  { homeTeam: "Roma", awayTeam: "Udinese", homeTeamStrength: 4, awayTeamStrength: 2 },
  { homeTeam: "Lazio", awayTeam: "Verona", homeTeamStrength: 4, awayTeamStrength: 2 },
  { homeTeam: "Atalanta", awayTeam: "Fiorentina", homeTeamStrength: 5, awayTeamStrength: 4 },
  { homeTeam: "Pisa", awayTeam: "Sassuolo", homeTeamStrength: 2, awayTeamStrength: 3 },
  { homeTeam: "Bologna", awayTeam: "Genoa", homeTeamStrength: 3, awayTeamStrength: 3 },
  { homeTeam: "Torino", awayTeam: "Empoli", homeTeamStrength: 3, awayTeamStrength: 2 },
];

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version, x-cron-secret',
    },
  });
}

export async function POST() {
  try {
    let scrapedPlayersCount = 0;
    let playersCreated = 0;
    let playersUpdated = 0;
    let participantsCreated = 0;
    let fixturesCreated = 0;

    // 1. Fetch live page from Fantacalcio.it with fast 3s timeout
    const playersToSave: any[] = [];
    try {
      const response = await fetch("https://www.fantacalcio.it/quotazioni-fantacalcio", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);

        $('tr.player-row, .player-item, tr[data-id]').each((_, row) => {
          const rawName = $(row).find('a.name, .player-name span, .player-name').first().text().trim();
          const name = cleanPlayerName(rawName);
          if (!name) return;

          const role = ($(row).attr('data-filter-role-classic') || $(row).find('.role').text().trim()).toUpperCase().charAt(0) || 'C';
          const teamAbbr = $(row).find('.player-team, .team').text().trim().toUpperCase();
          const team = mapTeamAbbreviation(teamAbbr);

          const initialQuoteStr = $(row).find('.player-classic-initial-price, .initial-price').text().trim();
          const currentQuoteStr = $(row).find('.player-classic-current-price, .current-price').text().trim();
          const fvmStr = $(row).find('.player-classic-fvm, .fvm').text().trim();

          const initialQuote = initialQuoteStr ? parseInt(initialQuoteStr) : 1;
          const currentQuote = currentQuoteStr ? parseInt(currentQuoteStr) : initialQuote;
          const fvm = fvmStr ? parseInt(fvmStr) : 0;

          const stats = calculatePlayerStats(name, role, currentQuote, fvm);

          playersToSave.push({
            name, team, role, initialQuote, currentQuote, fvm,
            ...stats
          });
        });
        scrapedPlayersCount = playersToSave.length;
      }
    } catch (e) {
      console.log("Fantacalcio live fetch skipped/timed out, serving database records.");
    }

    // 2. Fetch existing players from DB to prevent duplicates
    const existingPlayers = await prisma.player.findMany();
    const existingPlayersMap = new Map<string, number>();
    for (const p of existingPlayers) {
      existingPlayersMap.set(p.name.toLowerCase().trim(), p.id);
    }

    // 3. Fast Parallel Batch Upsert into DB
    const toCreate: any[] = [];
    const updatePromises: any[] = [];

    for (const p of playersToSave) {
      const nameKey = p.name.toLowerCase().trim();
      const existingId = existingPlayersMap.get(nameKey);

      const playerData = {
        name: p.name,
        team: p.team,
        role: p.role,
        initialQuote: p.initialQuote,
        currentQuote: p.currentQuote,
        expectedValue: p.expectedValue,
        expectedBaseRating: p.expectedBaseRating,
        isOop: p.isOop ?? false,
        oopIndex: p.oopIndex ?? 0,
        isSetPieceSpecialist: p.setPieceSpecialist ?? false,
        penaltyTakerPercentage: p.penalty ?? 0,
      };

      if (existingId) {
        updatePromises.push(
          prisma.player.update({
            where: { id: existingId },
            data: playerData,
          })
        );
        playersUpdated++;
      } else {
        toCreate.push(playerData);
        playersCreated++;
      }
    }

    // Execute updates in parallel chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < updatePromises.length; i += chunkSize) {
      await Promise.all(updatePromises.slice(i, i + chunkSize));
    }

    // Execute bulk create for new players
    if (toCreate.length > 0) {
      await prisma.player.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
    }

    // 4. Ensure default Participants (Mister) exist
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

    // 5. Ensure Match Fixtures are updated to latest matchday schedule
    await prisma.matchFixture.deleteMany({});
    await prisma.matchFixture.createMany({
      data: SEED_FIXTURES,
    });
    fixturesCreated = SEED_FIXTURES.length;

    return NextResponse.json({
      success: true,
      message: "Database popolato e sincronizzato in tempo reale!",
      scrapedPlayersCount,
      playersCreated,
      playersUpdated,
      totalPlayers: existingPlayersMap.size,
      participantsCreated,
      fixturesCreated,
    });
  } catch (error: any) {
    console.error("Live Seed API Error:", error);
    return NextResponse.json({ error: error.message || "Errore nella sincronizzazione DB live" }, { status: 500 });
  }
}
