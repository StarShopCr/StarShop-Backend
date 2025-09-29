// test/setup-multer-mocks.ts
// CommonJS-style exports so both `require('multer')` and ESM default work

jest.mock('multer', () => {
  const multer = function (_opts?: any) {
    return {
      single: () => (_req: any, _res: any, next: any) => next(),
      array: () => (_req: any, _res: any, next: any) => next(),
      fields: () => (_req: any, _res: any, next: any) => next(),
      none: () => (_req: any, _res: any, next: any) => next(),
    };
  };
  (multer as any).diskStorage = () => ({});
  return multer; // <-- export a FUNCTION (CJS), not { default: fn }
});

jest.mock('multer-s3', () => {
  const multerS3 = function (_opts?: any) {
    return {
      _handleFile(_req: any, _file: any, cb: any) {
        cb(null, { key: 'mock-key', location: 'https://mock.s3/url' });
      },
      _removeFile(_req: any, _file: any, cb: any) {
        cb(null);
      },
    };
  };
  (multerS3 as any).AUTO_CONTENT_TYPE = 'auto/mock';
  return multerS3; // <-- export a FUNCTION (CJS)
});
