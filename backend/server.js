const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { PORT } = require('./config/constants');

// Routes
const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');

const app = express();

// Trust proxy for Railway/production deployment
app.set('trust proxy', 1);

// CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://wondrous-piroshki-96cc9e.netlify.app'
    ];
    
    // Check if origin is in allowed list or matches Netlify pattern
    if (allowedOrigins.includes(origin) || /https:\/\/.*\.netlify\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'studentId', 
    'username', 
    'password', 
    'Authorization',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods'
  ],
  optionsSuccessStatus: 200 // For legacy browser support
};

// Middleware with additional CORS headers
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (origin.includes('localhost') || origin.includes('netlify.app'))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, studentId, username, password, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (more relaxed for development)
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Serve uploaded files statically with better security
const setupStaticFiles = require('./middleware/static');
setupStaticFiles(app);

// Root endpoint for Railway health check
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Online Assignment Submission System API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Online Assignment Submission System API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'ไม่พบเส้นทาง API ที่ระบุ'
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📋 Assignment Submission System Backend Started`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});