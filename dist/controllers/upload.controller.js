"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUpload = exports.getAllUploads = exports.uploadFile = void 0;
const uploadModel_1 = __importDefault(require("../models/uploadModel"));
const cloudinary_1 = __importDefault(require("../utils/cloudinary")); // Fixed typo in import
const fs_1 = __importDefault(require("fs"));
const uploadFile = async (req, res) => {
    try {
        const customReq = req;
        if (!customReq.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }
        // Configure Cloudinary upload options - handles large files and various formats
        const uploadOptions = {
            folder: 'uploads',
            resource_type: "auto",
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
        const result = await cloudinary_1.default.uploader.upload(customReq.file.path, uploadOptions);
        const newUpload = new uploadModel_1.default({
            fileName: customReq.file.originalname,
            url: result.secure_url,
            fileType: customReq.file.mimetype,
            fileSize: customReq.file.size,
            publicId: result.public_id // Store public_id for easier deletion
        });
        await newUpload.save();
        // Remove the temporary file (only once)
        if (fs_1.default.existsSync(customReq.file.path)) {
            fs_1.default.unlinkSync(customReq.file.path);
        }
        res.status(201).json({
            ...newUpload.toObject(),
            sizeInMB: (newUpload.fileSize / (1024 * 1024)).toFixed(2) + ' MB'
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Upload failed', error: message });
    }
};
exports.uploadFile = uploadFile;
const getAllUploads = async (_req, res) => {
    try {
        const uploads = await uploadModel_1.default.find().sort({ uploadDate: -1 });
        // Add formatted size information
        const formattedUploads = uploads.map(upload => {
            const sizeInMB = (upload.fileSize / (1024 * 1024)).toFixed(2);
            return {
                ...upload.toObject(),
                sizeInMB: sizeInMB + ' MB'
            };
        });
        res.status(200).json(formattedUploads);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ message: 'Failed to fetch uploads', error: message });
    }
};
exports.getAllUploads = getAllUploads;
const deleteUpload = async (req, res) => {
    try {
        const { id } = req.params;
        const upload = await uploadModel_1.default.findById(id);
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
        let resourceType = 'raw';
        if (['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension || '')) {
            resourceType = 'image';
        }
        else if (['mp4', 'mov'].includes(fileExtension || '')) {
            resourceType = 'video';
        }
        await cloudinary_1.default.uploader.destroy(publicId, { resource_type: resourceType });
        await uploadModel_1.default.findByIdAndDelete(id);
        res.status(200).json({ message: 'Upload deleted successfully' });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Delete error:', error);
        res.status(500).json({ message: 'Failed to delete upload', error: message });
    }
};
exports.deleteUpload = deleteUpload;
