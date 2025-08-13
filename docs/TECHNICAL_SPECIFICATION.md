# StarShop Backend - Technical Specification

## Overview

This document provides the technical details of the user registration system implementation, including code structure, validation logic, database design, and API specifications.

## Table of Contents

1. [Code Architecture](#code-architecture)
2. [Database Design](#database-design)
3. [API Specifications](#api-specifications)
4. [Validation Implementation](#validation-implementation)
5. [Error Handling](#error-handling)
6. [Security Considerations](#security-considerations)
7. [Performance Considerations](#performance-considerations)
8. [Testing Implementation](#testing-implementation)

## Code Architecture

### File Structure

```
src/
├── modules/
│   ├── users/
│   │   ├── entities/
│   │   │   └── user.entity.ts          # User entity with new fields
│   │   ├── controllers/
│   │   │   └── user.controller.ts      # Registration endpoints
│   │   ├── services/
│   │   │   └── user.service.ts         # User business logic
│   │   └── tests/
│   │       └── user-registration.spec.ts
│   └── auth/
│       ├── dto/
│       │   └── auth.dto.ts             # DTOs with custom validation
│       ├── services/
│       │   └── auth.service.ts         # Authentication logic
│       └── tests/
│           ├── role-validation.spec.ts
│           └── dto-validation.spec.ts
├── types/
│   ├── role.ts                         # Role enum definitions
│   └── auth-request.type.ts            # Request type definitions
├── migrations/
│   └── 1751199237000-AddUserFields.ts  # Database migration
└── docs/
    ├── user-registration.md             # API documentation
    ├── IMPLEMENTATION_GUIDE.md          # Implementation guide
    └── TECHNICAL_SPECIFICATION.md       # This document
```

### Class Dependencies

```typescript
// User Controller depends on:
UserController → UserService
UserController → AuthService

// User Service depends on:
UserService → UserRepository
UserService → RoleRepository
UserService → UserRoleRepository

// Auth Service depends on:
AuthService → UserRepository
AuthService → RoleRepository
AuthService → UserRoleRepository
AuthService → JwtService
```

## Database Design

### Entity Relationships

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ unique: true })
  walletAddress: string;

  // NEW FIELDS
  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ type: 'json', nullable: true })
  buyerData?: any;

  @Column({ type: 'json', nullable: true })
  sellerData?: any;

  // RELATIONSHIPS
  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => Wishlist, (wishlist) => wishlist.user)
  wishlist: Wishlist[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Database Migration

```sql
-- Migration: 1751199237000-AddUserFields.ts
ALTER TABLE "users" 
ADD COLUMN "location" character varying,
ADD COLUMN "country" character varying,
ADD COLUMN "buyerData" jsonb,
ADD COLUMN "sellerData" jsonb;
```

### Data Types

- **location**: VARCHAR (max 100 characters)
- **country**: VARCHAR (max 100 characters)
- **buyerData**: JSONB (PostgreSQL JSON Binary)
- **sellerData**: JSONB (PostgreSQL JSON Binary)

### Indexing Strategy

```sql
-- Consider adding indexes for performance
CREATE INDEX idx_users_location ON users(location);
CREATE INDEX idx_users_country ON users(country);
CREATE INDEX idx_users_buyer_data ON users USING GIN(buyerData);
CREATE INDEX idx_users_seller_data ON users USING GIN(sellerData);
```

## API Specifications

### Request/Response Models

#### RegisterUserDto

```typescript
export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^G[A-Z2-7]{55}$/)
  walletAddress: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(buyer|seller)$/)
  role: 'buyer' | 'seller';

  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsRoleSpecificData({ message: 'buyerData is only allowed for buyers' })
  @IsObject()
  @IsOptional()
  buyerData?: any;

  @IsRoleSpecificData({ message: 'sellerData is only allowed for sellers' })
  @IsObject()
  @IsOptional()
  sellerData?: any;
}
```

#### UserResponse

```typescript
interface UserResponse {
  id: number;
  walletAddress: string;
  name: string;
  email: string;
  role: string;
  location?: string;
  country?: string;
  buyerData?: any;
  sellerData?: any;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### HTTP Status Codes

- **200 OK**: Successful GET/PUT operations
- **201 Created**: Successful user registration
- **400 Bad Request**: Validation errors, missing required fields
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **500 Internal Server Error**: Server-side errors

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

## Validation Implementation

### Custom Validator Architecture

```typescript
function IsRoleSpecificData(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isRoleSpecificData',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          const role = obj.role;
          
          if (propertyName === 'buyerData') {
            // buyerData is only allowed for buyers
            if (role !== 'buyer' && value !== undefined) {
              return false;
            }
          }
          
          if (propertyName === 'sellerData') {
            // sellerData is only allowed for sellers
            if (role !== 'seller' && value !== undefined) {
              return false;
            }
          }
          
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          if (args.property === 'buyerData') {
            return 'buyerData is only allowed for buyers';
          }
          if (args.property === 'sellerData') {
            return 'sellerData is only allowed for sellers';
          }
          return 'Invalid role-specific data';
        }
      }
    });
  };
}
```

### Validation Flow

1. **Input Validation**: DTO-level validation using class-validator
2. **Custom Validation**: Role-specific data validation
3. **Business Logic Validation**: Service-layer validation
4. **Database Constraints**: Database-level validation

### Validation Rules Matrix

| Field | Buyer Role | Seller Role | Validation |
|-------|------------|-------------|------------|
| walletAddress | ✅ Required | ✅ Required | Stellar format |
| role | ✅ Required | ✅ Required | Enum: buyer/seller |
| buyerData | ✅ Required | ❌ Forbidden | Object |
| sellerData | ❌ Forbidden | ✅ Required | Object |
| name | ⚪ Optional | ⚪ Optional | String (2-50) |
| email | ⚪ Optional | ⚪ Optional | Email format |
| location | ⚪ Optional | ⚪ Optional | String (max 100) |
| country | ⚪ Optional | ⚪ Optional | String (max 100) |

## Error Handling

### Error Types

```typescript
// Custom error classes
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
```

### Error Handling Strategy

1. **Validation Errors**: Caught at DTO level, return 400
2. **Business Logic Errors**: Caught at service level, return 400
3. **Authentication Errors**: Caught at guard level, return 401
4. **Authorization Errors**: Caught at guard level, return 403
5. **System Errors**: Caught at global level, return 500

### Error Logging

```typescript
// Log errors with context
logger.error('User registration failed', {
  walletAddress: data.walletAddress,
  role: data.role,
  error: error.message,
  stack: error.stack
});
```

## Security Considerations

### Input Validation

- **SQL Injection**: Prevented by TypeORM parameterized queries
- **XSS**: Input sanitization at DTO level
- **Data Validation**: Strict validation rules for all fields

### Authentication

- **JWT Tokens**: Secure token generation and validation
- **HttpOnly Cookies**: Prevents XSS token theft
- **Token Expiration**: Configurable token lifetime

### Authorization

- **Role-Based Access Control**: User roles determine permissions
- **Resource Ownership**: Users can only access their own data
- **Admin Override**: Admin users have elevated permissions

### Data Protection

- **Wallet Address**: Unique constraint prevents duplicate registrations
- **Email Validation**: Format and uniqueness validation
- **JSON Data**: Schema validation for buyerData/sellerData

## Performance Considerations

### Database Optimization

- **Indexing**: Strategic indexes on frequently queried fields
- **JSONB**: Efficient storage and querying of JSON data
- **Connection Pooling**: TypeORM connection management

### Caching Strategy

- **User Data**: Cache frequently accessed user information
- **Role Data**: Cache role definitions and permissions
- **Validation Results**: Cache validation results for repeated requests

### Query Optimization

- **Selective Loading**: Load only required fields
- **Relationship Loading**: Eager vs lazy loading strategies
- **Pagination**: Implement pagination for large datasets

## Testing Implementation

### Test Structure

```typescript
describe('User Registration', () => {
  describe('Valid Scenarios', () => {
    it('should register buyer successfully', async () => {
      // Test implementation
    });
  });

  describe('Invalid Scenarios', () => {
    it('should reject buyer with sellerData', async () => {
      // Test implementation
    });
  });
});
```

### Test Categories

1. **Unit Tests**: Individual function testing
2. **Integration Tests**: Service interaction testing
3. **Controller Tests**: API endpoint testing
4. **DTO Tests**: Validation logic testing

### Mock Strategy

```typescript
// Mock external dependencies
const mockAuthService = {
  registerWithWallet: jest.fn(),
  updateUser: jest.fn(),
};

