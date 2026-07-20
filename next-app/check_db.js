const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const lautaro = await prisma.player.findMany({ where: { name: { contains: 'Lautaro' } } });
  console.log(lautaro);
}
main().catch(console.error).finally(() => prisma.$disconnect());
