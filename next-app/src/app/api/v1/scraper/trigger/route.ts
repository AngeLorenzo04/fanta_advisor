import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const fallbackPlayers = [
    { name: "Yann Sommer", team: "Inter", role: "P", initialQuote: 18, currentQuote: 18, expectedBaseRating: 6.2, oopIndex: 0.0, isOop: false, penaltyTakerPercentage: 0.0, freeKickSpecialistPercentage: 0.0, cornerSpecialistPercentage: 0.0, isSetPieceSpecialist: false },
    { name: "Mike Maignan", team: "Milan", role: "P", initialQuote: 16, currentQuote: 16, expectedBaseRating: 6.1, oopIndex: 0.0, isOop: false, penaltyTakerPercentage: 0.0, freeKickSpecialistPercentage: 0.0, cornerSpecialistPercentage: 0.0, isSetPieceSpecialist: false },
    { name: "Federico Dimarco", team: "Inter", role: "D", initialQuote: 20, currentQuote: 20, expectedBaseRating: 6.5, oopIndex: 0.7, isOop: true, penaltyTakerPercentage: 0.1, freeKickSpecialistPercentage: 0.6, cornerSpecialistPercentage: 0.7, isSetPieceSpecialist: true },
    { name: "Theo Hernandez", team: "Milan", role: "D", initialQuote: 19, currentQuote: 19, expectedBaseRating: 6.4, oopIndex: 0.8, isOop: true, penaltyTakerPercentage: 0.3, freeKickSpecialistPercentage: 0.2, cornerSpecialistPercentage: 0.1, isSetPieceSpecialist: true },
    { name: "Teun Koopmeiners", team: "Juventus", role: "C", initialQuote: 24, currentQuote: 24, expectedBaseRating: 6.7, oopIndex: 0.0, isOop: false, penaltyTakerPercentage: 0.8, freeKickSpecialistPercentage: 0.4, cornerSpecialistPercentage: 0.3, isSetPieceSpecialist: true },
    { name: "Hakan Calhanoglu", team: "Inter", role: "C", initialQuote: 22, currentQuote: 22, expectedBaseRating: 6.6, oopIndex: 0.0, isOop: false, penaltyTakerPercentage: 0.9, freeKickSpecialistPercentage: 0.5, cornerSpecialistPercentage: 0.4, isSetPieceSpecialist: true },
    { name: "Lautaro Martinez", team: "Inter", role: "A", initialQuote: 38, currentQuote: 38, expectedBaseRating: 6.8, oopIndex: 0.0, isOop: false, penaltyTakerPercentage: 0.8, freeKickSpecialistPercentage: 0.0, cornerSpecialistPercentage: 0.0, isSetPieceSpecialist: false },
    { name: "Dusan Vlahovic", team: "Juventus", role: "A", initialQuote: 35, currentQuote: 35, expectedBaseRating: 6.5, oopIndex: 0.0, isOop: false, penaltyTakerPercentage: 0.8, freeKickSpecialistPercentage: 0.2, cornerSpecialistPercentage: 0.0, isSetPieceSpecialist: false },
  ];

  let updatedCount = 0;
  for (const p of fallbackPlayers) {
    let ev = p.expectedBaseRating + (p.penaltyTakerPercentage * 3.0) + (p.freeKickSpecialistPercentage * 3.0) + (p.cornerSpecialistPercentage * 1.0);
    if (p.isOop) ev += (p.oopIndex * 1.5);
    ev = Math.round(ev * 100) / 100;

    await prisma.player.upsert({
      where: { id: -1 }, // fallback update logic, in reality we find by name. But we don't have unique constraint on name.
      update: {},
      create: {
        name: p.name,
        team: p.team,
        role: p.role,
        initialQuote: p.initialQuote,
        currentQuote: p.currentQuote,
        expectedBaseRating: p.expectedBaseRating,
        oopIndex: p.oopIndex,
        isOop: p.isOop,
        penaltyTakerPercentage: p.penaltyTakerPercentage,
        freeKickSpecialistPercentage: p.freeKickSpecialistPercentage,
        cornerSpecialistPercentage: p.cornerSpecialistPercentage,
        isSetPieceSpecialist: p.isSetPieceSpecialist,
        expectedValue: ev
      }
    }).catch(async () => {
      // Manual upsert if unique constraint on name is missing
      const existing = await prisma.player.findFirst({ where: { name: p.name } });
      if (existing) {
        await prisma.player.update({
          where: { id: existing.id },
          data: { ...p, expectedValue: ev }
        });
      } else {
        await prisma.player.create({
          data: { ...p, expectedValue: ev }
        });
      }
    });
    updatedCount++;
  }

  return NextResponse.json({
    status: 'success',
    players_loaded: updatedCount,
    source: 'fallback'
  });
}
