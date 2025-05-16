import { Request, Response } from 'express';

// Extend the Request interface to include the 'file' property
interface CustomRequest extends Request {
  file?: Express.Multer.File;
}

import Upload from '../models/uploadModel';
import cloudinary from '../utils/cloudinary'; // Fixed typo in import
import fs from 'fs';

export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const customReq = req as CustomRequest;
    if (!customReq.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }
    
    // Configure Cloudinary upload options - handles large files and various formats
    const uploadOptions = {
      folder: 'uploads',
      resource_type: "auto" as "auto",
      chunk_size: 6000000, // 6MB chunks for better upload handling
      timeout: 300000 // 5 minute timeout
    };
    
    // For very large files, we might need to handle them differently
    const fileSize = customReq.file.size;
    if (fileSize > 500 * 1024 * 1024) { // If larger than 500MB
      console.log(`Uploading large file (${fileSize / (1024 * 1024)} MB)`);
      // You might want to add additional options for very large files
      res.status(413).json({ message: 'File is too large (max 500MB)' });
      return;
    }
    
    const result = await cloudinary.uploader.upload(customReq.file.path, uploadOptions);
    
    const newUpload = new Upload({
      fileName: customReq.file.originalname,
      url: result.secure_url,
      fileType: customReq.file.mimetype,
      fileSize: customReq.file.size,
      publicId: result.public_id // Store public_id for easier deletion
    });
    
    await newUpload.save();

    // Remove the temporary file (only once)
    if (fs.existsSync(customReq.file.path)) {
      fs.unlinkSync(customReq.file.path);
    }

    res.status(201).json({
      ...newUpload.toObject(),
      sizeInMB: (newUpload.fileSize / (1024 * 1024)).toFixed(2) + ' MB'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: message });
  }
};

export const getAllUploads = async (_req: Request, res: Response): Promise<void> => {
  try {
    const uploads = await Upload.find().sort({ uploadDate: -1 });
    
    // Add formatted size information
    const formattedUploads = uploads.map(upload => {
      const sizeInMB = (upload.fileSize / (1024 * 1024)).toFixed(2);
      return {
        ...upload.toObject(),
        sizeInMB: sizeInMB + ' MB'
      };
    });
    
    res.status(200).json(formattedUploads);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to fetch uploads', error: message });
  }
};

export const deleteUpload = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const upload = await Upload.findById(id);

    if (!upload) {
      res.status(404).json({ message: 'Upload not found' });
      return;
    }
    
    const publicId = upload.publicId || (() => {
      const urlParts = upload.url.split('/');
      const fileNameWithExt = urlParts[urlParts.length - 1];
      return `uploads/${fileNameWithExt.split('.')[0]}`;
    })();

    const fileExtension = upload.url.split('.').pop()?.toLowerCase();
    let resourceType: 'image' | 'video' | 'raw' = 'raw';

    if (['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension || '')) {
      resourceType = 'image';
    } else if (['mp4', 'mov'].includes(fileExtension || '')) {
      resourceType = 'video';
    }

    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    await Upload.findByIdAndDelete(id);

    res.status(200).json({ message: 'Upload deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Failed to delete upload', error: message });
  }
};
