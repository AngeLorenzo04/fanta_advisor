const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const players = await prisma.player.findMany();
  const purchases = await prisma.purchase.findMany();
  
  const purchasePlayerIds = new Set(purchases.map(p => p.playerId));
  
  const nameMap = new Map();
  for (const p of players) {
    const key = p.name.toLowerCase().trim();
    if (!nameMap.has(key)) {
      nameMap.set(key, []);
    }
    nameMap.get(key).push(p);
  }
  
  let deletedCount = 0;
  for (const [key, playerList] of nameMap.entries()) {
    if (playerList.length > 1) {
      // Find one to keep
      let keepId = playerList[0].id;
      for (const p of playerList) {
        if (purchasePlayerIds.has(p.id)) {
          keepId = p.id;
          break;
        }
      }
      
      const toDelete = playerList.filter(p => p.id !== keepId);
      
      // If any of the toDelete are in purchases (shouldn't happen if they bought duplicate? If they bought multiple duplicates, we might have to remap)
      // Actually, just remap ALL purchases of this player name to keepId
      for (const delP of toDelete) {
        if (purchasePlayerIds.has(delP.id)) {
            // Check if user already bought keepId? Let's just update the purchase
            await prisma.purchase.updateMany({
                where: { playerId: delP.id },
                data: { playerId: keepId }
            });
        }
        await prisma.player.delete({ where: { id: delP.id } });
        deletedCount++;
      }
    }
  }
  
  console.log(`Deleted ${deletedCount} duplicate players.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
