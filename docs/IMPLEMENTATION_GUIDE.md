# StarShop Backend - User Registration Implementation Guide

## Overview

This document provides a comprehensive guide to the user registration system implemented in the StarShop backend. The system supports both buyer and seller registration with role-specific data validation and enhanced user profile fields.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Validation Rules](#validation-rules)
5. [Implementation Details](#implementation-details)
6. [Testing Strategy](#testing-strategy)
7. [Migration Guide](#migration-guide)
8. [Troubleshooting](#troubleshooting)

## Architecture Overview

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Controller    │    │   Service       │    │   Repository    │
│   (Validation)  │───▶│   (Business     │───▶│   (Database)    │
│                 │    │    Logic)       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DTOs         │    │   Entities      │    │   Migrations    │
│   (Input/      │    │   (Data Model)  │    │   (Schema       │
│    Output)     │    │                 │    │    Changes)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Features

- **Role-based Registration**: Support for buyer and seller roles
- **Enhanced User Profile**: Location, country, and role-specific data
- **Strict Validation**: Prevents cross-role data mixing
- **Flexible Data Storage**: JSON fields for customizable role data
- **Backward Compatibility**: Maintains existing user_roles structure

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE,
  name VARCHAR,
  wallet_address VARCHAR UNIQUE NOT NULL,
  location VARCHAR,                    -- NEW FIELD
  country VARCHAR,                     -- NEW FIELD
  buyer_data JSONB,                   -- NEW FIELD
  seller_data JSONB,                  -- NEW FIELD
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### User Roles Table (Existing)

```sql
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  role_id INTEGER REFERENCES roles(id)
);
```

### Roles Table (Existing)

```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR UNIQUE CHECK (name IN ('buyer', 'seller', 'admin'))
);
```

## API Endpoints

### User Registration

**Endpoint:** `POST /api/v1/users`

**Request Body:**
```json
{
  "walletAddress": "G...",
  "role": "buyer" | "seller",
  "name": "string (optional)",
  "email": "string (optional)",
  "location": "string (optional)",
  "country": "string (optional)",
  "buyerData": "object (required for buyer)",
  "sellerData": "object (required for seller)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "walletAddress": "G...",
      "name": "string",
      "email": "string",
      "role": "buyer" | "seller",
      "location": "string",
      "country": "string",
      "buyerData": "object | null",
      "sellerData": "object | null"
    },
    "expiresIn": 3600
  }
}
```

### User Update

**Endpoint:** `PUT /api/v1/users/update/:id`

**Request Body:** Same as registration but all fields optional

### User Retrieval

**Endpoint:** `GET /api/v1/users/:id`

**Response:** Same structure as registration response

## Validation Rules

### Required Fields

- `walletAddress`: Must be valid Stellar wallet address (G + 55 characters)
- `role`: Must be either "buyer" or "seller"
- `buyerData`: Required for buyer role, must be object
- `sellerData`: Required for seller role, must be object

### Role-Specific Validation

#### Buyers
- ✅ Can have: `buyerData` (required)
- ❌ Cannot have: `sellerData`
- ✅ Optional: `name`, `email`, `location`, `country`

#### Sellers
- ✅ Can have: `sellerData` (required)
- ❌ Cannot have: `buyerData`
- ✅ Optional: `name`, `email`, `location`, `country`

### Field Validation

- **walletAddress**: Regex pattern `^G[A-Z2-7]{55}$`
- **email**: Valid email format (if provided)
- **name**: 2-50 characters (if provided)
- **location**: Max 100 characters (if provided)
- **country**: Max 100 characters (if provided)
- **buyerData**: Must be valid JSON object
- **sellerData**: Must be valid JSON object

## Implementation Details

### Custom Validator

We implemented a custom validator `@IsRoleSpecificData` that ensures:

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

### Service Layer Validation

Additional validation in the service layer:

```typescript
// Validate role-specific data
if (data.role === 'buyer' && data.buyerData === undefined) {
  throw new BadRequestError('Buyer data is required for buyer role');
}
if (data.role === 'seller' && data.sellerData === undefined) {
  throw new BadRequestError('Seller data is required for seller role');
}

// Validate that buyers can't have seller data and sellers can't have buyer data
if (data.role === 'buyer' && data.sellerData !== undefined) {
  throw new BadRequestError('Buyers cannot have seller data');
}
if (data.role === 'seller' && data.buyerData !== undefined) {
  throw new BadRequestError('Sellers cannot have buyer data');
}
```

### Data Flow

1. **Request Received** → Controller
2. **DTO Validation** → Custom validators run
3. **Service Layer** → Business logic validation
4. **Database** → Data persistence
5. **Response** → User data with JWT token

## Testing Strategy

### Test Coverage

We've implemented comprehensive testing across multiple layers:

#### 1. DTO Validation Tests (`dto-validation.spec.ts`)
- ✅ Valid DTOs with all combinations
- ❌ Invalid DTOs with role-specific data violations
- ❌ Missing required fields
- ❌ Invalid field formats

#### 2. Service Layer Tests (`role-validation.spec.ts`)
- ✅ Valid registration scenarios
- ❌ Invalid registration scenarios
- ❌ Cross-role data violations

#### 3. Controller Tests (`user-registration.spec.ts`)
- ✅ End-to-end registration flow
- ✅ Response format validation
- ✅ Error handling
- ✅ Cookie setting

#### 4. Integration Tests
- ✅ Database operations
- ✅ Role assignment
- ✅ JWT token generation

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- user-registration.spec.ts

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

## Migration Guide

### Database Migration

The migration `1751199237000-AddUserFields.ts` adds new columns:

```sql
-- Add new columns to users table
ALTER TABLE "users" 
ADD COLUMN "location" character varying,
ADD COLUMN "country" character varying,
ADD COLUMN "buyerData" jsonb,
ADD COLUMN "sellerData" jsonb;
```

### Running Migrations

```bash
# Run migrations
npm run migration:run

# Revert migrations
npm run migration:revert

# Generate new migration
npm run migration:generate -- -n MigrationName
```

### Data Migration Strategy

1. **Backup existing data**
2. **Run migration**
3. **Update existing users** (if needed)
4. **Verify data integrity**

## Troubleshooting

### Common Issues

#### 1. Validation Errors

**Problem:** "buyerData is only allowed for buyers"
**Solution:** Ensure the role matches the data being sent

**Problem:** "Invalid Stellar wallet address format"
**Solution:** Check wallet address starts with 'G' and is 56 characters

#### 2. Database Errors

**Problem:** JSONB column errors
**Solution:** Ensure data is valid JSON object

**Problem:** Constraint violations
**Solution:** Check role values match enum constraints

#### 3. Test Failures

**Problem:** Mock service not working
**Solution:** Verify mock setup and return values

**Problem:** Validation errors in tests
**Solution:** Check DTO instantiation and field assignment

### Debug Mode

Enable debug logging:

```typescript
// In main.ts or config
process.env.DEBUG = 'true';
```

### Logging

Check application logs for detailed error information:

```bash
tail -f logs/error.log
```

## Best Practices

### 1. Data Validation
- Always validate at DTO level first
- Use custom validators for complex business rules
- Provide clear error messages

### 2. Error Handling
- Use specific error types (BadRequestError, UnauthorizedError)
- Log errors with context
- Return user-friendly error messages

### 3. Testing
- Test both valid and invalid scenarios
- Mock external dependencies
- Use descriptive test names
- Maintain high test coverage

### 4. Security
- Validate all input data
- Use JWT tokens for authentication
- Implement role-based access control
- Sanitize user data before storage

## Future Enhancements

### Potential Improvements

1. **Enhanced Validation**
   - Custom buyerData/sellerData schemas
   - Field-level validation rules
   - Conditional field requirements

2. **Data Enrichment**
   - Address validation
   - Country code standardization
   - Phone number validation

3. **Performance**
   - Database indexing on new fields
   - Query optimization
   - Caching strategies

4. **Monitoring**
   - Registration metrics
   - Validation failure tracking
   - Performance monitoring

## Conclusion

This implementation provides a robust, scalable user registration system with:

- ✅ **Comprehensive validation** at multiple layers
- ✅ **Role-based data management** with strict rules
- ✅ **Flexible data storage** for future extensibility
- ✅ **Thorough testing** coverage
- ✅ **Clear documentation** for developers

The system is production-ready and follows NestJS best practices while maintaining backward compatibility with existing functionality.
