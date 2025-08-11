const { google } = require('googleapis');
const {
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_PRIVATE_KEY,
  GDRIVE_FOLDER_ID
} = require('./config/constants');

async function checkPermissions() {
  console.log('🔍 Checking Google Drive permissions...');
  console.log('Folder ID:', GDRIVE_FOLDER_ID);
  console.log('Service Account Email:', GOOGLE_SERVICE_ACCOUNT_EMAIL);
  
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    
    const drive = google.drive({ version: 'v3', auth });

    // Test 1: Check if we can access the folder
    console.log('\n📁 Test 1: Checking folder access...');
    try {
      const folderInfo = await drive.files.get({
        fileId: GDRIVE_FOLDER_ID,
        fields: 'id,name,permissions,capabilities'
      });
      console.log('✅ Folder found:', folderInfo.data);
    } catch (folderError) {
      console.log('❌ Cannot access folder:', folderError.message);
      return;
    }

    // Test 2: List permissions on the folder
    console.log('\n🔐 Test 2: Checking folder permissions...');
    try {
      const permissions = await drive.permissions.list({
        fileId: GDRIVE_FOLDER_ID,
        fields: 'permissions(id,type,role,emailAddress)'
      });
      console.log('✅ Folder permissions:', permissions.data.permissions);
      
      const serviceAccountPermission = permissions.data.permissions.find(p => 
        p.emailAddress === GOOGLE_SERVICE_ACCOUNT_EMAIL
      );
      if (serviceAccountPermission) {
        console.log('✅ Service Account has permission:', serviceAccountPermission);
      } else {
        console.log('❌ Service Account NOT found in permissions!');
      }
    } catch (permError) {
      console.log('❌ Cannot check permissions:', permError.message);
    }

    // Test 3: Try different upload method (simple upload)
    console.log('\n📄 Test 3: Trying simple upload method...');
    try {
      const testContent = 'Test file content - ' + new Date().toISOString();
      const response = await drive.files.create({
        requestBody: {
          name: `simple_test_${Date.now()}.txt`,
          parents: [GDRIVE_FOLDER_ID]
        },
        media: {
          mimeType: 'text/plain',
          body: testContent
        }
      });
      console.log('✅ Simple upload successful:', response.data);
    } catch (uploadError) {
      console.log('❌ Simple upload failed:', uploadError.message);
    }

    // Test 4: Try uploading without specifying parents
    console.log('\n📄 Test 4: Trying upload without parents (to My Drive)...');
    try {
      const testContent = 'Test file without parent - ' + new Date().toISOString();
      const response = await drive.files.create({
        requestBody: {
          name: `no_parent_test_${Date.now()}.txt`
        },
        media: {
          mimeType: 'text/plain',
          body: testContent
        }
      });
      console.log('✅ Upload to My Drive successful:', response.data);
    } catch (uploadError) {
      console.log('❌ Upload to My Drive failed:', uploadError.message);
    }

  } catch (error) {
    console.error('❌ Overall test failed:', error.message);
  }
}

checkPermissions();