import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const CREATOR_ID = 'test_creator_123';

/** DRM and exports test suite entry */
async function runTests() {
  console.log('🚀 Starting OnlyFans DRM and Data Exports API Integration Tests...');

  try {
    // 1. Get Initial DRM Status
    console.log('\n--- 1. Get DRM Status [GET] ---');
    const settingsGet = await axios.get(`${BASE_URL}/api/settings/onlyfans?creatorId=${CREATOR_ID}`);
    console.log('GET Status:', settingsGet.status);
    console.log('Initial DRM Enabled:', settingsGet.data.drmEnabled);

    // 2. Toggle DRM to Disabled
    console.log('\n--- 2. Disable DRM Status [PATCH] ---');
    const disableDrm = await axios.patch(`${BASE_URL}/api/settings/onlyfans`, {
      creatorId: CREATOR_ID,
      type: 'drm',
      drmEnabled: false
    });
    console.log('PATCH Status:', disableDrm.status);
    console.log('Updated DRM Enabled:', disableDrm.data.data.drmEnabled);

    // 3. Toggle DRM to Enabled
    console.log('\n--- 3. Enable DRM Status [PATCH] ---');
    const enableDrm = await axios.patch(`${BASE_URL}/api/settings/onlyfans`, {
      creatorId: CREATOR_ID,
      type: 'drm',
      drmEnabled: true
    });
    console.log('PATCH Status:', enableDrm.status);
    console.log('Updated DRM Enabled:', enableDrm.data.data.drmEnabled);

    // 4. List Exports
    console.log('\n--- 4. List Data Exports [GET] ---');
    const listGet = await axios.get(`${BASE_URL}/api/settings/exports?creatorId=${CREATOR_ID}`);
    console.log('GET Status:', listGet.status);
    console.log('Current Exports Count:', listGet.data.length);

    // 5. Create Data Export
    console.log('\n--- 5. Create Data Export [POST] ---');
    const createPost = await axios.post(`${BASE_URL}/api/settings/exports`, {
      creatorId: CREATOR_ID,
      action: 'create',
      type: 'media'
    });
    console.log('POST Status:', createPost.status);
    const newExportId = createPost.data.data.id;
    console.log('New Export ID Created:', newExportId);
    console.log('New Export Type:', createPost.data.data.type);
    console.log('New Export Status:', createPost.data.data.status);

    // 6. Start Data Export
    console.log('\n--- 6. Start Data Export [POST] ---');
    const startPost = await axios.post(`${BASE_URL}/api/settings/exports`, {
      creatorId: CREATOR_ID,
      action: 'start',
      exportId: newExportId
    });
    console.log('POST Status:', startPost.status);
    console.log('Processing Status:', startPost.data.data.status);

    // 7. Get Data Export Status
    console.log('\n--- 7. Get Data Export Status [GET] ---');
    const statusGet = await axios.get(`${BASE_URL}/api/settings/exports?creatorId=${CREATOR_ID}&action=status&exportId=${newExportId}`);
    console.log('GET Status:', statusGet.status);
    console.log('Export record state:', statusGet.data.status);

    // 8. Cancel/Delete Data Export
    console.log('\n--- 8. Cancel Data Export [DELETE] ---');
    const deleteRes = await axios.delete(`${BASE_URL}/api/settings/exports?creatorId=${CREATOR_ID}&exportId=${newExportId}`);
    console.log('DELETE Status:', deleteRes.status);
    const remainingList = deleteRes.data.data;
    console.log('Export ID present in remaining lists:', remainingList.some((e: any) => e.id === newExportId));

    console.log('\n✅ All DRM and Data Exports API Tests Completed Successfully!');
  } catch (error: any) {
    console.error('\n❌ Test failed with error:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTests();
