// app.js
import 'dotenv/config'; // automatically calls config()
import express from 'express';
import http from 'http';
import { Server as socketIo } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './routes/authRoutes.js';
import superAdminRoutes from './routes/superAdmin.js';
import postRoutes from './routes/postRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';
import designerRoutes from './routes/designerRoutes.js';

connectDB();

const app = express();
const server = http.createServer(app); // create HTTP server
const io = new socketIo(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