// Mock database repositories
const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};
```

### Test Coverage Goals

- **Lines**: >90%
- **Functions**: >95%
- **Branches**: >85%
- **Statements**: >90%

## Configuration

### Environment Variables

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=starshop
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION_TIME=1h

# Server
PORT=3000
NODE_ENV=development
```

### Validation Configuration

```typescript
// Validation pipe configuration
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  })
);
```

## Monitoring and Logging

### Logging Strategy

```typescript
// Structured logging
logger.info('User registered successfully', {
  userId: user.id,
  walletAddress: user.walletAddress,
  role: user.role,
  timestamp: new Date().toISOString()
});
```

### Metrics Collection

- **Registration Success Rate**: Track successful vs failed registrations
- **Validation Error Rates**: Monitor validation failure patterns
- **Response Times**: Track API endpoint performance
- **Error Patterns**: Identify common error scenarios

### Health Checks

```typescript
// Health check endpoint
@Get('health')
async healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: await this.checkDatabaseConnection()
  };
}
```

## Deployment Considerations

### Environment Setup

1. **Development**: Local database, debug logging
2. **Staging**: Staging database, info logging
3. **Production**: Production database, error logging only

### Database Migration Strategy

1. **Backup**: Create database backup before migration
2. **Test**: Run migration on staging environment first
3. **Deploy**: Deploy to production during maintenance window
4. **Verify**: Confirm data integrity after migration

### Rollback Plan

1. **Database Rollback**: Revert migration if issues arise
2. **Code Rollback**: Deploy previous version if needed
3. **Data Recovery**: Restore from backup if necessary

## Conclusion

This technical specification provides a comprehensive overview of the user registration system implementation. The system is designed with:

- **Robust validation** at multiple layers
- **Secure authentication** and authorization
- **Scalable database design** with proper indexing
- **Comprehensive testing** strategy
- **Production-ready** error handling and logging
- **Clear documentation** for maintenance and extension

The implementation follows NestJS best practices and provides a solid foundation for future enhancements.
