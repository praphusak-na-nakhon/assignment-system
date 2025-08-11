# 🎓 ระบบส่งการบ้านออนไลน์ (Online Assignment Submission System)

ระบบบริหารจัดการงานและคะแนนแบบครบวงจรสำหรับสถานศึกษา ที่ใช้ Google Sheets เป็นฐานข้อมูลหลัก พร้อมระบบจัดเก็บไฟล์แบบเป็นระเบียบ

## ✨ ฟีเจอร์เด่น

### 👨‍🎓 สำหรับนักเรียน
- 🔐 **เข้าสู่ระบบง่าย** - ใช้เพียงเลขประจำตัวนักเรียน
- 📤 **ส่งงานอัปโหลดไฟล์** - รองรับไฟล์รูปภาพทุกประเภท
- 📊 **ดูคะแนนแบบตาราง** - แสดงคะแนนทุกงานของนักเรียนทั้งห้อง (ไม่ใช่ลิงก์ Google Sheets)
- 📥 **ดาวน์โหลดเอกสาร** - รับไฟล์และใบงานจากครู
- 🏆 **ติดตามคะแนน** - ระบบคำนวณคะแนนรวมอัตโนมัติ

### 👩‍🏫 สำหรับครู
- 🏫 **จัดการวิชาเรียน** - เพิ่ม แก้ไข ลบวิชาและกำหนดคะแนนเต็ม
- 👥 **บริหารจัดการนักเรียน** - ข้อมูลนักเรียนแต่ละห้อง
- 📝 **สร้างงาน** - สร้างงานใหม่พร้อมกำหนดส่ง
- 📊 **ตารางคะแนนแบบละเอียด** - ดูคะแนนทุกงานของนักเรียนทั้งห้อง
- 📋 **ส่งออก Excel** - Export คะแนนเป็นไฟล์ Excel
- 📎 **อัปโหลดเอกสาร** - แชร์ไฟล์ให้นักเรียนดาวน์โหลด
- ⚡ **คำนวณคะแนนอัตโนมัติ** - ระบบปรับคะแนนเมื่อเพิ่ม/ลบงาน

## 🗂️ ระบบจัดเก็บไฟล์แบบเป็นระเบียบ

```
📁 uploads/
├── 📁 ม4-1_คณิตศาสตร์/
│   ├── 📁 การบ้านที่1/
│   │   ├── 📄 19450_นายสมชาย-ใจดี_การบ้านที่1.jpg
│   │   ├── 📄 19451_นางสาวสมหญิง-รักเรียน_การบ้านที่1.png
│   │   └── ...
│   ├── 📁 แบบฝึกหัดที่2/
│   │   └── ...
│   └── ...
├── 📁 ม6-2_ภาษาไทย/
│   ├── 📁 เรียงความที่1/
│   └── ...
└── ...
```

### 🎯 การจัดการไฟล์อัตโนมัติ:
- **เมื่อครูสร้างวิชาใหม่** → สร้างโฟลเดอร์วิชาอัตโนมัติ
- **เมื่อครูสร้างงานใหม่** → สร้างโฟลเดอร์งานในวิชานั้น
- **เมื่อนักเรียนส่งงาน** → บันทึกเป็น `เลขนักเรียน_ชื่อ-นามสกุล_ชื่องาน.นามสกุลไฟล์`
- **เมื่อครูลบงาน** → ลบโฟลเดอร์และไฟล์ทั้งหมดในงานนั้น
- **เมื่อครูลบวิชา** → ลบโฟลเดอร์วิชาและไฟล์ทั้งหมด

## 🛠 เทคโนโลยีที่ใช้

### Backend
- **Node.js 16+** + **Express.js** - Web Server
- **Google Sheets API** - ฐานข้อมูลหลัก
- **Google Drive API** - จัดเก็บไฟล์เอกสาร
- **Multer** - จัดการการอัปโหลดไฟล์
- **File Manager System** - จัดระเบียบไฟล์แบบ 3 ชั้น

### Frontend
- **React 18** + **React Router** - UI Framework
- **Tailwind CSS** - Styling
- **React Context** - State Management
- **React Hot Toast** - การแจ้งเตือน
- **XLSX Library** - ส่งออกไฟล์ Excel

