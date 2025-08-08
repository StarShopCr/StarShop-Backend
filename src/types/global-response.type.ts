import { ApiProperty } from '@nestjs/swagger';

export class GlobalSuccessResponse<T = any> {
  @ApiProperty({
    description: 'Success status',
    example: true
  })
  success: true;

  @ApiProperty({
    description: 'JWT token (only included in auth responses)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false
  })
  token?: string;

  @ApiProperty({
    description: 'Response data'
  })
  data: T;
}

export class GlobalErrorResponse {
  @ApiProperty({
    description: 'Success status',
    example: false
  })
  success: false;

  @ApiProperty({
    description: 'Error message',
    example: 'Invalid request parameters'
  })
  message: string;

  @ApiProperty({
    description: 'Error stack trace (only in development)',
    example: 'Error: Invalid request\n    at ...',
    required: false
  })
  error?: string;

  @ApiProperty({
    description: 'Error timestamp (only in development)',
    example: '2024-01-01T00:00:00.000Z',
    required: false
  })
  timestamp?: string;
}

export type GlobalResponse<T = any> = GlobalSuccessResponse<T> | GlobalErrorResponse;

// Helper types for common response patterns
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}

export interface SingleItemResponse<T> {
  item: T;
}

// Utility type for extracting data type from GlobalResponse
export type ExtractData<T> = T extends GlobalSuccessResponse<infer U> ? U : never;
