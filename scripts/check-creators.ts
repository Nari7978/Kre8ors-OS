import { db } from '../src/lib/db';

async function main() {
  const creators = await db.creator.findMany();
  console.log('Current creators in DB:');
  console.log(JSON.stringify(creators.map(c => ({
    id: c.id,
    username: c.username,
    displayName: c.displayName,
    status: c.status,
    createdAt: c.createdAt
  })), null, 2));
}

main().catch(console.error);
