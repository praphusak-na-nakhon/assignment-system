const { google } = require('googleapis');
const {
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_PRIVATE_KEY,
  GDRIVE_FOLDER_ID
} = require('../config/constants');

class DriveService {
  constructor() {
    this.auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  async createFolder(name, parentId = GDRIVE_FOLDER_ID) {
    try {
      const response = await this.drive.files.create({
        requestBody: {
          name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId],
        },
        supportsAllDrives: true, // Enable Shared Drive support
      });
      
      // Make folder public
      await this.drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
        supportsAllDrives: true, // Enable Shared Drive support
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  async uploadFile(fileBuffer, fileName, mimeType, folderId = GDRIVE_FOLDER_ID) {
    try {
      const { Readable } = require('stream');
      const stream = Readable.from(fileBuffer);
      
      const response = await this.drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
        },
        media: {
          mimeType,
          body: stream,
        },
        supportsAllDrives: true, // Enable Shared Drive support
      });
      
      // Make file public
      await this.drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
        supportsAllDrives: true, // Enable Shared Drive support
      });
      
      return {
        id: response.data.id,
        url: `https://drive.google.com/file/d/${response.data.id}/view`,
        directUrl: `https://drive.google.com/uc?id=${response.data.id}`
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async deleteFile(fileId) {
    try {
      return await this.drive.files.delete({
        fileId,
        supportsAllDrives: true, // Enable Shared Drive support
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async getOrCreateStudentFolder(studentId, subjectName) {
    try {
      // Search for existing folder
      const folderName = `${studentId}_${subjectName}`;
      const response = await this.drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and parents in '${GDRIVE_FOLDER_ID}'`,
        fields: 'files(id, name)',
        supportsAllDrives: true, // Enable Shared Drive support
        includeItemsFromAllDrives: true, // Include items from all drives
      });

      if (response.data.files.length > 0) {
        return response.data.files[0];
      }

      // Create new folder if not exists
      return await this.createFolder(folderName, GDRIVE_FOLDER_ID);
    } catch (error) {
      console.error('Error getting/creating student folder:', error);
      throw error;
    }
  }
}

module.exports = new DriveService();