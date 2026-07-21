const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function cleanPlayerName(raw) {
  if (!raw) return "";
  let cleaned = raw.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
  const words = cleaned.split(' ');
  
  if (words.length >= 2 && words.every(w => w.toLowerCase() === words[0].toLowerCase())) {
    return words[0];
  }
  if (words.length >= 3 && words.length % 3 === 0) {
    const unitSize = words.length / 3;
    const unit1 = words.slice(0, unitSize).join(' ');
    const unit2 = words.slice(unitSize, unitSize * 2).join(' ');
    const unit3 = words.slice(unitSize * 2).join(' ');
    if (unit1.toLowerCase() === unit2.toLowerCase() && unit2.toLowerCase() === unit3.toLowerCase()) {
      return unit1;
    }
  }
  if (words.length >= 2 && words.length % 2 === 0) {
    const unitSize = words.length / 2;
    const unit1 = words.slice(0, unitSize).join(' ');
    const unit2 = words.slice(unitSize).join(' ');
    if (unit1.toLowerCase() === unit2.toLowerCase()) {
      return unit1;
    }
  }
  return cleaned;
}

async function fixNames() {
  const players = await prisma.player.findMany();
  let updatedCount = 0;

  for (const p of players) {
    const cleaned = cleanPlayerName(p.name);
    if (cleaned !== p.name) {
      await prisma.player.update({
        where: { id: p.id },
        data: { name: cleaned }
      });
      console.log(`Cleaned: "${p.name}" -> "${cleaned}"`);
      updatedCount++;
    }
  }

  console.log(`Successfully fixed ${updatedCount} player names in Database!`);
}

fixNames().catch(console.error).finally(() => prisma.$disconnect());
