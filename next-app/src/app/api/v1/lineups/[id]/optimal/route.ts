import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Fallback fixtures data (instead of making an HTTP call to ourselves)
const getFixtures = () => {
  return [
    { homeTeam: "Inter", awayTeam: "Monza", homeTeamStrength: 5, awayTeamStrength: 3 },
    { homeTeam: "Milan", awayTeam: "Lecce", homeTeamStrength: 5, awayTeamStrength: 2 },
    { homeTeam: "Roma", awayTeam: "Napoli", homeTeamStrength: 4, awayTeamStrength: 5 },
    { homeTeam: "Atalanta", awayTeam: "Venezia", homeTeamStrength: 5, awayTeamStrength: 1 },
    { homeTeam: "Fiorentina", awayTeam: "Lazio", homeTeamStrength: 4, awayTeamStrength: 4 },
    { homeTeam: "Genoa", awayTeam: "Bologna", homeTeamStrength: 3, awayTeamStrength: 3 },
    { homeTeam: "Torino", awayTeam: "Juventus", homeTeamStrength: 3, awayTeamStrength: 5 },
    { homeTeam: "Udinese", awayTeam: "Cagliari", homeTeamStrength: 2, awayTeamStrength: 2 },
    { homeTeam: "Verona", awayTeam: "Empoli", homeTeamStrength: 2, awayTeamStrength: 2 },
    { homeTeam: "Parma", awayTeam: "Como", homeTeamStrength: 2, awayTeamStrength: 2 }
  ];
};

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

  let expectedMatchScore = (player.expectedValue || 6.0) + modifier;
  expectedMatchScore = Math.round(expectedMatchScore * 100.0) / 100.0;

  return {
    player,
    modifier,
    expectedMatchScore,
    opponentTeam
  };
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const purchases = await prisma.purchase.findMany({
      where: { participantId: id },
      include: { player: true }
    });

    const fixtures = getFixtures();

    let evaluatedPlayers = purchases.map(p => evaluatePlayerForMatchday(p.player, fixtures));
    evaluatedPlayers.sort((a, b) => b.expectedMatchScore - a.expectedMatchScore);

    const formations = ["3-4-3", "4-3-3", "3-5-2", "4-4-2", "5-3-2", "4-5-1", "5-4-1"];

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
            starters,
            bench,
            expectedTotalScore: currentScore,
            formation: formationStr
          };
        }
      }
    }

    if (!bestLineup) {
      bestLineup = {
        starters: evaluatedPlayers,
        bench: [],
        expectedTotalScore: 0.0,
        formation: "N/A"
      };
    }

    return NextResponse.json(bestLineup);
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
