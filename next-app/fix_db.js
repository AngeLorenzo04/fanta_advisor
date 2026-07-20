const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const players = await prisma.player.findMany();
  
  const nameMap = new Map();
  for (const p of players) {
    const key = p.name.toLowerCase().trim();
    if (!nameMap.has(key)) nameMap.set(key, []);
    nameMap.get(key).push(p);
  }
  
  let deletedPlayers = 0;
  let deletedPurchases = 0;
  let remappedPurchases = 0;

  for (const [key, playerList] of nameMap.entries()) {
    if (playerList.length > 1) {
      const keepId = playerList[0].id;
      const toDelete = playerList.slice(1);
      
      for (const delP of toDelete) {
        const purchases = await prisma.purchase.findMany({ where: { playerId: delP.id } });
        
        for (const purch of purchases) {
          const existing = await prisma.purchase.findFirst({ 
             where: { participantId: purch.participantId, playerId: keepId } 
          });
          
          if (existing) {
            // Delete duplicate purchase and refund
            await prisma.purchase.delete({ where: { id: purch.id } });
            await prisma.auctionParticipant.update({
              where: { id: purch.participantId },
              data: { remainingBudget: { increment: purch.price } }
            });
            deletedPurchases++;
          } else {
            // Remap
            await prisma.purchase.update({
              where: { id: purch.id },
              data: { playerId: keepId }
            });
            remappedPurchases++;
          }
        }
        await prisma.player.delete({ where: { id: delP.id } });
        deletedPlayers++;
      }
    }
  }
  console.log(`Deleted ${deletedPlayers} duplicate players.`);
  console.log(`Deleted ${deletedPurchases} duplicate purchases.`);
  console.log(`Remapped ${remappedPurchases} purchases.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
