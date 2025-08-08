# Global Response Format System

## Description

A global response interceptor system has been implemented to standardize all API responses across the StarShop application. This ensures consistency in frontend integration, enforces a clear API contract, and standardizes success/error messaging.

## Response Structure

### Successful Responses

All successful responses follow this format:

```json
{
  "success": true,
  "token": "jwt-token", // only if exists (auth responses)
  "data": {
    // controller response data
  }
}
```

### Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Stack trace (development only)",
  "timestamp": "2024-01-01T00:00:00.000Z (development only)"
}
```

## Implemented Components

### 1. ResponseInterceptor

**Location**: `src/common/interceptors/response.interceptor.ts`

Intercepts all successful responses and formats them automatically:

- Wraps data in `{ success: true, data: ... }`
- Includes token if available in `res.locals.token`
- Preserves responses that already have standard format

### 2. HttpExceptionFilter

**Location**: `src/common/filters/http-exception.filter.ts`

Handles all exceptions and formats them consistently:

- Structure: `{ success: false, message: ... }`
- Includes additional information in development
- Maintains appropriate HTTP status codes

### 3. Response Utilities

**Location**: `src/common/utils/response.utils.ts`

Helper functions for handling tokens:

```typescript
import { setToken, clearToken } from '../common/utils/response.utils';

// Set token
setToken(res, token, { maxAge: 3600000 });

// Clear token
clearToken(res);
```

### 4. TypeScript Types

**Location**: `src/types/global-response.type.ts`

Types for global responses:

```typescript
import { GlobalSuccessResponse, GlobalErrorResponse } from '../types/global-response.type';
```

## Usage in Controllers

### Existing Controllers

Controllers that already return `{ success: true, data: ... }` will work automatically with the interceptor.

### New Controllers

For new controllers, simply return data directly:

```typescript
@Get()
async getProducts() {
  const products = await this.productService.findAll();
  return products; // Interceptor will wrap automatically
}
```

### Authentication Responses

For authentication endpoints that need to include token:

```typescript
@Post('login')
async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
  const result = await this.authService.login(loginDto);
  
  // Use helper to set token
  setToken(res, result.token);
  
  return {
    user: result.user,
    expiresIn: result.expiresIn
  };
}
```

## Swagger Decorators

**Location**: `src/common/decorators/api-response.decorator.ts`

Custom decorators for Swagger documentation:

```typescript
import { ApiSuccessResponse, ApiErrorResponse, ApiAuthResponse } from '../common/decorators/api-response.decorator';

@ApiSuccessResponse(200, 'Products retrieved successfully', ProductDto, true)
@ApiErrorResponse(400, 'Invalid parameters')
async getProducts() {
  // ...
}

@ApiAuthResponse(200, 'Login successful', AuthResponseDto)
async login() {
  // ...
}
```

## Global Configuration

The interceptor and filter are configured globally in `src/main.ts`:

```typescript
// Global response interceptor
app.useGlobalInterceptors(new ResponseInterceptor());

// Global exception filter
app.useGlobalFilters(new HttpExceptionFilter());
```

## Controller Migration

### Before
```typescript
return { success: true, data: products };
```

### After
```typescript
return products; // Interceptor handles automatically
```

### For Authentication Responses

#### Before
```typescript
res.cookie('token', token, { httpOnly: true, secure: true });
return { success: true, data: user };
```

#### After
```typescript
setToken(res, token);
return { user };
```

## Benefits

1. **Consistency**: All responses follow the same format
2. **Simplicity**: Controllers can return data directly
3. **Maintainability**: Changes made in one place
4. **Documentation**: Swagger automatically reflects global format
5. **Frontend**: Simpler integration with client

## Testing

To test the interceptor:

```typescript
// Interceptor should wrap this:
return { name: 'Product' };

// Into:
{
  "success": true,
  "data": { "name": "Product" }
}
```

## Important Notes

- The interceptor preserves responses that already have `success: true`
- Tokens are automatically included if available in `res.locals.token`
- In development, errors include stack trace and timestamp
- HTTP status codes are maintained appropriately
