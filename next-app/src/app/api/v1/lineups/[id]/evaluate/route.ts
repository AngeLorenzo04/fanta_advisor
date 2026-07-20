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

  let expectedMatchScore = (player.expectedValue || 6.0) + modifier;
  expectedMatchScore = Math.round(expectedMatchScore * 100.0) / 100.0;

  return {
    player,
    matchModifier: modifier,
    expectedMatchScore,
    opponentTeam
  };
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const startingPlayerIds: number[] = body.startingPlayerIds || [];

    const purchases = await prisma.purchase.findMany({
      where: { participantId: id },
      include: { player: true }
    });

    const fixtures = await prisma.matchFixture.findMany();

    const evaluatedPlayers = purchases.map(p => evaluatePlayerForMatchday(p.player, fixtures));

    const starting11 = evaluatedPlayers.filter(p => startingPlayerIds.includes(p.player.id));
    const bench = evaluatedPlayers.filter(p => !startingPlayerIds.includes(p.player.id));

    // Sort starters by role (P, D, C, A)
    const roleOrder: Record<string, number> = { 'P': 1, 'D': 2, 'C': 3, 'A': 4 };
    starting11.sort((a, b) => roleOrder[a.player.role] - roleOrder[b.player.role]);

    // Sort bench by expectedMatchScore descending
    bench.sort((a, b) => b.expectedMatchScore - a.expectedMatchScore);

    let currentScore = starting11.reduce((sum, p) => sum + p.expectedMatchScore, 0);
    currentScore = Math.round(currentScore * 100.0) / 100.0;

    const pCount = starting11.filter(p => p.player.role === 'P').length;
    const dCount = starting11.filter(p => p.player.role === 'D').length;
    const cCount = starting11.filter(p => p.player.role === 'C').length;
    const aCount = starting11.filter(p => p.player.role === 'A').length;
    
    // Validazione base
    let formationStr = "Non Valida";
    if (pCount === 1 && dCount >= 3 && cCount >= 3 && aCount >= 1 && starting11.length === 11) {
        formationStr = `${dCount}-${cCount}-${aCount}`;
    } else if (starting11.length < 11) {
        formationStr = `Incompleta (${starting11.length}/11)`;
    }

    return NextResponse.json({
      starting11,
      bench,
      totalProjectedScore: currentScore,
      formation: formationStr
    });
  } catch (error) {
    console.error("Evaluation Error:", error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
