import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const teams = await prisma.auctionParticipant.findMany();
    return NextResponse.json(teams);
  } catch (error) {
    return NextResponse.json({ error: 'Errore nel recupero delle squadre' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, initialBudget } = body;

    if (!name) {
      return NextResponse.json({ error: 'Il nome della squadra è obbligatorio' }, { status: 400 });
    }
    if (initialBudget === undefined || initialBudget < 1) {
      return NextResponse.json({ error: 'Il budget iniziale deve essere almeno di 1 credito' }, { status: 400 });
    }

    const existing = await prisma.auctionParticipant.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: 'Una squadra con questo nome esiste già' }, { status: 400 });
    }

    const team = await prisma.auctionParticipant.create({
      data: {
        name,
        initialBudget,
        remainingBudget: initialBudget,
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Errore nella creazione della squadra' }, { status: 500 });
  }
}
