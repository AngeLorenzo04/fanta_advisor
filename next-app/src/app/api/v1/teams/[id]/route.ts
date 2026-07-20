import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const id = parseInt(params.id);
    const team = await prisma.auctionParticipant.findUnique({ where: { id } });
    
    if (!team) {
      return NextResponse.json({ error: 'Squadra non trovata con ID: ' + id }, { status: 404 });
    }
    return NextResponse.json(team);
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const id = parseInt(params.id);
    const body = await request.json();
    const { name, initialBudget, remainingBudget } = body;

    const team = await prisma.auctionParticipant.findUnique({ where: { id } });
    if (!team) {
      return NextResponse.json({ error: 'Squadra non trovata con ID: ' + id }, { status: 404 });
    }

    if (team.name !== name) {
      const existing = await prisma.auctionParticipant.findUnique({ where: { name } });
      if (existing) {
        return NextResponse.json({ error: 'Una squadra con questo nome esiste già' }, { status: 400 });
      }
    }

    const updated = await prisma.auctionParticipant.update({
      where: { id },
      data: { name, initialBudget, remainingBudget },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const id = parseInt(params.id);
    const team = await prisma.auctionParticipant.findUnique({ 
      where: { id },
      include: { purchases: true } 
    });

    if (!team) {
      return NextResponse.json({ error: 'Squadra non trovata con ID: ' + id }, { status: 404 });
    }

    if (team.purchases.length > 0) {
      return NextResponse.json({ error: 'Impossibile eliminare una squadra con acquisti attivi' }, { status: 400 });
    }

    await prisma.auctionParticipant.delete({ where: { id } });
    return NextResponse.json({ message: 'Squadra eliminata con successo' });
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
