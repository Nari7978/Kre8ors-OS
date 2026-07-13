import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const CREATOR_ID = 'test_creator_123'; // Matches standard database seeding creator ID or fallback

async function runTests() {
  console.log('🚀 Starting OnlyFans Settings and Notifications API Integration Tests...');

  try {
    // 1. Get Settings
    console.log('\n--- 1. Get Settings [GET] ---');
    const settingsGet = await axios.get(`${BASE_URL}/api/settings/onlyfans?creatorId=${CREATOR_ID}`);
    console.log('GET Status:', settingsGet.status);
    console.log('DRM Status:', settingsGet.data.drmEnabled);
    console.log('Price:', settingsGet.data.subscriptionPrice);
    console.log('Profile display name:', settingsGet.data.profile?.displayName);

    // 2. Update Profile
    console.log('\n--- 2. Update Profile Details [POST] ---');
    const profilePost = await axios.post(`${BASE_URL}/api/settings/onlyfans`, {
      creatorId: CREATOR_ID,
      type: 'profile',
      profile: {
        displayName: 'Sophia Sweet (Official)',
        about: 'Premium account managed by agency.',
        website: 'https://onlyfans.com/sophiasweet',
        location: 'Paris, France'
      }
    });
    console.log('POST Status:', profilePost.status);
    console.log('Updated Profile Display Name:', profilePost.data.data.profile?.displayName);

    // 3. Check Username Availability
    console.log('\n--- 3. Check Username Availability [POST] ---');
    const usernameCheck1 = await axios.post(`${BASE_URL}/api/settings/onlyfans`, {
      creatorId: CREATOR_ID,
      type: 'check-username',
      username: 'sophiasweet_new'
    });
    console.log('Checking @sophiasweet_new Availability:', usernameCheck1.data.available);

    const usernameCheck2 = await axios.post(`${BASE_URL}/api/settings/onlyfans`, {
      creatorId: CREATOR_ID,
      type: 'check-username',
      username: 'taken_user'
    });
    console.log('Checking @taken_user Availability:', usernameCheck2.data.available);

    // 4. Update Subscription Price
    console.log('\n--- 4. Update Subscription Price [PATCH] ---');
    const pricePatch = await axios.patch(`${BASE_URL}/api/settings/onlyfans`, {
      creatorId: CREATOR_ID,
      type: 'subscription-price',
      price: 14.99
    });
    console.log('PATCH Status:', pricePatch.status);
    console.log('Updated Subscription Price:', pricePatch.data.data.subscriptionPrice);

    // 5. Get Notification Counts
    console.log('\n--- 5. Get Notification Counts [GET] ---');
    const countsGet = await axios.get(`${BASE_URL}/api/fans/notifications?action=counts&creatorId=${CREATOR_ID}`);
    console.log('GET Status:', countsGet.status);
    console.log('Counts:', countsGet.data.data);

    // 6. Get Notification Tabs Order
    console.log('\n--- 6. Get Notification Tabs Order [GET] ---');
    const tabsGet = await axios.get(`${BASE_URL}/api/fans/notifications?action=tabs&creatorId=${CREATOR_ID}`);
    console.log('Tabs Order:', tabsGet.data.data);

    // 7. List Notifications
    console.log('\n--- 7. List Notifications [GET] ---');
    const listGet = await axios.get(`${BASE_URL}/api/fans/notifications?creatorId=${CREATOR_ID}`);
    console.log('Total notifications fetched:', listGet.data.length);
    console.log('First notification msg:', listGet.data[0]?.message);

    // 8. Mark All Notifications As Read
    console.log('\n--- 8. Mark All Notifications As Read [POST] ---');
    const markPost = await axios.post(`${BASE_URL}/api/fans/notifications`, {
      creatorId: CREATOR_ID,
      action: 'mark-all'
    });
    console.log('POST Status:', markPost.status);
    const unreadAfterMark = markPost.data.data.filter((n: any) => !n.isRead).length;
    console.log('Unread notifications remaining:', unreadAfterMark);

    // 9. Blocked/Restricted Users Ledger
    console.log('\n--- 9. Blocked & Restricted Ledger ---');
    const blockList = await axios.get(`${BASE_URL}/api/fans/blocked?creatorId=${CREATOR_ID}`);
    console.log('Total blocked users:', blockList.data.length);

    console.log('\n✅ All Settings and Notifications API Tests Completed Successfully!');
  } catch (error: any) {
    console.error('\n❌ Test failed with error:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTests();
