const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const f = await prisma.matchFixture.findMany();
  console.log(f);
}
main().catch(console.error).finally(() => prisma.$disconnect());
