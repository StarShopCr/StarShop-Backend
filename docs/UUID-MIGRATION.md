# UUID Migration and walletAddress as Primary Identifier

## Overview

This document outlines the migration from numeric IDs to UUIDs and the transition to using `walletAddress` as the primary identifier for all public API interactions.

## Security Benefits

- **Prevents ID enumeration attacks**: UUIDs are not sequential and cannot be easily guessed
- **Eliminates scraping vulnerabilities**: Public endpoints no longer expose internal database IDs
- **Enhanced privacy**: Users are identified by their blockchain wallet address instead of arbitrary numbers

## Changes Made

### 1. Database Schema Changes

#### User Table
- `id` column changed from `SERIAL` to `UUID` with auto-generation
- `walletAddress` column now has a unique index for performance
- Foreign key relationships updated to use UUID

#### Related Tables
- `user_roles.userId` → `UUID`
- `buyer_requests.userId` → `UUID`
- `reviews.userId` → `UUID`
- `carts.user_id` → Already `UUID` (compatible)
- `orders.user_id` → Already `UUID` (compatible)

### 2. API Endpoint Changes

#### Before (using numeric ID)
```
PUT /users/update/:id
GET /users/:id
```

#### After (using walletAddress)
```
PUT /users/update/:walletAddress
GET /users/:walletAddress
```

### 3. Entity Updates

#### User Entity
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string; // Now UUID

  @Column({ unique: true })
  @Index()
  walletAddress: string; // Primary identifier for API
}
```

#### Related Entities
- `UserRole.userId`: `string` (UUID)
- `BuyerRequest.userId`: `string` (UUID)
- `Review.userId`: `string` (UUID)

### 4. Service Layer Changes

#### UserService
- `updateUser(walletAddress: string, data)` instead of `updateUser(id: string, data)`
- `getUserByWalletAddress(walletAddress: string)` for public operations
- `getUserById(id: string)` retained for internal use only

#### AuthService
- JWT tokens now include `walletAddress` as primary identifier
- `updateUser(walletAddress: string, data)` method updated
- Role assignment methods updated to use `walletAddress`

### 5. Controller Updates

#### UserController
- All public endpoints now use `walletAddress` parameter
- Response objects no longer include `id` field
- Authorization checks use `walletAddress` for user identification

#### Authentication Flow
- JWT strategy updated to handle both `walletAddress` and `id` (backward compatibility)
- Request objects use `walletAddress` for user identification

## Migration Process

### 1. Database Migration
```bash
# Run migrations in order
npm run typeorm migration:run -- -d src/config/database.ts
```

### 2. Data Migration
- Existing numeric IDs are converted to UUIDs
- Foreign key relationships are updated
- Data integrity is maintained throughout the process

### 3. Application Updates
- All services updated to use `walletAddress` as primary identifier
- Controllers updated to handle new parameter structure
- Tests updated to verify new behavior

## API Response Format

### Before
```json
{
  "success": true,
  "data": {
    "id": 123,
    "walletAddress": "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### After
```json
{
  "success": true,
  "data": {
    "walletAddress": "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

## Backward Compatibility

### JWT Tokens
- Tokens with `id` field continue to work during migration
- New tokens use `walletAddress` as primary identifier
- JWT strategy handles both formats

### Internal Operations
- `id` field retained for database relationships
- Internal services can still use `getUserById()` method
- External APIs exclusively use `walletAddress`

## Testing

### Unit Tests
- `src/modules/users/tests/user-update-api.spec.ts` - Comprehensive API testing
- Verifies all CRUD operations work with `walletAddress`
- Ensures UUID `id` is not exposed in responses

### Integration Tests
- End-to-end testing of user update flows
- Authentication and authorization verification
- Database migration validation

## Validation

### walletAddress Format
- Stellar wallet addresses: `^G[A-Z2-7]{55}$`
- Ethereum addresses: `^0x[a-fA-F0-9]{40}$`
- Format validation in DTOs and services

### Error Handling
- Invalid `walletAddress` format returns 400 Bad Request
- Duplicate `walletAddress` returns 409 Conflict
- User not found returns 404 Not Found

## Performance Considerations

### Indexing
- `walletAddress` column has unique index
- Foreign key relationships optimized for UUID lookups
- Query performance maintained through proper indexing

### Caching
- JWT tokens include `walletAddress` for fast user resolution
- Database queries optimized for `walletAddress` lookups

## Security Considerations

### Access Control
- Users can only access their own profiles using `walletAddress`
- Admin users can access any profile
- Role-based access control maintained

### Data Exposure
- Internal UUIDs never exposed to clients
- All public endpoints use `walletAddress` identifier
- Sensitive information properly protected

## Rollback Plan

### Database Rollback
```bash
# Revert migrations if needed
npm run typeorm migration:revert -- -d src/config/database.ts
```

### Application Rollback
- Revert entity changes
- Restore original controller methods
- Update service layer to use numeric IDs

## Future Enhancements

### Multi-Chain Support
- Support for different blockchain wallet formats
- Wallet address validation per blockchain type
- Cross-chain user identification

### Enhanced Security
- Wallet signature verification for critical operations
- Multi-factor authentication integration
- Rate limiting per wallet address

## Conclusion

This migration significantly enhances the security posture of the StarShop backend by:

1. **Eliminating ID enumeration vulnerabilities**
2. **Using blockchain-native identifiers**
3. **Maintaining backward compatibility**
4. **Improving API security**

The transition to `walletAddress` as the primary identifier aligns with blockchain-first architecture while maintaining all existing functionality.
