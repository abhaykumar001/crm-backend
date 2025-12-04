import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration for project files
const projectStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const projectId = req.params.id;
    const projectDir = path.join(uploadDir, 'projects', projectId);
    
    // Create project directory if it doesn't exist
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    
    cb(null, projectDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter for images and documents
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
    return;
  }
  
  // Allow PDFs for brochures
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
    return;
  }
  
  // Allow document formats
  const allowedDocTypes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (allowedDocTypes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }
  
  // Reject other file types
  cb(new Error(`File type ${file.mimetype} is not allowed. Only images, PDFs, and documents are supported.`));
};

// Multer configuration for project media
export const projectUpload = multer({
  storage: projectStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files per upload
  }
});

// Middleware for single file upload
export const uploadSingle = (fieldName: string) => projectUpload.single(fieldName);

// Middleware for multiple files upload
export const uploadMultiple = (fieldName: string, maxCount: number = 10) => 
  projectUpload.array(fieldName, maxCount);

// Middleware for multiple fields upload
export const uploadFields = (fields: { name: string; maxCount?: number }[]) => 
  projectUpload.fields(fields);

// Error handling middleware for multer errors
export const handleUploadError = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum size is 10MB per file.'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum 10 files per upload.'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected field name in file upload.'
        });
      default:
        return res.status(400).json({
          success: false,
          message: `Upload error: ${error.message}`
        });
    }
  }
  
  if (error.message.includes('File type') && error.message.includes('not allowed')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// Utility function to delete files
export const deleteUploadedFile = (filePath: string): boolean => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Utility function to get file info
export const getFileInfo = (file: Express.Multer.File) => ({
  originalName: file.originalname,
  filename: file.filename,
  mimetype: file.mimetype,
  size: file.size,
  path: file.path
});

export default {
  projectUpload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  handleUploadError,
  deleteUploadedFile,
  getFileInfo
};