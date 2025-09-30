import { FileController } from '../controllers/file.controller';
import { FileService } from '../services/file.service';
import { AuthenticatedRequest } from '../../../../src/types/auth-request.type';
import { Response } from 'express';
import { File, FileType } from '../entities/file.entity';
import { Role } from '@/types/role';
import { User } from '../../users/entities/user.entity';

describe('FileController', () => {
  let fileController: FileController;
  let fileService: jest.Mocked<FileService>;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let responseObj: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    fileService = new FileService() as jest.Mocked<FileService>;

    fileController = new FileController();
    (fileController as unknown as { fileService: FileService }).fileService = fileService;

    responseObj = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockResponse = responseObj;

    // Setup basic mock request
    mockRequest = {
      user: {
        id: 'user-uuid',
        walletAddress: '0x123',
        role: [Role.USER],
      },
      fileProvider: 'cloudinary',
      fileType: FileType.IMAGE,
      params: {},
    };
  });

  describe('uploadFile', () => {
    it('should return 400 when no file is uploaded', async () => {
      mockRequest.file = undefined;

      await fileController.uploadFile(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'No file uploaded',
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.file = {} as Express.Multer.File;
      mockRequest.user = undefined;

      await fileController.uploadFile(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should successfully upload a file and return 201', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        path: 'https://example.com/test.jpg',
        filename: 'test-123',
      } as unknown as Express.Multer.File;

      mockRequest.file = mockFile;

      const mockUser = {
        id: 1,
        walletAddress: '0x123',
        role: [Role.USER],
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        orders: [],
        userRoles: [],
        notifications: [],
      } as unknown as User;

      const uploadedFile = {
        id: 'file-uuid',
        url: 'https://example.com/test.jpg',
        type: FileType.IMAGE,
        filename: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        providerType: 'cloudinary',
        providerPublicId: 'test-123',
        uploadedById: '1',
        uploadedAt: new Date(),
        uploadedBy: mockUser,
      } as File;

      fileService.uploadFile.mockResolvedValue(uploadedFile);

      await fileController.uploadFile(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(fileService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'user-uuid',
        'cloudinary',
        FileType.IMAGE
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: uploadedFile,
      });
    });

    it('should handle errors and return 500', async () => {
      mockRequest.file = {} as Express.Multer.File;

      const errorMessage = 'Upload failed';
      fileService.uploadFile.mockRejectedValue(new Error(errorMessage));

      await fileController.uploadFile(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: errorMessage,
      });
    });
  });

  describe('getUserFiles', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await fileController.getUserFiles(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should return user files successfully', async () => {
      const mockFiles = [
        {
          id: 'file-uuid-1',
          url: 'https://example.com/test1.jpg',
          type: FileType.IMAGE,
          filename: 'test1.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          providerType: 'cloudinary',
          providerPublicId: 'test-123',
          uploadedById: '1',
          uploadedAt: new Date(),
          uploadedBy: {
            id: 1,
            walletAddress: '0x123',
            name: 'Test User 1',
            email: 'test1@example.com',
            password: 'hashed_password',
            orders: [],
            userRoles: [],
          },
        },
        {
          id: 'file-uuid-2',
          url: 'https://example.com/test2.png',
          type: FileType.IMAGE,
          filename: 'test2.png',
          mimetype: 'image/png',
          size: 2048,
          providerType: 'cloudinary',
          providerPublicId: 'test-456',
          uploadedById: '2',
          uploadedAt: new Date(),
          uploadedBy: {
            id: 2,
            walletAddress: '0x456',
            name: 'Test User 2',
            email: 'test2@example.com',
            password: 'hashed_password',
            orders: [],
            userRoles: [],
          },
        },
      ] as unknown as File[];

      fileService.getUserFiles.mockResolvedValue(mockFiles);

      await fileController.getUserFiles(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(fileService.getUserFiles).toHaveBeenCalledWith('user-uuid');

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockFiles,
      });
    });

    it('should handle errors and return 500', async () => {
      const errorMessage = 'Database error';
      fileService.getUserFiles.mockRejectedValue(new Error(errorMessage));

      await fileController.getUserFiles(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: errorMessage,
      });
    });
  });

  describe('getFileById', () => {
    it('should return a file when it exists', async () => {
      mockRequest.params = { id: 'file-uuid' };

      const mockFile = {
        id: 'file-uuid',
        url: 'https://example.com/file.jpg',
        type: FileType.IMAGE,
        filename: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        providerType: 'cloudinary',
        providerPublicId: 'public-id',
        uploadedById: '1',
        uploadedAt: new Date(),
        uploadedBy: {
          id: 1,
          walletAddress: '0x123',
          name: 'Test User',
          email: 'test@example.com',
          password: 'hashed_password',
          orders: [],
          userRoles: [],
        },
      } as unknown as File;

      fileService.getFileById.mockResolvedValue(mockFile);

      await fileController.getFileById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(fileService.getFileById).toHaveBeenCalledWith('file-uuid');

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockFile,
      });
    });

    it('should return 404 when file does not exist', async () => {
      mockRequest.params = { id: 'non-existent-uuid' };

      fileService.getFileById.mockResolvedValue(undefined);

      await fileController.getFileById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'File not found',
      });
    });

    it('should handle errors and return 500', async () => {
      mockRequest.params = { id: 'file-uuid' };

      const errorMessage = 'Database error';
      fileService.getFileById.mockRejectedValue(new Error(errorMessage));

      await fileController.getFileById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: errorMessage,
      });
    });
  });

  describe('deleteFile', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: 'file-uuid' };

      await fileController.deleteFile(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should successfully delete a file', async () => {
      mockRequest.params = { id: 'file-uuid' };

      fileService.deleteFile.mockResolvedValue(true);

      await fileController.deleteFile(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(fileService.deleteFile).toHaveBeenCalledWith('file-uuid', 'user-uuid');

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'File deleted successfully',
      });
    });

    it('should return 404 when file is not found or user has no permission', async () => {
      mockRequest.params = { id: 'non-existent-uuid' };

      const errorMessage = 'File not found or you do not have permission to delete it';
      const error = new Error(errorMessage);
      fileService.deleteFile.mockRejectedValue(error);

      await fileController.deleteFile(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: errorMessage,
      });
    });

    it('should handle other errors and return 500', async () => {
      mockRequest.params = { id: 'file-uuid' };

      const errorMessage = 'Server error';
      fileService.deleteFile.mockRejectedValue(new Error(errorMessage));

      await fileController.deleteFile(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: errorMessage,
      });
    });
  });

  describe('getFilesByType', () => {
    it('should return 400 when file type is invalid', async () => {
      mockRequest.params = { type: 'invalid-type' };

      await fileController.getFilesByType(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid file type',
      });
    });

    it('should return files of a specific type', async () => {
      mockRequest.params = { type: FileType.IMAGE };

      const mockFiles = [
        {
          id: 'file-uuid-1',
          url: 'https://example.com/test1.jpg',
          type: FileType.IMAGE,
          filename: 'test1.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          providerType: 'cloudinary',
          providerPublicId: 'test-123',
          uploadedById: '1',
          uploadedAt: new Date(),
          uploadedBy: {
            id: 1,
            walletAddress: '0x123',
            name: 'Test User 1',
            email: 'test1@example.com',
            password: 'hashed_password',
            orders: [],
            userRoles: [],
          },
        },
        {
          id: 'file-uuid-2',
          url: 'https://example.com/test2.png',
          type: FileType.IMAGE,
          filename: 'test2.png',
          mimetype: 'image/png',
          size: 2048,
          providerType: 'cloudinary',
          providerPublicId: 'test-456',
          uploadedById: '2',
          uploadedAt: new Date(),
          uploadedBy: {
            id: 2,
            walletAddress: '0x456',
            name: 'Test User 2',
            email: 'test2@example.com',
            password: 'hashed_password',
            orders: [],
            userRoles: [],
          },
        },
      ] as unknown as File[];

      fileService.getFilesByType.mockResolvedValue(mockFiles);

      await fileController.getFilesByType(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(fileService.getFilesByType).toHaveBeenCalledWith(FileType.IMAGE);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockFiles,
      });
    });

    it('should handle errors and return 500', async () => {
      mockRequest.params = { type: FileType.DOCUMENT };

      const errorMessage = 'Database error';
      fileService.getFilesByType.mockRejectedValue(new Error(errorMessage));

      await fileController.getFilesByType(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: errorMessage,
      });
    });
  });
});
