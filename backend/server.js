const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Robust CORS Middleware for Preflight OPTIONS Requests
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.options('*', cors());

app.use(express.json());

// Serve uploaded question images statically from /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/exam', require('./src/routes/examRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));

// Root health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', message: 'Exam Portal Backend API running cleanly' });
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Exam Portal Backend running on http://localhost:${PORT}`);
});
