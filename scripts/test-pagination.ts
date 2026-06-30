import 'dotenv/config';
import { GET } from '../src/app/api/messages/route';
import { db } from '../src/lib/db';

// Generate mock historical messages (15 records) spaced 1 minute apart
const mockMessages = Array.from({ length: 15 }, (_, i) => ({
  id: `msg_${i + 1}`,
  ofMessageId: `msg_of_${i + 1}`,
  creatorId: 'creator_1',
  fanId: 'fan_1',
  direction: i % 2 === 0 ? 'out' : 'in',
  text: `Mock message ${i + 1}`,
  mediaUrls: '[]',
  isTip: false,
  tipAmount: 0,
  isPurchased: true,
  sentAt: new Date(Date.now() - (15 - i) * 60 * 1000), // Chronological order
}));

// Mock db.creator.findFirst and db.fan.findFirst at runtime
(db.creator as any).findFirst = async () => ({ id: 'creator_1', username: 'sophiasweet', displayName: 'Sophia Sweet' }) as any;
(db.fan as any).findFirst = async () => ({ id: 'fan_1', username: 'johnny', displayName: 'Johnny' }) as any;

// Mock db.message.findMany to mimic filtering and descending ordering queries
(db.message as any).findMany = async (args: any) => {
  const { where, take } = args;
  let filtered = [...mockMessages];
  
  if (where && where.sentAt && where.sentAt.lt) {
    const limitDate = new Date(where.sentAt.lt);
    filtered = filtered.filter(m => m.sentAt.getTime() < limitDate.getTime());
  }
  
  // Sort descending (latest first) to replicate SQL desc behavior
  filtered.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  
  // Limit slice
  if (take) {
    filtered = filtered.slice(0, take);
  }
  
  return filtered as any;
};

async function runTests() {
  console.log('--- RUNNING PAGINATION CONTROLLER TESTS ---');
  try {
    const creator = await db.creator.findFirst();
    const fan = await db.fan.findFirst({
      where: { creatorId: creator?.id }
    });

    if (!creator || !fan) {
      console.error('Creator or Fan mock initialization failed.');
      process.exit(1);
    }

    // 1. Test fetching first batch (limit 5)
    console.log('Test 1: Fetching initial batch of 5 messages...');
    const req1 = new Request(`http://localhost/api/messages?creatorId=${creator.id}&fanId=${fan.id}&limit=5`);
    const res1 = await GET(req1);
    const data1 = await res1.json();

    if (res1.status !== 200) {
      throw new Error(`First fetch failed with status ${res1.status}`);
    }

    console.log(`✓ Retrieved ${data1.messages.length} messages (expected: 5)`);
    console.log(`✓ hasMore = ${data1.hasMore} (expected: true)`);
    console.log(`✓ nextCursor = ${data1.nextCursor}`);

    if (data1.messages.length === 5 && data1.hasMore === true && data1.nextCursor) {
      console.log('✓ Test 1 Passed!');
    } else {
      throw new Error(`Test 1 assertion failed. Length: ${data1.messages.length}, hasMore: ${data1.hasMore}`);
    }

    // 2. Test fetching second batch using cursor
    console.log(`Test 2: Fetching next batch with cursor ${data1.nextCursor}...`);
    const req2 = new Request(
      `http://localhost/api/messages?creatorId=${creator.id}&fanId=${fan.id}&limit=5&cursor=${data1.nextCursor}`
    );
    const res2 = await GET(req2);
    const data2 = await res2.json();

    if (res2.status !== 200) {
      throw new Error(`Second fetch failed with status ${res2.status}`);
    }

    console.log(`✓ Retrieved ${data2.messages.length} messages in second batch (expected: 5)`);
    console.log(`✓ hasMore = ${data2.hasMore} (expected: true)`);
    console.log(`✓ nextCursor = ${data2.nextCursor}`);

    if (data2.messages.length === 5 && data2.hasMore === true) {
      console.log('✓ Test 2 Passed!');
    } else {
      throw new Error(`Test 2 assertion failed. Length: ${data2.messages.length}, hasMore: ${data2.hasMore}`);
    }

    console.log('--- ALL PAGINATION TESTS COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('✗ Test encountered error:', error);
    process.exit(1);
  }
}

runTests();
