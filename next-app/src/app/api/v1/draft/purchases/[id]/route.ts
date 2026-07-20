import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const id = parseInt(params.id);
    const body = await request.json();
    const { buyerParticipantId, price } = body;

    if (!buyerParticipantId || !price) {
      return NextResponse.json({ error: 'Campi mancanti' }, { status: 400 });
    }
    if (price < 1) {
      return NextResponse.json({ error: 'Il prezzo minimo deve essere di 1 credito' }, { status: 400 });
    }

    const updatedPurchase = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findUnique({ where: { id }, include: { player: true, participant: true } });
      if (!purchase) throw new Error('Acquisto non trovato');

      let oldParticipant = purchase.participant;
      
      // Restituisci i soldi al vecchio
      await tx.auctionParticipant.update({
        where: { id: oldParticipant.id },
        data: { remainingBudget: oldParticipant.remainingBudget + purchase.price }
      });

      // Ricarica il nuovo partecipante per avere il budget aggiornato (incluso se è lo stesso)
      const newParticipant = await tx.auctionParticipant.findUnique({ where: { id: buyerParticipantId } });
      if (!newParticipant) throw new Error('Nuovo partecipante non trovato');

      if (newParticipant.remainingBudget < price) {
        throw new Error('Crediti insufficienti per il nuovo acquirente');
      }

      await tx.auctionParticipant.update({
        where: { id: buyerParticipantId },
        data: { remainingBudget: newParticipant.remainingBudget - price }
      });

      await tx.player.update({
        where: { id: purchase.playerId },
        data: { currentQuote: price }
      });

      return await tx.purchase.update({
        where: { id },
        data: {
          participantId: buyerParticipantId,
          price
        },
        include: { player: true, participant: true }
      });
    });

    return NextResponse.json(updatedPurchase);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const id = parseInt(params.id);

    await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findUnique({ where: { id }, include: { player: true, participant: true } });
      if (!purchase) throw new Error('Acquisto non trovato');

      await tx.auctionParticipant.update({
        where: { id: purchase.participantId },
        data: { remainingBudget: purchase.participant.remainingBudget + purchase.price }
      });

      await tx.player.update({
        where: { id: purchase.playerId },
        data: { currentQuote: purchase.player.initialQuote ?? 1 }
      });

      await tx.purchase.delete({ where: { id } });
    });

    return NextResponse.json({ message: 'Acquisto eliminato con successo' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
