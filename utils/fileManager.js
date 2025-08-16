const cloudinaryService = require('../services/cloudinaryService');

class FileManager {
  constructor() {
    // ใช้ Cloudinary แทนการเก็บไฟล์ในเครื่อง
    this.cloudinary = cloudinaryService;
  }

  // สร้างโฟลเดอร์วิชาใหม่ - ไม่จำเป็นใน Cloudinary (สร้างอัตโนมัตินะตอนอัปโหลดไฟล์)
  async createSubjectFolder(subjectName, className) {
    try {
      const cleanSubjectName = this.sanitizeFileName(subjectName);
      const cleanClassName = this.sanitizeFileName(className);
      const folderName = `${cleanClassName}_${cleanSubjectName}`;
      
      console.log(`✅ เตรียมโฟลเดอร์วิชา: ${folderName} (Cloudinary จะสร้างอัตโนมัติ)`);
      return folderName;
    } catch (error) {
      console.error('Error creating subject folder:', error);
      throw error;
    }
  }

  // ลบโฟลเดอร์วิชาและไฟล์ทั้งหมดจาก Cloudinary
  async deleteSubjectFolder(subjectName, className) {
    try {
      const cleanSubjectName = this.sanitizeFileName(subjectName);
      const cleanClassName = this.sanitizeFileName(className);
      const folderName = `${cleanClassName}_${cleanSubjectName}`;
      
      // ลบทั้งโฟลเดอร์จาก Cloudinary
      const folderPath = `assignment-system/${folderName}`;
      await this.cloudinary.deleteFolder(folderPath);
      
      console.log(`🗑️ ลบโฟลเดอร์วิชาจาก Cloudinary: ${folderName}`);
      return folderName;
    } catch (error) {
      console.error('Error deleting subject folder:', error);
      throw error;
    }
  }

  // สร้าง public_id สำหรับ Cloudinary ในรูปแบบ: studentId_name_assignment
  generatePublicId(studentId, studentName, assignmentTitle) {
    try {
      // ใช้ CloudinaryService เพื่อสร้าง public_id
      return this.cloudinary.generatePublicId(studentId, studentName, assignmentTitle);
    } catch (error) {
      console.error('Error generating public ID:', error);
      // กรณีมีข้อผิดพลาด ใช้รูปแบบง่ายๆ
      const timestamp = Date.now();
      return `${studentId}_${timestamp}`;
    }
  }

  // เตรียมโฟลเดอร์งานใหม่ - Cloudinary จะสร้างอัตโนมัติ
  async createAssignmentFolder(subjectName, className, assignmentTitle) {
    try {
      const cleanSubjectName = this.sanitizeFileName(subjectName);
      const cleanClassName = this.sanitizeFileName(className);
      const cleanAssignmentTitle = this.sanitizeFileName(assignmentTitle);
      
      const subjectFolderName = `${cleanClassName}_${cleanSubjectName}`;
      const folderPath = this.cloudinary.generateFolderPath(subjectName, className, assignmentTitle);
      
      console.log(`✅ เตรียมโฟลเดอร์งาน: ${folderPath} (Cloudinary จะสร้างอัตโนมัติ)`);
      return {
        subjectFolder: subjectFolderName,
        assignmentFolder: cleanAssignmentTitle,
        folderPath: folderPath
      };
    } catch (error) {
      console.error('Error creating assignment folder:', error);
      throw error;
    }
  }

  // ลบโฟลเดอร์งานและไฟล์ทั้งหมดจาก Cloudinary
  async deleteAssignmentFolder(subjectName, className, assignmentTitle) {
    try {
      const cleanSubjectName = this.sanitizeFileName(subjectName);
      const cleanClassName = this.sanitizeFileName(className);
      const cleanAssignmentTitle = this.sanitizeFileName(assignmentTitle);
      
      const subjectFolderName = `${cleanClassName}_${cleanSubjectName}`;
      const folderPath = this.cloudinary.generateFolderPath(subjectName, className, assignmentTitle);
      
      // ลบโฟลเดอร์งานจาก Cloudinary
      await this.cloudinary.deleteFolder(folderPath);
      
      console.log(`🗑️ ลบโฟลเดอร์งานจาก Cloudinary: ${folderPath}`);
      return {
        subjectFolder: subjectFolderName,
        assignmentFolder: cleanAssignmentTitle
      };
    } catch (error) {
      console.error('Error deleting assignment folder:', error);
      throw error;
    }
  }

