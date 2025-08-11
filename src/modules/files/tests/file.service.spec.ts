import { FileService } from '../services/file.service';
import { Repository } from 'typeorm';
import { File, FileType } from '../entities/file.entity';
import AppDataSource from '../../../config/ormconfig';
import { cloudinary } from '../config/cloudinary.config';
import { s3Client } from '../config/s3.config';
// import { DeleteObjectCommand } from '@aws-sdk/client-s3';

interface ExtendedMulterFile extends Express.Multer.File {
  location?: string;
  key?: string;
}

// Mock external dependencies
jest.mock('../../../config/ormconfig', () => ({ getRepository: jest.fn() }));

jest.mock('../config/cloudinary.config', () => ({
  cloudinary: { uploader: { destroy: jest.fn() } },
}));

jest.mock('../config/s3.config', () => ({ s3Client: { send: jest.fn() } }));

jest.mock('@aws-sdk/client-s3', () => ({
  DeleteObjectCommand: jest.fn().mockImplementation((params) => ({ ...params })),
}));

describe('FileService', () => {
  let fileService: FileService;
  let fileRepository: jest.Mocked<Repository<File>>;

  beforeEach(() => {
    jest.clearAllMocks();

    fileRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
    } as unknown as jest.Mocked<Repository<File>>;

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(fileRepository);
    fileService = new FileService();
  });

  describe('uploadFile', () => {
    it('should upload a file to Cloudinary and save its metadata', async () => {
      const mockUser = {
        id: 1,
        walletAddress: '0x123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        location: 'Test City',
        country: 'Test Country',
        buyerData: {},
        sellerData: null,
        orders: [],
        userRoles: [],
        notifications: [],
        wishlist: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        path: 'https://res.cloudinary.com/demo/image/upload/test.jpg',
        filename: 'images/1683045624-test',
      } as ExtendedMulterFile;

      const createdFile = {
        id: 'uuid',
        url: mockFile.path,
        type: FileType.IMAGE,
        filename: mockFile.originalname,
        mimetype: mockFile.mimetype,
        size: mockFile.size,
        providerType: 'cloudinary',
        providerPublicId: mockFile.filename,
        uploadedById: '1',
        uploadedAt: new Date(),
        uploadedBy: mockUser,
      } as File;

      fileRepository.create.mockReturnValue(createdFile);
      fileRepository.save.mockResolvedValue(createdFile);

      const result = await fileService.uploadFile(mockFile, 1, 'cloudinary', FileType.IMAGE);

      expect(fileRepository.create).toHaveBeenCalledWith({
        url: mockFile.path,
        type: FileType.IMAGE,
        filename: mockFile.originalname,
        mimetype: mockFile.mimetype,
        size: mockFile.size,
        providerType: 'cloudinary',
        providerPublicId: mockFile.filename,
        uploadedById: '1',
      });

      expect(result).toEqual(createdFile);
    });

    it('should upload a file to S3 and save its metadata', async () => {
      const mockUser = {
        id: 1,
        walletAddress: '0x123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        location: 'Test City',
        country: 'Test Country',
        buyerData: {},
        sellerData: null,
        orders: [],
        userRoles: [],
        notifications: [],
        wishlist: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockFile = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 2048,
        location: 'https://bucket.s3.amazonaws.com/documents/doc.pdf',
        key: 'documents/doc.pdf',
      } as ExtendedMulterFile;

      const createdFile = {
        id: 'uuid',
        url: mockFile.location!,
        type: FileType.DOCUMENT,
        filename: mockFile.originalname,
        mimetype: mockFile.mimetype,
        size: mockFile.size,
        providerType: 's3',
        providerPublicId: mockFile.key!,
        uploadedById: '1',
        uploadedAt: new Date(),
        uploadedBy: mockUser,
      } as File;

      fileRepository.create.mockReturnValue(createdFile);
      fileRepository.save.mockResolvedValue(createdFile);

      const result = await fileService.uploadFile(mockFile, 1, 's3', FileType.DOCUMENT);

      expect(fileRepository.create).toHaveBeenCalledWith({
        url: mockFile.location,
        type: FileType.DOCUMENT,
        filename: mockFile.originalname,
        mimetype: mockFile.mimetype,
        size: mockFile.size,
        providerType: 's3',
        providerPublicId: mockFile.key,
        uploadedById: '1',
      });

      expect(result).toEqual(createdFile);
    });
  });

  describe('getFileById', () => {
    it('should return the file if found', async () => {
      const mockUser = {
        id: 1,
        walletAddress: '0x123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        location: 'Test City',
        country: 'Test Country',
        buyerData: {},
        sellerData: null,
        orders: [],
        userRoles: [],
        notifications: [],
        wishlist: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockFile = {
        id: 'uuid',
        uploadedById: '1',
        uploadedBy: mockUser,
        url: 'https://example.com/test.jpg',
        type: FileType.IMAGE,
        filename: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        providerType: 'cloudinary',
        providerPublicId: 'public-id',
        uploadedAt: new Date(),
      } as unknown as File;

      fileRepository.findOne.mockResolvedValue(mockFile);

      const result = await fileService.getFileById('uuid');

      expect(fileRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid' },
        relations: ['uploadedBy'],
      });

      expect(result).toEqual(mockFile);
    });

    it('should return undefined if not found', async () => {
      fileRepository.findOne.mockResolvedValue(undefined);

      const result = await fileService.getFileById('uuid');

      expect(result).toBeUndefined();
    });
  });

  describe('getUserFiles', () => {
    it("should return user's files", async () => {
      const mockUser = {
        id: 1,
        walletAddress: '0x123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        location: 'Test City',
        country: 'Test Country',
        buyerData: {},
        sellerData: null,
        orders: [],
        userRoles: [],
        notifications: [],
        wishlist: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockFiles = [
        {
          id: 'f1',
          uploadedById: '1',
          uploadedBy: mockUser,
          url: 'https://example.com/test.jpg',
          type: FileType.IMAGE,
          filename: 'test.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          providerType: 'cloudinary',
          providerPublicId: 'public-id',
          uploadedAt: new Date(),
        },
        {
          id: 'f2',
          uploadedById: '1',
          uploadedBy: mockUser,
          url: 'https://example.com/test.pdf',
          type: FileType.DOCUMENT,
          filename: 'test.pdf',
          mimetype: 'application/pdf',
          size: 2048,
          providerType: 's3',
          providerPublicId: 'public-id',
          uploadedAt: new Date(),
        },
      ] as File[];

      fileRepository.find.mockResolvedValue(mockFiles);

      const result = await fileService.getUserFiles(1);

      expect(fileRepository.find).toHaveBeenCalledWith({
        where: { uploadedById: '1' },
        order: { uploadedAt: 'DESC' },
      });

      expect(result).toEqual(mockFiles);
    });

    it('should return an empty array when no files', async () => {
      fileRepository.find.mockResolvedValue([]);

      const result = await fileService.getUserFiles(1);

      expect(result).toEqual([]);
    });
  });

  describe('deleteFile', () => {
    it('should delete a cloudinary file if owned by user', async () => {
      const mockUser = {
        id: 1,
        walletAddress: '0x123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        location: 'Test City',
        country: 'Test Country',
        buyerData: {},
        sellerData: null,
        orders: [],
        userRoles: [],
        notifications: [],
        wishlist: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockFile = {
        id: 'uuid',
        providerType: 'cloudinary',
        providerPublicId: 'public-id',
        uploadedById: '1',
        uploadedBy: mockUser,
        url: 'https://example.com/test.jpg',
        type: FileType.IMAGE,
        filename: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        uploadedAt: new Date(),
      } as unknown as File;

      fileRepository.findOne.mockResolvedValue(mockFile);
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });
      fileRepository.remove.mockResolvedValue(mockFile);

      const result = await fileService.deleteFile('uuid', 1);

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('public-id');
      expect(fileRepository.remove).toHaveBeenCalledWith(mockFile);
      expect(result).toBe(true);
    });

    it('should delete an s3 file if owned by user', async () => {
      const mockUser = {
        id: 1,
        walletAddress: '0x123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        location: 'Test City',
        country: 'Test Country',
        buyerData: {},
        sellerData: null,
        orders: [],
        userRoles: [],
        notifications: [],
        wishlist: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockFile = {
        id: 'uuid',
        providerType: 's3',
        providerPublicId: 'public-id',
        uploadedById: '1',
        uploadedBy: mockUser,
        url: 'https://example.com/test.pdf',
        type: FileType.DOCUMENT,
        filename: 'test.pdf',
        mimetype: 'application/pdf',
        size: 2048,
        uploadedAt: new Date(),
      } as unknown as File;

      fileRepository.findOne.mockResolvedValue(mockFile);
      fileRepository.remove.mockResolvedValue(mockFile);
      (s3Client.send as jest.Mock).mockResolvedValue({});

      const result = await fileService.deleteFile('uuid', 1);

      expect(s3Client.send).toHaveBeenCalledWith(expect.objectContaining({ Key: 'public-id' }));

      expect(fileRepository.remove).toHaveBeenCalledWith(mockFile);
      expect(result).toBe(true);
    });

    it('should return false if file does not exist or is unauthorized', async () => {
      fileRepository.findOne.mockResolvedValue(undefined);

      const result = await fileService.deleteFile('uuid', 2);

      expect(result).toBe(false);
    });
  });
});
