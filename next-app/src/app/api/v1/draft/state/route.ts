import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const participants = await prisma.auctionParticipant.findMany();
    const purchases = await prisma.purchase.findMany({ include: { player: true, participant: true } });

    return NextResponse.json({
      participants,
      recent_purchases: purchases,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Errore nel recupero dello stato' }, { status: 500 });
  }
}
