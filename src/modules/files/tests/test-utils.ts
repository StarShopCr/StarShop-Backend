// Mock user for testing
export const mockUser = {
  id: 1,
  walletAddress: '0x123456789abcdef',
  name: 'Test User',
  email: 'test@example.com',
};

// Helper function to create mock file objects for testing
export const mockFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => {
  return {
    fieldname: 'file',
    originalname: overrides.originalname || 'test-file.jpg',
    encoding: '7bit',
    mimetype: overrides.mimetype || 'image/jpeg',
    size: overrides.size || 1024,
    destination: '/tmp/uploads',
    filename: overrides.filename || 'random-filename',
    path: overrides.path || '/tmp/uploads/random-filename',
    buffer: Buffer.from('test'),
    stream: {} as any,
  };
};
