const cloudinary = require('cloudinary').v2;
const { 
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET 
} = require('../config/constants');

class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true
    });
  }

  // อัปโหลดไฟล์รูปภาพ
  async uploadImage(fileBuffer, fileName, folderPath = 'assignment-system') {
    try {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            public_id: fileName,
            folder: folderPath,
            format: 'jpg', // แปลงทุกไฟล์เป็น JPG เพื่อลดขนาด
            quality: 'auto:good', // ปรับคุณภาพอัตโนมัติ
            fetch_format: 'auto', // เลือกฟอร์แมตที่เหมาะสมอัตโนมัติ
            flags: 'progressive', // โหลดแบบ progressive
            transformation: [
              { width: 1200, crop: 'limit' }, // จำกัดความกว้างสูงสุด 1200px
              { quality: 'auto:good' }
            ]
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              resolve({
                id: result.public_id,
                url: result.secure_url,
                originalUrl: result.secure_url,
                thumbnailUrl: cloudinary.url(result.public_id, {
                  width: 300,
                  height: 200,
                  crop: 'fill',
                  quality: 'auto:low'
                }),
                bytes: result.bytes,
                format: result.format
              });
            }
          }
        ).end(fileBuffer);
      });
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  }

  // สร้างโฟลเดอร์ในรูปแบบ: assignment-system/subject/assignment
  generateFolderPath(subjectName, className, assignmentTitle) {
    const cleanSubject = this.sanitizeFileName(subjectName);
    const cleanClass = this.sanitizeFileName(className);
    const cleanAssignment = this.sanitizeFileName(assignmentTitle);
    
    return `assignment-system/${cleanClass}_${cleanSubject}/${cleanAssignment}`;
  }

  // สร้าง public_id ในรูปแบบ: studentId_name_assignment
  generatePublicId(studentId, studentName, assignmentTitle) {
    const cleanName = this.sanitizeFileName(studentName);
    const cleanAssignment = this.sanitizeFileName(assignmentTitle);
    const timestamp = Date.now();
    
    return `${studentId}_${cleanName}_${cleanAssignment}_${timestamp}`;
  }

  // ลบไฟล์
  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image'
      });
      
      return result;
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      throw error;
    }
  }

  // ลบทั้งโฟลเดอร์ (ลบทุกไฟล์ในโฟลเดอร์นั้น)
  async deleteFolder(folderPath) {
    try {
      // ดึงรายการไฟล์ทั้งหมดในโฟลเดอร์
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: folderPath,
        max_results: 500
      });

      // ลบไฟล์ทั้งหมด
      if (result.resources && result.resources.length > 0) {
        const publicIds = result.resources.map(resource => resource.public_id);
        await cloudinary.api.delete_resources(publicIds);
        console.log(`🗑️ ลบไฟล์ ${publicIds.length} ไฟล์จากโฟลเดอร์ ${folderPath}`);
      }

      // ลบโฟลเดอร์ (ถ้าเป็นโฟลเดอร์ว่าง)
      try {
        await cloudinary.api.delete_folder(folderPath);
        console.log(`📁 ลบโฟลเดอร์ ${folderPath}`);
      } catch (folderError) {
        // ไม่ต้องแสดง error ถ้าโฟลเดอร์ไม่สามารถลบได้
        console.log(`⚠️ ไม่สามารถลบโฟลเดอร์ ${folderPath} (อาจมีไฟล์อยู่)`);
      }

      return { deleted: result.resources?.length || 0 };
    } catch (error) {
      console.error('Error deleting folder from Cloudinary:', error);
      throw error;
    }
  }

  // ดึงรายการไฟล์ในโฟลเดอร์
  async getFilesInFolder(folderPath, maxResults = 100) {
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: folderPath,
        max_results: maxResults
      });

      return result.resources.map(resource => ({
        id: resource.public_id,
        url: resource.secure_url,
        bytes: resource.bytes,
        format: resource.format,
        createdAt: resource.created_at
      }));
    } catch (error) {
      console.error('Error getting files from Cloudinary:', error);
      return [];
    }
  }

  // ทำความสะอาดชื่อสำหรับใช้เป็น public_id
  sanitizeFileName(name) {
    return name
      .replace(/[^a-zA-Z0-9\u0E00-\u0E7F\s]/g, '') // เอาอักขระพิเศษออก แต่เก็บภาษาไทย
      .replace(/\s+/g, '-') // แปลงช่องว่างเป็น -
      .trim()
      .substring(0, 100); // จำกัดความยาว
  }

  // ตรวจสอบการเชื่อมต่อ Cloudinary
  async testConnection() {
    try {
      const result = await cloudinary.api.ping();
      console.log('✅ Cloudinary connection successful:', result);
      return true;
    } catch (error) {
      console.error('❌ Cloudinary connection failed:', error);
      return false;
    }
  }
}

module.exports = new CloudinaryService();