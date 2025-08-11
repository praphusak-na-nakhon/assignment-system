const express = require('express');
const path = require('path');

// Middleware สำหรับให้บริการไฟล์ static ที่อัปโหลด
const setupStaticFiles = (app) => {
  const uploadsPath = path.join(__dirname, '../../uploads');
  
  // ให้บริการไฟล์ static จากโฟลเดอร์ uploads
  app.use('/uploads', express.static(uploadsPath, {
    // ตั้งค่า headers สำหรับความปลอดภัย
    setHeaders: (res, filePath) => {
      // กำหนด Content-Type สำหรับไฟล์รูปภาพ
      if (filePath.match(/\.(jpg|jpeg|png|gif)$/i)) {
        res.setHeader('Content-Type', 'image/*');
      }
      
      // ป้องกันการ execute script
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'");
    },
    // จำกัดการเข้าถึงเฉพาะไฟล์ที่อนุญาต
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']
  }));
  
  console.log(`📁 Static files served from: ${uploadsPath}`);
};

module.exports = setupStaticFiles;