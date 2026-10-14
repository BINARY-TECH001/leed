import { prisma } from '../src/utils/prisma.js';

async function main() {
  console.log('🌱 Seeding ProspectAI database...');
  console.log('✅ Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
