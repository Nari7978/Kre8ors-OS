import 'dotenv/config';
import { GET, POST, PUT, DELETE } from '../src/app/api/fans/lists/route';
import { db } from '../src/lib/db';

/** User lists test suite entry */
async function runTests() {
  console.log('--- RUNNING USER LIST COLLECTIONS API TESTS ---');
  try {
    const creator = await db.creator.findFirst();
    if (!creator) {
      console.error('No creators found in the database. Please seed the database first.');
      process.exit(1);
    }

    const fan = await db.fan.findFirst({
      where: { creatorId: creator.id }
    });

    if (!fan) {
      console.error('No fans found for this creator. Please seed the database first.');
      process.exit(1);
    }

    console.log(`Using Creator: ${creator.displayName} (@${creator.username})`);
    console.log(`Using Fan for membership tests: ${fan.displayName} (@${fan.username})`);

    // 1. Test GET all collections lists
    console.log('\nTest 1: Fetching all collection lists...');
    const req1 = new Request(`http://localhost/api/fans/lists?creatorId=${creator.id}`);
    const res1 = await GET(req1);
    const lists1 = await res1.json();
    if (res1.status === 200 && Array.isArray(lists1)) {
      console.log(`✓ GET collections successful. Found ${lists1.length} lists.`);
    } else {
      throw new Error(`Test 1 failed: status=${res1.status}, data=${JSON.stringify(lists1)}`);
    }

    // 2. Test POST create new user list
    console.log('\nTest 2: Creating a new collection list...');
    const testListName = `Test Group ${Date.now()}`;
    const req2 = new Request('http://localhost/api/fans/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorId: creator.id,
        name: testListName
      })
    });
    const res2 = await POST(req2);
    const newList = await res2.json();
    if (res2.status === 201 && newList.id && newList.name === testListName) {
      console.log(`✓ POST create list successful. Created ID: ${newList.id}`);
    } else {
      throw new Error(`Test 2 failed: status=${res2.status}, data=${JSON.stringify(newList)}`);
    }

    const testListId = newList.id;

    // 3. Test PUT rename user list
    console.log('\nTest 3: Renaming the collection list...');
    const renamedListName = `${testListName} - Updated`;
    const req3 = new Request('http://localhost/api/fans/lists', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorId: creator.id,
        listId: testListId,
        name: renamedListName
      })
    });
    const res3 = await PUT(req3);
    const updatedList = await res3.json();
    if (res3.status === 200 && updatedList.success && updatedList.name === renamedListName) {
      console.log('✓ PUT rename list successful.');
    } else {
      throw new Error(`Test 3 failed: status=${res3.status}, data=${JSON.stringify(updatedList)}`);
    }

    // 4. Test POST add subscriber to list
    console.log('\nTest 4: Adding member to the list...');
    const req4 = new Request('http://localhost/api/fans/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorId: creator.id,
        listId: testListId,
        action: 'add-users',
        userIds: [fan.id]
      })
    });
    const res4 = await POST(req4);
    const addRes = await res4.json();
    if (res4.status === 200 && addRes.success && addRes.count === 1) {
      console.log('✓ POST add user to list successful.');
    } else {
      throw new Error(`Test 4 failed: status=${res4.status}, data=${JSON.stringify(addRes)}`);
    }

    // 5. Test GET members of list
    console.log('\nTest 5: Retrieving list members...');
    const req5 = new Request(`http://localhost/api/fans/lists?creatorId=${creator.id}&listId=${testListId}&users=true`);
    const res5 = await GET(req5);
    const members = await res5.json();
    if (res5.status === 200 && Array.isArray(members) && members.some(m => m.id === fan.id)) {
      console.log(`✓ GET list users successful. Found ${members.length} members.`);
    } else {
      throw new Error(`Test 5 failed: status=${res5.status}, data=${JSON.stringify(members)}`);
    }

    // 6. Test DELETE remove user from list
    console.log('\nTest 6: Removing user from list...');
    const req6 = new Request(`http://localhost/api/fans/lists?creatorId=${creator.id}&listId=${testListId}&action=remove-user&userId=${fan.id}`, {
      method: 'DELETE'
    });
    const res6 = await DELETE(req6);
    const removeRes = await res6.json();
    if (res6.status === 200 && removeRes.success) {
      console.log('✓ DELETE remove user from list successful.');
    } else {
      throw new Error(`Test 6 failed: status=${res6.status}, data=${JSON.stringify(removeRes)}`);
    }

    // 7. Verify member was removed
    console.log('Verifying user was removed...');
    const req7 = new Request(`http://localhost/api/fans/lists?creatorId=${creator.id}&listId=${testListId}&users=true`);
    const res7 = await GET(req7);
    const membersAfterRemove = await res7.json();
    if (res7.status === 200 && !membersAfterRemove.some((m: any) => m.id === fan.id)) {
      console.log('✓ Verified: User is no longer in the list.');
    } else {
      throw new Error(`Verification after remove failed: status=${res7.status}, data=${JSON.stringify(membersAfterRemove)}`);
    }

    // 8. Re-add member to test clear list
    console.log('Re-adding member to test clear list...');
    await POST(new Request('http://localhost/api/fans/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorId: creator.id,
        listId: testListId,
        action: 'add-users',
        userIds: [fan.id]
      })
    }));

    // 9. Test DELETE clear list
    console.log('\nTest 7: Clearing list...');
    const req8 = new Request(`http://localhost/api/fans/lists?creatorId=${creator.id}&listId=${testListId}&action=clear`, {
      method: 'DELETE'
    });
    const res8 = await DELETE(req8);
    const clearRes = await res8.json();
    if (res8.status === 200 && clearRes.success) {
      console.log('✓ DELETE clear list successful.');
    } else {
      throw new Error(`Test 7 failed: status=${res8.status}, data=${JSON.stringify(clearRes)}`);
    }

    // 10. Test DELETE delete list
    console.log('\nTest 8: Deleting the list itself...');
    const req9 = new Request(`http://localhost/api/fans/lists?creatorId=${creator.id}&listId=${testListId}`, {
      method: 'DELETE'
    });
    const res9 = await DELETE(req9);
    const deleteRes = await res9.json();
    if (res9.status === 200 && deleteRes.success) {
      console.log('✓ DELETE delete list successful.');
    } else {
      throw new Error(`Test 8 failed: status=${res9.status}, data=${JSON.stringify(deleteRes)}`);
    }

    console.log('\n--- ALL USER LIST COLLECTIONS API TESTS COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('\n✗ Test encountered failure:', err);
    process.exit(1);
  }
}

runTests().then(() => process.exit(0));
