import { Test, TestingModule } from '@nestjs/testing';
import { ResponseInterceptor } from './response.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResponseInterceptor],
    }).compile();

    interceptor = module.get<ResponseInterceptor>(ResponseInterceptor);
  });

  beforeEach(() => {
    // Mock ExecutionContext
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue({
          locals: {},
        }),
      }),
    } as any;

    // Mock CallHandler
    mockCallHandler = {
      handle: jest.fn(),
    } as any;
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should wrap simple data in success response', (done) => {
    const testData = { name: 'Test Product', price: 100 };
    mockCallHandler.handle = jest.fn().mockReturnValue(of(testData));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual({
          success: true,
          data: testData,
        });
        done();
      },
      error: done,
    });
  });

  it('should include token when available in res.locals', (done) => {
    const testData = { user: { id: 1, name: 'John' } };
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    
    mockCallHandler.handle = jest.fn().mockReturnValue(of(testData));
    mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
      getResponse: jest.fn().mockReturnValue({
        locals: { token: testToken },
      }),
    });

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual({
          success: true,
          token: testToken,
          data: testData,
        });
        done();
      },
      error: done,
    });
  });

  it('should preserve responses that already have success format', (done) => {
    const existingResponse = {
      success: true,
      data: { items: [] },
      message: 'Custom message',
    };
    
    mockCallHandler.handle = jest.fn().mockReturnValue(of(existingResponse));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual(existingResponse);
        done();
      },
      error: done,
    });
  });

  it('should handle array responses', (done) => {
    const testArray = [{ id: 1 }, { id: 2 }];
    mockCallHandler.handle = jest.fn().mockReturnValue(of(testArray));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual({
          success: true,
          data: testArray,
        });
        done();
      },
      error: done,
    });
  });

  it('should handle string responses', (done) => {
    const testString = 'Success message';
    mockCallHandler.handle = jest.fn().mockReturnValue(of(testString));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual({
          success: true,
          data: testString,
        });
        done();
      },
      error: done,
    });
  });

  it('should handle null responses', (done) => {
    mockCallHandler.handle = jest.fn().mockReturnValue(of(null));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual({
          success: true,
          data: null,
        });
        done();
      },
      error: done,
    });
  });

  it('should handle undefined responses', (done) => {
    mockCallHandler.handle = jest.fn().mockReturnValue(of(undefined));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual({
          success: true,
          data: undefined,
        });
        done();
      },
      error: done,
    });
  });
});