  // อัปโหลดไฟล์ไปยัง Cloudinary
  async saveFile(buffer, studentId, studentName, subjectName, className, assignmentTitle) {
    try {
      // สร้าง public_id และ folder path
      const publicId = this.generatePublicId(studentId, studentName, assignmentTitle);
      const folderPath = this.cloudinary.generateFolderPath(subjectName, className, assignmentTitle);
      
      // อัปโหลดไฟล์ไปยัง Cloudinary
      const result = await this.cloudinary.uploadImage(buffer, publicId, folderPath);
      
      const cleanSubjectName = this.sanitizeFileName(subjectName);
      const cleanClassName = this.sanitizeFileName(className);
      const cleanAssignmentTitle = this.sanitizeFileName(assignmentTitle);
      const subjectFolderName = `${cleanClassName}_${cleanSubjectName}`;
      
      console.log(`☁️ อัปโหลดไฟล์ไปยัง Cloudinary: ${publicId}`);
      
      return {
        fileName: `${publicId}.jpg`, // Cloudinary แปลงเป็น JPG
        subjectFolder: subjectFolderName,
        assignmentFolder: cleanAssignmentTitle,
        cloudinaryId: result.id,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        bytes: result.bytes
      };
    } catch (error) {
      console.error('Error saving file to Cloudinary:', error);
      throw error;
    }
  }

  // ทำความสะอาดชื่อไฟล์/โฟลเดอร์ สำหรับ Cloudinary
  sanitizeFileName(name) {
    return this.cloudinary.sanitizeFileName(name);
  }

  // รับรายชื่อไฟล์ในโฟลเดอร์งานจาก Cloudinary
  async getAssignmentFiles(subjectName, className, assignmentTitle) {
    try {
      const cleanSubjectName = this.sanitizeFileName(subjectName);
      const cleanClassName = this.sanitizeFileName(className);
      const cleanAssignmentTitle = this.sanitizeFileName(assignmentTitle);
      
      const subjectFolderName = `${cleanClassName}_${cleanSubjectName}`;
      const folderPath = this.cloudinary.generateFolderPath(subjectName, className, assignmentTitle);
      
      // ดึงไฟล์จาก Cloudinary
      const files = await this.cloudinary.getFilesInFolder(folderPath);
      
      return files.map(file => ({
        fileName: file.id.split('/').pop() + '.' + file.format,
        subjectFolder: subjectFolderName,
        assignmentFolder: cleanAssignmentTitle,
        cloudinaryId: file.id,
        url: file.url,
        bytes: file.bytes,
        createdAt: file.createdAt
      }));
    } catch (error) {
      console.error('Error getting assignment files from Cloudinary:', error);
      return [];
    }
  }

  // รับรายชื่อไฟล์ในโฟลเดอร์วิชา (ทั้งหมด) จาก Cloudinary
  async getSubjectFiles(subjectName, className) {
    try {
      const cleanSubjectName = this.sanitizeFileName(subjectName);
      const cleanClassName = this.sanitizeFileName(className);
      const folderName = `${cleanClassName}_${cleanSubjectName}`;
      
      // ดึงไฟล์ทั้งหมดจากโฟลเดอร์วิชาใน Cloudinary
      const folderPath = `assignment-system/${folderName}`;
      const files = await this.cloudinary.getFilesInFolder(folderPath, 500); // เพิ่มจำนวนสูงสุด
      
      return files.map(file => {
        // แยกชื่อโฟลเดอร์งานจาก public_id
        const pathParts = file.id.split('/');
        const assignmentFolder = pathParts.length > 2 ? pathParts[2] : null;
        
        return {
          fileName: file.id.split('/').pop() + '.' + file.format,
          subjectFolder: folderName,
          assignmentFolder: assignmentFolder,
          cloudinaryId: file.id,
          url: file.url,
          bytes: file.bytes,
          createdAt: file.createdAt
        };
      });
    } catch (error) {
      console.error('Error getting subject files from Cloudinary:', error);
      return [];
    }
  }
}

module.exports = new FileManager();