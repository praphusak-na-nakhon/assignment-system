# 🚀 คู่มือนำระบบส่งการบ้านออนไลน์ขึ้นเซิร์ฟเวอร์ (ฟรี 100%)

## 📋 สารบัญ
- [วิธีที่ 1: Railway (แนะนำ - ง่ายที่สุด)](#วิธีที่-1-railway-แนะนำ---ง่ายที่สุด)
- [วิธีที่ 2: Render + Netlify](#วิธีที่-2-render--netlify)
- [วิธีที่ 3: Vercel (Frontend + Backend ในที่เดียว)](#วิธีที่-3-vercel-frontend--backend-ในที่เดียว)
- [การตั้งค่า Environment Variables](#การตั้งค่า-environment-variables)
- [การแก้ไขปัญหาที่พบบ่อย](#การแก้ไขปัญหาที่พบบ่อย)

---

## วิธีที่ 1: Railway (แนะนำ - ง่ายที่สุด)

### 🔥 ข้อดี:
- Deploy ทั้ง Frontend และ Backend ในที่เดียว
- มี Database ฟรี
- ตั้งค่าง่าย
- Domain ฟรี
- ใช้เครดิต $5/เดือน (ใช้ได้นานหลายเดือน)

### 📝 ขั้นตอนการ Deploy:

#### 1. เตรียมโค้ด
```bash
# ใน root directory ของโปรเจค
git init
git add .
git commit -m "Initial commit for deployment"
```

#### 2. สร้าง GitHub Repository
1. ไปที่ https://github.com
2. คลิก "New repository"
3. ตั้งชื่อ: `assignment-system`
4. เลือก "Public"
5. คลิก "Create repository"

#### 3. อัปโหลดโค้ดขึ้น GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/assignment-system.git
git branch -M main
git push -u origin main
```

#### 4. สมัคร Railway
1. ไปที่ https://railway.app
2. คลิก "Start a New Project"
3. เข้าสู่ระบบด้วย GitHub
4. อนุญาตให้ Railway เข้าถึง Repository

#### 5. Deploy โปรเจค
1. เลือก "Deploy from GitHub repo"
2. เลือก Repository: `assignment-system`
3. Railway จะ Deploy อัตโนมัติ

#### 6. ตั้งค่า Environment Variables
1. ไปที่ Dashboard ของโปรเจค
2. คลิก "Variables" tab
3. เพิ่มตัวแปรตามด้านล่าง:

```env
# Railway Environment Variables
NODE_ENV=production
PORT=3000

# Google API
GOOGLE_SERVICE_ACCOUNT_EMAIL=sheets-drive-service@assignmentsystem-468520.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDOQcCg3Dm3a06D\n3BB3EQV3QhdXO3/bTIfhrme0oTWc1Ht+Dcph9dZ54Uafi5prVOfazof3PC8yL78X\n8jaf6BT6PyPNVmTOCzjl6fHuCdKgWSj4A0IjONeUi6+6btuEpuks6WE4D/4QZKld\nz6ilpkq1sKwQSlNKmX5boB9+Sc5IYfGofgVn4rW8WFOgYUFFFppUJrbeOtzoOO8/\nsO2J9tNXQzzqYjDHdy20kQW6aKJnhbMTfB44qZjjUhvOskqG7DTM5Trhm9gBYhZM\nHoz0rzwhtvVXLK7xRDBVnMwulzzG2UkuLMGA87KAPJy2MurgUbs0p2GOBOdjkS3f\nRKfcD+TnAgMBAAECggEAGLsFj8QYH4f8SA8w4jXmQ+Bm0AzQTcklWcgBo0TZGs7X\nZ8vbgldpuf9q6mJgx5HMow20e855kjjrXsGqDw5SxZagglRjjdkGn3qniXUgDh3i\nraomWfbM0oDVNzNnmsYwmzP4djJksi5/qEHn5MTFnHdsih9/USiKYA4Y+Jl85Gyy\n4i8tcbA0XgXl3rHQrOg0aYGK7OvMnikGB4fFE+32s3DW93fW1GMZFAhXQsPEUDgO\n36fxwHiB4CYCyb/D1iv7glMh/neU4mOlHw8PyRg9D9gfddf3e0sXSV3xIygmBant\nOZv/pKZXYieZ+IWyzFw5+rRgJ60E2C40x68EjTj3AQKBgQDp2NEDJ+MWd0gGZ3VQ\nWoge5TQg0pqH7cPfB4/0/j65J/af3MMq2+z0DRLOucie07N8xPo7mC9B6aWUtqTu\ndSG89/ouF6/z8CaEuZ4fzipYRZ0M6erspAHtGVnBY6rxzh0KxtQWmU93npFSr2WX\nJkssns+P2MA6UHQgEWZQ5QZIJwKBgQDhy9RgHMKiQnLjECTX32LZdrPkN9gOSOrc\nNM/2JRBNvjPXOluC4geJ4+l8SwAVsP/JPnPD/WH1vYnEzhTdu6jsQaS8VV7IcSA4\nBja08qdaT8fVVkZ45P1fkEYWjNokFExXTwDLuP1tn07DR2IJUOUOMlZj6utDrW9h\nZ1GYDGy1QQKBgET7veTFbnshIvEosfXLTx52FOOd3RI+NKrlazUlj1FFlb5g/H33\nNLZl6Ods7N7Vqrwiy4KrCT3TdBIjsxHZIePB716LhE9cx7AdpaTSR7GUj5jQpIm8\ndAkCknS3NyVv3Sdhsg0cmtG5yDrxHPHyzPhTvP09Pq+1LhyLpXg1p52/AoGBAIU/\ndyX88vM0SX4r4cIvBrOUdFaCihLr/wVSeUMl3jgyvX8O5kAXySEbiYca74LdgCUv\noLuRRQTzBGFKyE+N1gMOPfwSWSvqbnwBVrlz1UTbfe8sycvAPrHtfx8Boh3WiLKh\nYbPXiF7vu1hMQNOElJfLJuYyFQJMUEVn5mPXOTPBAoGAAiuVnnz1LZgOvO24zv++\n37Pl0kKD612SV/pXK2cW9+YF3dADR7AGTUExGu6We+FVDdv223mGAGKrDFMEDv63\nqcbREQ3lRUzDy+9k6+1MryYAcieCsjbSrUSA2gF3CNQKKrSXADTeRuWV4KBSRZ9W\n5fw+LPAQgzdguSxexhdI/xc=\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=assignmentsystem-468520
GOOGLE_SHEETS_ID=1SlasMagsQIQ_YwYH0FYDduC9c2ruFFzuqpV3qDhuDCg
GDRIVE_FOLDER_ID=1wyP7hNLzeJVAm2TeX6hEkblW0wK0cfcK

# Application Settings
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/jpg,image/png,image/gif
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password123
```

#### 7. สร้างไฟล์ Production Config
สร้างไฟล์ `railway.json` ใน root directory:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "restartPolicyType": "on-failure",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 8. เพิ่ม Start Script ใน package.json
```json
{
  "scripts": {
    "start:prod": "concurrently \"npm run start:backend\" \"npm run start:frontend\"",
    "start:backend": "cd backend && npm start",
    "start:frontend": "cd frontend && npx serve -s build -l 3001"
  }
}
```

---

## วิธีที่ 2: Render + Netlify

### 🔥 ข้อดี:
- แยก Frontend และ Backend
- Render มี Database ฟรี
- Netlify เหมาะสำหรับ Frontend
- ทั้งคู่ฟรี (มีข้อจำกัดเล็กน้อย)

### 📝 ขั้นตอน Backend (Render):

#### 1. เตรียม Backend
สร้างไฟล์ `render.yaml` ใน root directory:
```yaml
services:
  - type: web
    name: assignment-backend
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

#### 2. Deploy Backend บน Render
1. ไปที่ https://render.com
2. สมัครด้วย GitHub
3. คลิก "New +" → "Web Service"
4. เชื่อมต่อ GitHub Repository
5. ตั้งค่า:
   - **Name**: `assignment-backend`
   - **Branch**: `main`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
6. เพิ่ม Environment Variables (เหมือนใน Railway)

### 📝 ขั้นตอน Frontend (Netlify):

#### 1. Build Frontend สำหรับ Production
สร้างไฟล์ `netlify.toml` ใน root directory:
```toml
[build]
  command = "cd frontend && npm run build"
  publish = "frontend/build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  REACT_APP_API_URL = "https://your-backend-url.onrender.com"
```

#### 2. Deploy Frontend บน Netlify
1. ไปที่ https://netlify.com
2. สมัครด้วย GitHub
3. คลิก "New site from Git"
4. เลือก GitHub Repository
5. ตั้งค่า:
   - **Build command**: `cd frontend && npm run build`
   - **Publish directory**: `frontend/build`
6. Deploy

---

## วิธีที่ 3: Vercel (Frontend + Backend ในที่เดียว)

### 📝 ขั้นตอน:

#### 1. สร้างไฟล์ vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": { 
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/build/$1"
    }
  ],
  "functions": {
    "backend/server.js": {
      "maxDuration": 30
    }
  }
}
```

#### 2. Deploy บน Vercel
1. ไปที่ https://vercel.com
2. สมัครด้วย GitHub
3. คลิก "New Project"
4. เลือก Repository
5. เพิ่ม Environment Variables
6. Deploy

---

## การตั้งค่า Environment Variables

### 🔧 สำหรับ Railway/Render/Vercel:
```env
# Production Settings
NODE_ENV=production
PORT=3000

# Google API (ใช้ข้อมูลเดิมจาก .env)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[YOUR_PRIVATE_KEY]\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_SHEETS_ID=your-sheets-id
GDRIVE_FOLDER_ID=your-drive-folder-id

# File Upload Settings
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/jpg,image/png,image/gif

# Admin Settings
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-this-password
```

### ⚠️ **สำคัญ**: 
- เปลี่ยน `ADMIN_PASSWORD` เป็นรหัสผ่านที่แข็งแกร่ง
- เก็บ Private Key ให้ปลอดภัย

---

## การแก้ไขปัญหาที่พับบ่อย

### 🔧 1. ปัญหา CORS Error
เพิ่มใน `backend/server.js`:
```javascript
app.use(cors({
  origin: ['https://your-frontend-domain.com', 'http://localhost:3000'],
  credentials: true
}));
```

### 🔧 2. ปัญหา File Upload บน Production
เพิ่มใน `backend/server.js`:
```javascript
// เพิ่ม middleware สำหรับ file size
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
```

### 🔧 3. ปัญหา Google API Credentials
- ตรวจสอบว่า Private Key มี `\n` ครบถ้วน
- ตรวจสอบว่า Service Account มีสิทธิ์ในเรื่อง Google Sheets และ Drive

### 🔧 4. ปัญหา Database Connection
- สำหรับ Railway: ใช้ Database ที่ให้มา
- สำหรับ Render: ใช้ PostgreSQL ฟรี
- ตรวจสอบ Connection String

---

## 🎉 ขั้นตอนหลัง Deploy

### 1. ทดสอบระบบ
- ทดสอบการ Login ครู/นักเรียน
- ทดสอบการอัปโหลดไฟล์
- ทดสอบการดูคะแนน

### 2. แจ้ง URL ให้ผู้ใช้
- **Railway**: `https://your-app-name.up.railway.app`
- **Render**: `https://your-app-name.onrender.com`
- **Vercel**: `https://your-app-name.vercel.app`
- **Netlify**: `https://your-app-name.netlify.app`

### 3. ตั้งค่า Custom Domain (ถ้าต้องการ)
- ซื้อ Domain จาก Namecheap, GoDaddy
- ตั้งค่า DNS ชี้ไปที่ Provider
- เปิดใช้ SSL Certificate

---

## 💡 เคล็ดลับเพิ่มเติม

### 1. การติดตาม Log
```javascript
// เพิ่มใน backend/server.js
console.log(`🚀 Server running on port ${PORT}`);
console.log(`📡 Environment: ${process.env.NODE_ENV}`);
```

### 2. การ Backup ข้อมูล
- ตั้งค่า Google Sheets ให้ Auto-backup
- Export ข้อมูลเป็น CSV เป็นระยะ

### 3. การ Monitor การใช้งาน
- ใช้ Google Analytics (ถ้าต้องการ)
- ติดตาม Error ผ่าน Console Log

---

## 🆘 หากพบปัญหา

1. ตรวจสอบ Console Log ใน Browser
2. ตรวจสอบ Server Log ใน Provider Dashboard
3. ตรวจสอบ Environment Variables
4. ทดสอบ API ด้วย Postman
5. ตรวจสอบ Network tab ใน Developer Tools

---

## 📞 การติดต่อ Support

- **Railway**: https://railway.app/help
- **Render**: https://render.com/docs
- **Vercel**: https://vercel.com/docs
- **Netlify**: https://docs.netlify.com

---

## 🎯 แนะนำ: Railway
สำหรับผู้เริ่มต้น แนะนำ **Railway** เพราะ:
- ตั้งค่าง่ายที่สุด
- Deploy ทั้ง Frontend + Backend ในที่เดียว
- มี Database ฟรี
- Support ดี
- ใช้เครดิต $5 ฟรี (พอใช้หลายเดือน)

**Happy Coding! 🚀**