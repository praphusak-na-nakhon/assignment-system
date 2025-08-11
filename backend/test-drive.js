const driveService = require('./services/driveService');

async function testGoogleDrive() {
  console.log('🔍 Testing Google Drive connection...');
  
  try {
    // Test 1: Create a test folder
    console.log('\n📁 Test 1: Creating test folder...');
    const testFolder = await driveService.createFolder('TEST_FOLDER_' + Date.now());
    console.log('✅ Test folder created:', testFolder);
    
    // Test 2: Upload a test file to the shared folder (1wyP7hNLzeJVAm2TeX6hEkblW0wK0cfcK)
    console.log('\n📄 Test 2: Uploading test file to shared folder...');
    const { GDRIVE_FOLDER_ID } = require('./config/constants');
    console.log('Using folder ID:', GDRIVE_FOLDER_ID);
    
    const testContent = Buffer.from('This is a test file from Node.js app - ' + new Date().toISOString());
    const uploadResult = await driveService.uploadFile(
      testContent,
      `test_file_${Date.now()}.txt`,
      'text/plain',
      GDRIVE_FOLDER_ID  // Explicitly specify the shared folder
    );
    console.log('✅ Test file uploaded:', uploadResult);
    
    // Test 3: Upload another file to the created folder
    console.log('\n📄 Test 3: Uploading file to test folder...');
    const testContent2 = Buffer.from('This is another test file in subfolder - ' + new Date().toISOString());
    const uploadResult2 = await driveService.uploadFile(
      testContent2,
      `subfolder_test_${Date.now()}.txt`,
      'text/plain',
      testFolder.id
    );
    console.log('✅ File uploaded to test folder:', uploadResult2);
    
    console.log('\n🎉 All tests passed! Google Drive is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testGoogleDrive();