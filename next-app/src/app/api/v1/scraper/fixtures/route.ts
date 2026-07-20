import { NextResponse } from 'next/server';

export async function GET() {
  const fallback = [
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

  return NextResponse.json(fallback);
}
