import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function runWorker() {
  console.log('Standalone publishing queue worker initialized...');
  try {
    const now = new Date();
    const pendingPosts = await db.post.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledFor: {
          lte: now,
        },
      },
    });

    console.log(`Found ${pendingPosts.length} posts due for publication.`);

    for (const post of pendingPosts) {
      console.log(`Publishing post ID: ${post.id} (Scheduled for: ${post.scheduledFor})`);
      const updated = await db.post.update({
        where: { id: post.id },
        data: {
          status: 'PUBLISHED',
          ofPostId: `post_of_${Math.floor(100000 + Math.random() * 900000)}`,
          scheduledFor: null,
        },
      });
      console.log(`Successfully published post ID: ${updated.id} with mock OnlyFans ID: ${updated.ofPostId}`);
    }
  } catch (err) {
    console.error('Error occurred in queue worker process:', err);
    throw err;
  }
}

runWorker()
  .catch((err) => {
    console.error('Queue worker process failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
