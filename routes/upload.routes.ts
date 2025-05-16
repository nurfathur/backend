import express from 'express';
import multer from 'multer';
import path from 'path';
import os from 'os';
import { uploadFile, getAllUploads, deleteUpload } from '../controllers/upload.controller';

const router = express.Router();

// Configure Multer for temporary storage - use OS temp directory for Railway compatibility
const tempDir = process.env.NODE_ENV === 'production' ? os.tmpdir() : path.join(__dirname, '../temp/');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Set up multer with large file size limit for Cloudinary
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  }
});

// Routes
router.post('/', upload.single('file'), uploadFile);
router.get('/', getAllUploads);
router.delete('/:id', deleteUpload);

export default router;