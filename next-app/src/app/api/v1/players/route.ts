import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filterParams: any = {};

  const name = searchParams.get('name');
  if (name) filterParams.name = { contains: name, mode: 'insensitive' };

  const role = searchParams.get('role');
  if (role) filterParams.role = role.toUpperCase();

  const team = searchParams.get('team');
  if (team) filterParams.team = { contains: team, mode: 'insensitive' };

  try {
    const players = await prisma.player.findMany({ where: filterParams });
    return NextResponse.json(players);
  } catch (error) {
    return NextResponse.json({ error: 'Errore nel recupero dei giocatori' }, { status: 500 });
  }
}