## 📋 ข้อกำหนดระบบ

- **Node.js** 16 หรือใหม่กว่า
- **npm** 7 หรือใหม่กว่า
- **Google Cloud Project** พร้อม Service Account
- **Google Sheets** สำหรับฐานข้อมูล
- **Google Drive** สำหรับเก็บเอกสาร

## 🚀 การติดตั้งและใช้งาน

### 1. 📥 Clone และติดตั้ง
```bash
git clone <repository-url>
cd my-project
npm run install:all
```

### 2. ⚙️ ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ใน `backend/`:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Google Cloud Configuration
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_SHEETS_ID=your-sheets-id
GDRIVE_FOLDER_ID=your-drive-folder-id

# File Upload Settings
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/jpg,image/png,image/gif

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

### 3. 📊 ตั้งค่า Google Sheets

สร้าง Google Sheets พร้อม 5 แท็บ:

#### **Subjects** (วิชาเรียน)
```
A: ID | B: Name | C: Class | D: MaxScore | E: TotalAssignments | F: ScorePerAssignment | G: ScoreSheetUrl
```

#### **Students** (นักเรียน)
```
A: ID | B: StudentID | C: Name | D: Class | E: Subjects | F: TotalScore
```

#### **Assignments** (งานที่มอบหมาย)
```
A: ID | B: SubjectID | C: Title | D: Description | E: DueDate | F: CreatedAt | G: Score | H: IsActive
```

#### **Submissions** (การส่งงาน)
```
A: ID | B: StudentID | C: AssignmentID | D: SubjectID | E: FileName | F: FileURL | G: Score | H: SubmittedAt | I: Status
```

#### **Documents** (เอกสาร)
```
A: ID | B: Title | C: Description | D: Category | E: SubjectID | F: FileURL | G: UploadedAt
```

### 4. 🔑 ตั้งค่า Google Service Account

