import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { playerId, buyerParticipantId, price } = body;

    if (!playerId || !buyerParticipantId || !price) {
      return NextResponse.json({ error: 'Campi mancanti' }, { status: 400 });
    }

    if (price < 1) {
      return NextResponse.json({ error: 'Il prezzo minimo deve essere di 1 credito' }, { status: 400 });
    }

    // Usiamo una transaction per garantire la consistenza
    const purchase = await prisma.$transaction(async (tx) => {
      const player = await tx.player.findUnique({ where: { id: playerId } });
      if (!player) throw new Error('Giocatore non trovato');

      const existingPurchase = await tx.purchase.findUnique({ where: { playerId } });
      if (existingPurchase) throw new Error('Giocatore già assegnato');

      const participant = await tx.auctionParticipant.findUnique({ where: { id: buyerParticipantId } });
      if (!participant) throw new Error('Partecipante non trovato');

      const roleLimits: Record<string, number> = { 'P': 3, 'D': 8, 'C': 8, 'A': 6 };
      const currentPurchases = await tx.purchase.findMany({
        where: { participantId: buyerParticipantId },
        include: { player: true }
      });
      
      const countInRole = currentPurchases.filter(p => p.player.role === player.role).length;
      if (countInRole >= (roleLimits[player.role] || 99)) {
        throw new Error(`Limite raggiunto per il ruolo ${player.role} (${roleLimits[player.role]} slot massimi)`);
      }

      if (participant.remainingBudget < price) {
        throw new Error('Crediti insufficienti');
      }

      await tx.auctionParticipant.update({
        where: { id: buyerParticipantId },
        data: { remainingBudget: participant.remainingBudget - price }
      });

      await tx.player.update({
        where: { id: playerId },
        data: { currentQuote: price }
      });

      return await tx.purchase.create({
        data: {
          playerId,
          participantId: buyerParticipantId,
          price
        },
        include: { player: true, participant: true }
      });
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
