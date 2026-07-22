import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

  // Adjust score by starter probability for matchday valuation
  if (starterChance <= 0) {
    expectedMatchScore = 0.0; // Out / Injured / Suspended
  } else if (starterChance < 1.0) {
    expectedMatchScore = expectedMatchScore * (0.5 + starterChance * 0.5); // Ballot adjustment
  }

  expectedMatchScore = Math.max(0, Math.round(expectedMatchScore * 100.0) / 100.0);

  return {
    player,
    matchModifier: modifier,
    starterChance,
    expectedMatchScore,
    opponentTeam
  };
}

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const id = parseInt(params.id);
    const purchases = await prisma.purchase.findMany({
      where: { participantId: id },
      include: { player: true }
    });

    const fixtures = await prisma.matchFixture.findMany();

    let evaluatedPlayers = purchases.map(p => evaluatePlayerForMatchday(p.player, fixtures));
    evaluatedPlayers.sort((a, b) => b.expectedMatchScore - a.expectedMatchScore);
    const url = new URL(request.url);
    const requestedFormation = url.searchParams.get('formation');

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
        expectedTotalScore: 0.0,
        formation: "N/A"
      };
    }

    return NextResponse.json(bestLineup);
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
