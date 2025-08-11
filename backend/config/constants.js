require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  
  // Google Service Account
  GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID,
  
  // Google Sheets & Drive
  GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID,
  GDRIVE_FOLDER_ID: process.env.GDRIVE_FOLDER_ID || '1wyP7hNLzeJVAm2TeX6hEkblW0wK0cfcK',
  
  // Cloudinary Configuration
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  
  // File Upload
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 10485760, // 10MB
  ALLOWED_FILE_TYPES: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/jpg,image/png,image/gif').split(','),
  
  // Auth
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'password123',
  
  // Sheets Configuration
  SHEETS_RANGES: {
    SUBJECTS: 'Subjects!A:G',
    STUDENTS: 'Students!A:F',
    ASSIGNMENTS: 'Assignments!A:H',
    SUBMISSIONS: 'Submissions!A:I',
    DOCUMENTS: 'Documents!A:G'
  }
};