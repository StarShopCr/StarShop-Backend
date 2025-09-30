import { Request, Response, NextFunction } from 'express';
import { cloudinaryUpload } from '../config/cloudinary.config';
import { s3Upload } from '../config/s3.config';
import { FileType } from '../entities/file.entity';

// Interface to extend Express Request
declare module 'express-serve-static-core' {
  interface Request {
    fileProvider?: 'cloudinary' | 's3';
    fileType?: FileType;
  }
}

/**
 * Middleware for file upload based on provider preference
 * @param provider - Storage provider ('cloudinary' or 's3')
 */
export const uploadFile = (provider: 'cloudinary' | 's3' = 'cloudinary') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    req.fileProvider = provider;

    const upload = provider === 's3' ? s3Upload : cloudinaryUpload;
    const uploadMiddleware = upload.single('file');

    uploadMiddleware(req, res, (err): void => {
      if (err) {
        res.status(400).json({
          status: 'error',
          message: err.message,
        });
        return;
      }

      // Determine file type based on mimetype
      if (req.file) {
        const mimetype = req.file.mimetype;
        if (mimetype.startsWith('image/')) {
          req.fileType = FileType.IMAGE;
        } else if (
          mimetype === 'application/pdf' ||
          mimetype === 'application/msword' ||
          mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
          req.fileType = FileType.DOCUMENT;
        } else {
          req.fileType = FileType.OTHER;
        }
      }

      next();
    });
  };
};

/**
 * Middleware to validate if file exists in the request
 */
export const validateFileExists = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file) {
    res.status(400).json({
      status: 'error',
      message: 'No file uploaded',
    });
    return;
  }
  next();
};
