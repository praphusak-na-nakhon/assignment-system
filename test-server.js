const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

// Simple CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://wondrous-piroshki-96cc9e.netlify.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Test server is working!',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API test endpoint working!',
    cors: 'enabled'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
});