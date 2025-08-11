const { google } = require('googleapis');
const {
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_PRIVATE_KEY,
  GDRIVE_FOLDER_ID
} = require('./config/constants');

async function tryOAuthWorkaround() {
  console.log('🔍 Trying OAuth workaround for Service Account...');
  
  try {
    // Try using domain-wide delegation (if enabled)
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
      // Try to impersonate the owner's account
      subject: 'praphusak.nakhon@gmail.com'  // Owner email from permissions
    });
    
    const drive = google.drive({ version: 'v3', auth });
    
    console.log('📄 Testing upload with domain-wide delegation...');
    const testContent = Buffer.from('Test with OAuth delegation - ' + new Date().toISOString());
    
    const response = await drive.files.create({
      requestBody: {
        name: `oauth_test_${Date.now()}.txt`,
        parents: [GDRIVE_FOLDER_ID]
      },
      media: {
        mimeType: 'text/plain',
        body: testContent
      }
    });
    
    console.log('✅ OAuth delegation upload successful:', response.data);
    
  } catch (error) {
    console.log('❌ OAuth delegation failed:', error.message);
    
    if (error.message.includes('domain-wide delegation')) {
      console.log('\n💡 Solution: Enable domain-wide delegation in Google Cloud Console');
      console.log('1. Go to Google Cloud Console → IAM & Admin → Service Accounts');
      console.log('2. Click on your Service Account');  
      console.log('3. Check "Enable G Suite Domain-wide Delegation"');
      console.log('4. Add scopes: https://www.googleapis.com/auth/drive');
    } else {
      console.log('\n❌ This approach won\'t work either. Service Account limitations are too strict.');
    }
  }
}

// Alternative: Try copying existing file (might work)
async function tryCopyMethod() {
  console.log('\n🔄 Trying copy method as workaround...');
  
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    
    const drive = google.drive({ version: 'v3', auth });
    
    // Find an existing file to copy
    const files = await drive.files.list({
      q: `parents in '${GDRIVE_FOLDER_ID}'`,
      fields: 'files(id,name)'
    });
    
    if (files.data.files.length > 0) {
      const fileId = files.data.files[0].id;
      console.log('📂 Found existing file to copy:', files.data.files[0].name);
      
      const copyResponse = await drive.files.copy({
        fileId: fileId,
        requestBody: {
          name: `copy_test_${Date.now()}.txt`,
          parents: [GDRIVE_FOLDER_ID]
        }
      });
      
      console.log('✅ Copy method successful:', copyResponse.data);
    } else {
      console.log('📂 No existing files found to copy');
    }
    
  } catch (error) {
    console.log('❌ Copy method failed:', error.message);
  }
}

async function runAllTests() {
  await tryOAuthWorkaround();
  await tryCopyMethod();
}

runAllTests();