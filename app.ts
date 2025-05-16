import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import uploadRoutes from './routes/upload.routes';
import path from 'path';
import os from 'os';
import fs from 'fs';
import compression from 'compression'; 

dotenv.config();
const app = express();

// Define single CORS configuration
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middleware - optimized order
app.use(compression()); // Add compression for faster response times
app.use(cors(corsOptions)); // Use CORS only once with proper options
app.use(express.json({ limit: '10mb' })); // Reduced limit for better performance
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Reduced limit

// Create uploads temp directory - use OS temp directory for Railway compatibility
const tempDir = process.env.NODE_ENV === 'production' ? os.tmpdir() : path.join(__dirname, './temp');
if (!fs.existsSync(tempDir) && process.env.NODE_ENV !== 'production') {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Routes
app.use('/api/uploads', uploadRoutes);

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV });
});

app.get('/' , (req, res) => {
  res.status(200).json({ message: 'Hello from the server!' });
})

// MongoDB connection with optimized options
const MONGO_URI = process.env.MONGO_URI;
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI || '', {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    console.log('MongoDB connected');
    
    // Set up mongoose performance options
    mongoose.set('autoIndex', false); // Disable autoIndex in production
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // Implement reconnection strategy
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

export default app;