1. เข้า [Google Cloud Console](https://console.cloud.google.com/)
2. สร้างหรือเลือก Project
3. เปิดใช้งาน **Google Sheets API** และ **Google Drive API**
4. สร้าง **Service Account** และดาวน์โหลด JSON key
5. **แชร์ Google Sheets และ Drive Folder** ให้กับ Service Account email
6. คัดลอกข้อมูลจาก JSON key ใส่ไฟล์ `.env`

### 5. 🏃‍♂️ รันโปรแกรม

#### Development Mode:
```bash
npm run dev
```

#### Production Mode:
```bash
npm run build
npm start
```

### 6. 🌐 เข้าใช้งาน

- **Frontend:** http://localhost:3002
- **Backend:** http://localhost:5000

## 📖 คู่มือการใช้งาน

### 👨‍🎓 สำหรับนักเรียน

1. **เข้าสู่ระบบ** - ใส่เลขประจำตัวนักเรียน
2. **ส่งงาน** - เลือกวิชา → งาน → อัปโหลดไฟล์
3. **ดูคะแนน** - ดูตารางคะแนนของทั้งห้อง (แบ่งตามวิชา)
4. **ดาวน์โหลดเอกสาร** - ดาวน์โหลดไฟล์จากครู

### 👩‍🏫 สำหรับครู

1. **เข้าสู่ระบบ** - ใส่ username/password
2. **จัดการวิชา** - เพิ่ม แก้ไข ลบวิชา กำหนดคะแนนเต็ม
3. **จัดการงาน** - สร้างงานใหม่ แก้ไข ลบงาน
4. **ดูคะแนน** - ดูตารางคะแนนแบบละเอียด ส่งออก Excel
5. **อัปโหลดเอกสาร** - แชร์ไฟล์ให้นักเรียน

## ⚙️ คำนวณคะแนนอัตโนมัติ

```
คะแนนต่องาน = คะแนนเต็มของวิชา ÷ จำนวนงานทั้งหมด
```

- นักเรียนส่งงาน → ได้คะแนนเต็มของงานนั้น
- ครูเพิ่มงานใหม่ → คะแนนต่องานลดลงอัตโนมัติ
- ครูลบงาน → คะแนนต่องานเพิ่มขึ้นอัตโนมัติ

## 🚀 การ Deploy ขึ้น Production

ระบบรองรับการ Deploy บนแพลตฟอร์มฟรี:

### 🌟 **Railway** (แนะนำ)
```bash
# ดู DEPLOYMENT_GUIDE.md สำหรับรายละเอียด
railway login
railway init
railway up
```

### 🔄 **Render + Netlify**
- **Backend:** Deploy บน Render
- **Frontend:** Deploy บน Netlify

### ⚡ **Vercel**
- Deploy ทั้งระบบในที่เดียว

> 📚 อ่านคู่มือการ Deploy แบบละเอียดใน `DEPLOYMENT_GUIDE.md`

## 🔒 ความปลอดภัย

- ✅ **Google Service Account** - การเข้าถึง API แบบปลอดภัย
- ✅ **File Validation** - ตรวจสอบประเภทและขนาดไฟล์
- ✅ **Rate Limiting** - จำกัดการเรียก API
- ✅ **CORS Configuration** - การตั้งค่าความปลอดภัยเว็บ
- ✅ **Secure File Naming** - ชื่อไฟล์ไม่ซ้ำและปลอดภัย

## 📁 โครงสร้างโปรเจค

```
my-project/
├── backend/                 # Node.js Backend
│   ├── config/             # การตั้งค่าระบบ
│   ├── middlewares/        # Middleware functions
│   ├── routes/             # API routes
│   ├── services/           # บริการต่างๆ (Google API)
│   ├── utils/              # เครื่องมือช่วย
│   └── server.js           # Main server file
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # UI Components
│   │   ├── pages/          # หน้าต่างๆ
│   │   ├── context/        # State Management
│   │   └── utils/          # เครื่องมือช่วย
│   └── public/
├── uploads/                # ไฟล์ที่อัปโหลด (จัดระเบียบอัตโนมัติ)
├── DEPLOYMENT_GUIDE.md     # คู่มือ Deploy
└── README.md               # คู่มือนี้
```

## 🐛 การแก้ไขปัญหา

### ❌ ปัญหาที่พบบ่อย:

1. **Google API ไม่ทำงาน**
   - ตรวจสอบ Service Account permissions
   - ตรวจสอบ API enabled ใน Google Cloud

2. **ไฟล์อัปโหลดไม่ได้**
   - ตรวจสอบขนาดไฟล์ (ไม่เกิน 10MB)
   - ตรวจสอบประเภทไฟล์ (เฉพาะรูปภาพ)

3. **คะแนนไม่อัปเดต**
   - รอสักครู่ (ระบบใช้เวลาประมวลผล)
   - รีเฟรชหน้าเว็บ

## 🤝 การพัฒนาต่อ

### 💡 ไอเดียฟีเจอร์เพิ่มเติม:
- 📱 Mobile App รองรับ
- 🔔 ระบบแจ้งเตือนผ่าน LINE
- 📈 Dashboard สถิติแบบละเอียด
- 👨‍👩‍👧‍👦 ระบบผู้ปกครองดูคะแนน
- 🎨 Theme แบบ Dark Mode

### 🛠 การปรับปรุง:
1. Fork repository นี้
2. สร้าง feature branch
3. Commit การเปลี่ยนแปลง
4. Create Pull Request

## 📞 การติดต่อและสนับสนุน

- 📧 **Email**: support@assignment-system.com
- 💬 **GitHub Issues**: สำหรับรายงานบั๊กหรือขอฟีเจอร์ใหม่
- 📚 **Wiki**: เอกสารเพิ่มเติม

## 📄 สัญญาอนุญาต

MIT License - ใช้งานและแก้ไขได้อย่างอิสระ

---

## 🎉 ขอบคุณ

ขอบคุณทุกคนที่ใช้งาน **ระบบส่งการบ้านออนไลน์** 

💡 *ระบบนี้ถูกพัฒนาขึ้นเพื่อช่วยให้การเรียนการสอนมีประสิทธิภาพมากขึ้น*

**Happy Teaching & Learning! 🚀📚**