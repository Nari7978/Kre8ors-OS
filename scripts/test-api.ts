import { PATCH } from '../src/app/api/fans/route';
import { db } from '../src/lib/db';

async function runTests() {
  console.log('--- RUNNING API CONTROLLER TESTS ---');
  try {
    const creator = await db.creator.findFirst();
    if (!creator) {
      console.error('No creators found in the database. Please seed the database first.');
      process.exit(1);
    }

    const testOfId = `test-fan-${Date.now()}`;
    const fan = await db.fan.create({
      data: {
        ofId: testOfId,
        creatorId: creator.id,
        username: 'testuser',
        displayName: 'Test User',
        subscribedAt: new Date(),
      }
    });

    console.log(`Created test fan ID: ${fan.id}`);

    // Mock Next.js Request
    const mockRequest = new Request('http://localhost/api/fans', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fanId: fan.id,
        displayName: 'Updated Test User',
        customTags: ['vip', 'test'],
        notes: 'Updated notes'
      })
    });

    const response = await PATCH(mockRequest);
    const result = await response.json();

    if (response.status === 200 && result.displayName === 'Updated Test User') {
      console.log('✓ Test passed: Fan profile fields successfully updated');
    } else {
      console.error('✗ Test failed: Response mismatch', result);
    }

    // Clean up
    await db.fan.delete({ where: { id: fan.id } });
    console.log('Cleaned up test fan');
  } catch (error) {
    console.error('✗ Test encountered error:', error);
  }
}

runTests();
