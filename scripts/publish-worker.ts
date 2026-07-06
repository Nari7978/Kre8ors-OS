import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function runWorker() {
  console.log('Standalone publishing queue worker initialized...');
}

runWorker()
  .catch((err) => {
    console.error('Queue worker process failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
