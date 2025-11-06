// app.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const connectDB = require('./config/db');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/authRoutes');
const superAdminRoutes = require('./routes/superAdmin');
const postRoutes = require('./routes/postRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
import availabilityRoutes from './routes/availabilityRoutes.js';
import designerRoutes from './routes/designerRoutes.js';

connectDB();

const app = express();
const server = http.createServer(app); // create HTTP server
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});
app.set('io', io); // make io accessible in controllers

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Join a private room for this user
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their private room`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});


app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  exposedHeaders: ['Content-Type'],
  optionsSuccessStatus: 200
}));

app.use(express.json());
app.use('/uploads', (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET");
  res.header("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/designers', designerRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
