import { Response } from 'express';
import { FileService } from '../services/file.service';
import { FileType } from '../entities/file.entity';
import { AuthenticatedRequest } from '../../../../src/types/auth-request.type';
import { UploadFileDto } from '../dto/file.dto';

export class FileController {
  private fileService: FileService;

  constructor() {
    this.fileService = new FileService();
  }

  /**
   * Upload a file
   */
  async uploadFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          status: 'error',
          message: 'No file uploaded',
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
        return;
      }

      const uploadDto: UploadFileDto = {
        provider: req.fileProvider as 'cloudinary' | 's3',
        fileType: req.fileType as FileType,
      };

      const file = await this.fileService.uploadFile(
        req.file,
        req.user.id,
        uploadDto.provider || 'cloudinary',
        uploadDto.fileType || FileType.OTHER
      );

      res.status(201).json({
        status: 'success',
        data: file,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred while uploading the file',
      });
    }
  }

  /**
   * Get files uploaded by the authenticated user
   */
  async getUserFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
        return;
      }

      const files = await this.fileService.getUserFiles(req.user.id);

      res.status(200).json({
        status: 'success',
        data: files,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred while fetching files',
      });
    }
  }

  /**
   * Get a file by id
   */
  async getFileById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const file = await this.fileService.getFileById(id);

      if (!file) {
        res.status(404).json({
          status: 'error',
          message: 'File not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: file,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred while fetching the file',
      });
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user) {
        res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
        return;
      }

      await this.fileService.deleteFile(id, req.user.id);

      res.status(200).json({
        status: 'success',
        message: 'File deleted successfully',
      });
    } catch (error) {
      if (error.message === 'File not found or you do not have permission to delete it') {
        res.status(404).json({
          status: 'error',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred while deleting the file',
      });
    }
  }

  /**
   * Get files by type
   */
  async getFilesByType(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { type } = req.params;

      if (!Object.values(FileType).includes(type as FileType)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid file type',
        });
        return;
      }

      const files = await this.fileService.getFilesByType(type as FileType);

      res.status(200).json({
        status: 'success',
        data: files,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred while fetching files',
      });
    }
  }
}
