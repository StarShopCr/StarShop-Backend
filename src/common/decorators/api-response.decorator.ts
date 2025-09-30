import { applyDecorators, Type } from '@nestjs/common';
import { ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { GlobalSuccessResponse, GlobalErrorResponse } from '../../types/global-response.type';

/**
 * Custom decorator for successful responses that includes global format
 * @param status - HTTP status code
 * @param description - Response description
 * @param model - Data model (optional)
 * @param isArray - Whether response is an array
 */
export function ApiSuccessResponse(
  status: number,
  description: string,
  model?: Type<unknown>,
  isArray = false
): MethodDecorator {
  const schema = model
    ? {
        allOf: [
          { $ref: getSchemaPath(GlobalSuccessResponse) },
          {
            properties: {
              data: isArray
                ? {
                    type: 'array',
                    items: { $ref: getSchemaPath(model) },
                  }
                : { $ref: getSchemaPath(model) },
            },
          },
        ],
      }
    : { $ref: getSchemaPath(GlobalSuccessResponse) };

  return applyDecorators(
    ApiResponse({
      status,
      description,
      schema,
    })
  );
}

/**
 * Custom decorator for error responses that includes global format
 * @param status - HTTP status code
 * @param description - Error description
 */
export function ApiErrorResponse(status: number, description: string): MethodDecorator {
  return applyDecorators(
    ApiResponse({
      status,
      description,
      schema: { $ref: getSchemaPath(GlobalErrorResponse) },
    })
  );
}

/**
 * Decorator for authentication responses that include token
 * @param status - HTTP status code
 * @param description - Response description
 * @param model - Data model
 */
export function ApiAuthResponse(
  status: number,
  description: string,
  model: Type<unknown>
): MethodDecorator {
  return applyDecorators(
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(GlobalSuccessResponse) },
          {
            properties: {
              token: {
                type: 'string',
                description: 'JWT token for authentication',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
              data: { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    })
  );
}
