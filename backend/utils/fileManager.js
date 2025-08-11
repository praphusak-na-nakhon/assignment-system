const fs = require('fs').promises;
const path = require('path');

class FileManager {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../../uploads');
  }

  // สร้างโฟลเดอร์วิชาใหม่
  async createSubjectFolder(subjectName, className) {
    try {
      // ทำความสะอาดชื่อสำหรับใช้เป็นชื่อโฟลเดอร์
      const cleanSubjectName = this.sanitizeFileName(subjectName);
      const cleanClassName = this.sanitizeFileName(className);
      const folderName = `${cleanClassName}_${cleanSubjectName}`;
      
      const subjectPath = path.join(this.uploadsDir, folderName);
      
      // สร้างโฟลเดอร์หลัก uploads ก่อนถ้ายังไม่มี
      await fs.mkdir(this.uploadsDir, { recursive: true });
      
      // สร้างโฟลเดอร์วิชา
      await fs.mkdir(subjectPath, { recursive: true });
      
      console.log(`✅ สร้างโฟลเดอร์วิชา: ${folderName}`);
      return folderName;
    } catch (error) {
      console.error('Error creating subject folder:', error);
      throw error;
    }
  }

  // ลบโฟลเดอร์วิชาและไฟล์ทั้งหมด
  async deleteSubjectFolder(subjectName, className) {
    try {
      const cleanSubjectName = this.sanitizeFileName(subjectName);
      const cleanClassName = this.sanitizeFileName(className);
      const folderName = `${cleanClassName}_${cleanSubjectName}`;
      
      const subjectPath = path.join(this.uploadsDir, folderName);
      
      // ตรวจสอบว่าโฟลเดอร์มีอยู่จริงหรือไม่
      try {
        await fs.access(subjectPath);
        // ลบโฟลเดอร์และไฟล์ทั้งหมดข้างใน
        await fs.rm(subjectPath, { recursive: true, force: true });
        console.log(`🗑️ ลบโฟลเดอร์วิชา: ${folderName}`);
      } catch (error) {
        // โฟลเดอร์ไม่มีอยู่ ไม่ต้องทำอะไร
        console.log(`⚠️ โฟลเดอร์ ${folderName} ไม่มีอยู่`);
      }
      
      return folderName;
    } catch (error) {
      console.error('Error deleting subject folder:', error);
      throw error;
    }
  }

  // สร้างชื่อไฟล์ในรูปแบบ: เลขนักเรียน_ชื่อ-นามสกุล_ชื่องาน.extension
  generateFileName(studentId, studentName, assignmentTitle, originalFileName) {
    try {
      // ดึงนามสกุลไฟล์
      const extension = path.extname(originalFileName);
      
      // ทำความสะอาดชื่อสำหรับใช้ในชื่อไฟล์
      const cleanStudentName = this.sanitizeFileName(studentName);
      const cleanAssignmentTitle = this.sanitizeFileName(assignmentTitle);
      
      // สร้างชื่อไฟล์
      const fileName = `${studentId}_${cleanStudentName}_${cleanAssignmentTitle}${extension}`;
      
      return fileName;
    } catch (error) {
      console.error('Error generating file name:', error);
      // กรณีมีข้อผิดพลาด ใช้รูปแบบง่ายๆ
      const extension = path.extname(originalFileName);
      return `${studentId}_${Date.now()}${extension}`;
    }
  }

  // สร้างโฟลเดอร์งานใหม่
  async createAssignmentFolder(subjectName, className, assignmentTitle) {
    try {
      const cleanSubjectName = this.sanitizeFileName(subjectName);
      const cleanClassName = this.sanitizeFileName(className);
      const cleanAssignmentTitle = this.sanitizeFileName(assignmentTitle);
      
      const subjectFolderName = `${cleanClassName}_${cleanSubjectName}`;
      const assignmentFolderPath = path.join(this.uploadsDir, subjectFolderName, cleanAssignmentTitle);
      
      // สร้างโฟลเดอร์งาน (รวมโฟลเดอร์วิชาด้วยถ้ายังไม่มี)
      await fs.mkdir(assignmentFolderPath, { recursive: true });
      
      console.log(`✅ สร้างโฟลเดอร์งาน: ${subjectFolderName}/${cleanAssignmentTitle}`);
      return {
        subjectFolder: subjectFolderName,
        assignmentFolder: cleanAssignmentTitle,
        fullPath: assignmentFolderPath
      };
    } catch (error) {
      console.error('Error creating assignment folder:', error);
      throw error;
    }
  }

  // ลบโฟลเดอร์งานและไฟล์ทั้งหมด
  async deleteAssignmentFolder(subjectName, className, assignmentTitle) {
    try {
      const cleanSubjectName = this.sanitizeFileName(subjectName);
      const cleanClassName = this.sanitizeFileName(className);
      const cleanAssignmentTitle = this.sanitizeFileName(assignmentTitle);
      
      const subjectFolderName = `${cleanClassName}_${cleanSubjectName}`;
      const assignmentFolderPath = path.join(this.uploadsDir, subjectFolderName, cleanAssignmentTitle);
      
      // ตรวจสอบว่าโฟลเดอร์งานมีอยู่จริงหรือไม่
      try {
        await fs.access(assignmentFolderPath);
        // ลบโฟลเดอร์งานและไฟล์ทั้งหมดข้างใน
        await fs.rm(assignmentFolderPath, { recursive: true, force: true });
        console.log(`🗑️ ลบโฟลเดอร์งาน: ${subjectFolderName}/${cleanAssignmentTitle}`);
      } catch (error) {
        // โฟลเดอร์งานไม่มีอยู่ ไม่ต้องทำอะไร
        console.log(`⚠️ โฟลเดอร์งาน ${subjectFolderName}/${cleanAssignmentTitle} ไม่มีอยู่`);
      }
      
      return {
        subjectFolder: subjectFolderName,
        assignmentFolder: cleanAssignmentTitle
      };
    } catch (error) {
      console.error('Error deleting assignment folder:', error);
      throw error;
    }
  }

  // บันทึกไฟล์ในโฟลเดอร์งานที่ถูกต้อง
  async saveFile(buffer, fileName, subjectName, className, assignmentTitle) {
    try {
      const cleanSubjectName = this.sanitizeFileName(subjectName);
      const cleanClassName = this.sanitizeFileName(className);
      const cleanAssignmentTitle = this.sanitizeFileName(assignmentTitle);
      
      const subjectFolderName = `${cleanClassName}_${cleanSubjectName}`;
      const assignmentFolderPath = path.join(this.uploadsDir, subjectFolderName, cleanAssignmentTitle);
      const filePath = path.join(assignmentFolderPath, fileName);
      
      // ตรวจสอบว่าโฟลเดอร์งานมีอยู่หรือไม่ ถ้าไม่มีให้สร้าง
      await fs.mkdir(assignmentFolderPath, { recursive: true });
      
      // บันทึกไฟล์
      await fs.writeFile(filePath, buffer);
      
      console.log(`💾 บันทึกไฟล์: ${fileName} ในโฟลเดอร์ ${subjectFolderName}/${cleanAssignmentTitle}`);
      
      return {
        fileName,
        subjectFolder: subjectFolderName,
        assignmentFolder: cleanAssignmentTitle,
        relativePath: path.join(subjectFolderName, cleanAssignmentTitle, fileName).replace(/\\/g, '/'), // ใช้ / สำหรับ URL
        fullPath: filePath
      };
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  }

  // ทำความสะอาดชื่อไฟล์/โฟลเดอร์ (เอาอักขระพิเศษออก)
  sanitizeFileName(name) {
    return name
      .replace(/[<>:"/\\|?*]/g, '') // เอาอักขระที่ใช้ในระบบไฟล์ไม่ได้ออก
      .replace(/\s+/g, '-') // แปลงช่องว่างเป็น -
      .trim(); // เอาช่องว่างหน้าหลังออก
  }

  // รับรายชื่อไฟล์ในโฟลเดอร์งาน
  async getAssignmentFiles(subjectName, className, assignmentTitle) {
    try {
      const cleanSubjectName = this.sanitizeFileName(subjectName);
      const cleanClassName = this.sanitizeFileName(className);
      const cleanAssignmentTitle = this.sanitizeFileName(assignmentTitle);
      
      const subjectFolderName = `${cleanClassName}_${cleanSubjectName}`;
      const assignmentFolderPath = path.join(this.uploadsDir, subjectFolderName, cleanAssignmentTitle);
      
      try {
        const files = await fs.readdir(assignmentFolderPath);
        return files.map(file => ({
          fileName: file,
          subjectFolder: subjectFolderName,
          assignmentFolder: cleanAssignmentTitle,
          relativePath: path.join(subjectFolderName, cleanAssignmentTitle, file).replace(/\\/g, '/')
        }));
      } catch (error) {
        // โฟลเดอร์งานไม่มีอยู่
        return [];
      }
    } catch (error) {
      console.error('Error getting assignment files:', error);
      return [];
    }
  }

  // รับรายชื่อไฟล์ในโฟลเดอร์วิชา (ทั้งหมด)
  async getSubjectFiles(subjectName, className) {
    try {
      const cleanSubjectName = this.sanitizeFileName(subjectName);
      const cleanClassName = this.sanitizeFileName(className);
      const folderName = `${cleanClassName}_${cleanSubjectName}`;
      
      const subjectPath = path.join(this.uploadsDir, folderName);
      
      try {
        const items = await fs.readdir(subjectPath, { withFileTypes: true });
        const allFiles = [];
        
        for (const item of items) {
          if (item.isDirectory()) {
            // โฟลเดอร์งาน - ดึงไฟล์จากข้างใน
            const assignmentFiles = await this.getAssignmentFiles(subjectName, className, item.name);
            allFiles.push(...assignmentFiles);
          } else {
            // ไฟล์โดยตรงในโฟลเดอร์วิชา (อาจจะมีจากระบบเก่า)
            allFiles.push({
              fileName: item.name,
              subjectFolder: folderName,
              assignmentFolder: null,
              relativePath: path.join(folderName, item.name).replace(/\\/g, '/')
            });
          }
        }
        
        return allFiles;
      } catch (error) {
        // โฟลเดอร์วิชาไม่มีอยู่
        return [];
      }
    } catch (error) {
      console.error('Error getting subject files:', error);
      return [];
    }
  }
}

module.exports = new FileManager();