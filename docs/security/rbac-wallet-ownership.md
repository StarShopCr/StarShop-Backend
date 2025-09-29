# RBAC + Wallet Ownership Security Implementation

This document describes the implementation of Issue 12: RBAC + Wallet Ownership security measures to prevent unauthorized contract calls in the StarShop Backend.

## 🎯 Objective

Secure routes and actions by ensuring that:
1. Only users with `seller` role can access seller-specific operations
2. `req.user.wallet` must match the `sellerWallet` for contract-triggering operations
3. Unauthorized users cannot trigger contract calls

## 🔐 Security Rules Implemented

### 1. Role-Based Access Control (RBAC)
- **Seller Role Required**: All seller-specific operations require authenticated users with `seller` role
- **Buyer Role Required**: All buyer-specific operations require authenticated users with `buyer` role
- **Proper HTTP Status Codes**: Non-sellers receive 403 Forbidden on seller routes

### 2. Wallet Ownership Validation
- **Wallet Address Matching**: Users can only perform operations using their own wallet address
- **Contract Call Protection**: All operations that could trigger blockchain transactions validate wallet ownership
- **Database Consistency**: Service-level validation ensures wallet addresses match user records

## 🛡️ Implementation Components

### Guards

#### 1. `WalletOwnershipGuard`
```typescript
// src/modules/auth/guards/wallet-ownership.guard.ts
@Injectable()
export class WalletOwnershipGuard implements CanActivate {
  // Validates that req.user.walletAddress matches expected wallet parameters
}
```

#### 2. Existing Guards Enhanced
- `JwtAuthGuard`: Handles authentication
- `RolesGuard`: Enforces role-based access control
- Combined usage: `@UseGuards(JwtAuthGuard, RolesGuard, WalletOwnershipGuard)`

### Decorators

#### 1. `@RequireWalletOwnership()`
```typescript
// Mark routes requiring wallet validation
@RequireWalletOwnership({ 
  walletField: 'sellerWallet', 
  source: 'body' 
})
```

#### 2. `@RequireSellerWallet()`
```typescript
// Shorthand for common seller wallet validation
@RequireSellerWallet()
```

### Service-Level Validation

#### Offers Service
```typescript
// Seller operations validation
private async validateSellerWalletOwnership(userId: number): Promise<void>
private async validateOfferOwnership(offerId: string, userId: number): Promise<Offer>

// Buyer operations validation  
private async validateBuyerWalletOwnership(offerId: string, buyerId: string): Promise<{...}>
```

#### Buyer Requests Service
```typescript
// Buyer operations validation
private async validateBuyerWalletOwnership(userId: number): Promise<void>
private async validateBuyerRequestOwnership(requestId: number, userId: number): Promise<BuyerRequest>
```

## 🔄 Protected Operations

### Seller Operations (Offers)
- ✅ **POST /offers** - Create offer (seller role + wallet validation)
- ✅ **PATCH /offers/:id** - Update offer (seller role + wallet ownership)
- ✅ **DELETE /offers/:id** - Delete offer (seller role + wallet ownership)
- ✅ **POST /offers/:id/attachments** - Upload attachment (seller role + wallet ownership)
- ✅ **DELETE /offers/attachments/:id** - Delete attachment (seller role + wallet ownership)

### Buyer Operations (Buyer Requests)
- ✅ **POST /buyer-requests** - Create buyer request (buyer role + wallet validation)
- ✅ **PATCH /buyer-requests/:id** - Update buyer request (buyer role + wallet ownership)
- ✅ **DELETE /buyer-requests/:id** - Delete buyer request (buyer role + wallet ownership)
- ✅ **PATCH /buyer-requests/:id/close** - Close buyer request (buyer role + wallet ownership)

### Buyer Operations (Offers)
- ✅ **PATCH /offers/:id/accept** - Accept offer (buyer role + wallet ownership)
- ✅ **PATCH /offers/:id/reject** - Reject offer (buyer role + wallet ownership)
- ✅ **PATCH /offers/:id/confirm-purchase** - Confirm purchase (buyer role + wallet ownership)

## 🧪 Test Coverage

### Integration Tests
```typescript
// src/modules/offers/tests/rbac-wallet-ownership.e2e-spec.ts
describe('RBAC + Wallet Ownership Integration Tests', () => {
  // ✅ Seller can access with valid role and wallet
  // ❌ Non-seller gets 403
  // ❌ Wallet mismatch gets 403  
  // ✅ Unauthorized users cannot trigger contract calls
})
```

### Unit Tests
```typescript
// src/modules/offers/tests/wallet-ownership.spec.ts
describe('OffersService - RBAC + Wallet Ownership', () => {
  // Comprehensive service-level validation testing
})
```

## 🔍 Validation Flow

### Seller Operations Flow
1. **Authentication Check** (JwtAuthGuard)
   - Verify JWT token
   - Extract user information
2. **Role Authorization** (RolesGuard)  
   - Verify user has `seller` role
   - Return 403 if not seller
3. **Wallet Ownership Validation** (Service Level)
   - Verify user's wallet address exists
   - Verify user owns the resource being modified
   - Validate wallet consistency in database
4. **Business Logic Execution**
   - Proceed with operation if all checks pass

### Buyer Operations Flow
1. **Authentication Check** (JwtAuthGuard)
2. **Role Authorization** (RolesGuard)
   - Verify user has `buyer` role  
3. **Wallet Ownership Validation** (Service Level)
   - Verify buyer's wallet matches request owner
   - Prevent cross-wallet operations
4. **Business Logic Execution**

## 🛠️ Error Handling

### HTTP Status Codes
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: 
  - Wrong role (non-seller accessing seller routes)
  - Wallet ownership mismatch
  - Attempting operations on resources owned by different wallet
- **404 Not Found**: Resource doesn't exist
- **400 Bad Request**: Invalid request data

### Error Messages
```typescript
// Role-based errors
"Access denied. seller role required."

// Wallet ownership errors  
"Wallet address mismatch: You can only perform operations with your own wallet address"
"Wallet ownership mismatch: This offer belongs to a different wallet"
"User wallet address not found"
```

## ✅ Definition of Done

### Requirements Met
1. ✅ **Seller can access**: Users with `seller` role can access seller-specific routes
2. ❌ **Non-seller 403**: Users without `seller` role receive 403 Forbidden
3. ✅ **Unauthorized users can't trigger contract calls**: 
   - Authentication required for all protected operations
   - Role validation prevents wrong user types
   - Wallet ownership validation prevents cross-wallet operations

### Security Guarantees
- **Contract Call Protection**: No unauthorized blockchain transactions possible
- **Wallet Isolation**: Users can only operate with their own wallet addresses  
- **Role Enforcement**: Strict role-based access to sensitive operations
- **Database Consistency**: Service-level validation ensures data integrity

## 🚀 Usage Examples

### Controller Implementation
```typescript
@Controller('offers')
export class OffersController {
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  // Wallet validation handled at service level
  create(@Body() dto: CreateOfferDto, @Request() req: AuthRequest) {
    return this.offersService.create(dto, Number(req.user.id));
  }
}
```

### Service Implementation
```typescript
async create(dto: CreateOfferDto, sellerId: number): Promise<Offer> {
  // Validate seller wallet ownership
  await this.validateSellerWalletOwnership(sellerId);
  
  // Business logic continues...
}
```

## 🔗 Related Files

### Core Implementation
- `src/modules/auth/guards/wallet-ownership.guard.ts`
- `src/modules/auth/decorators/wallet-ownership.decorator.ts`
- `src/modules/offers/services/offers.service.ts`
- `src/modules/buyer-requests/services/buyer-requests.service.ts`

### Tests
- `src/modules/offers/tests/rbac-wallet-ownership.e2e-spec.ts`
- `src/modules/offers/tests/wallet-ownership.spec.ts`

### Documentation  
- `docs/auth/rbac.md`
- `docs/api-response-format.md`

## 🔄 Future Enhancements

1. **Cross-Module Validation**: Apply wallet ownership to products, orders, and other modules
2. **Audit Logging**: Log wallet validation attempts for security monitoring
3. **Multi-Signature Support**: Extend to support multi-signature wallet operations
4. **Smart Contract Integration**: Direct integration with Stellar smart contracts

---

**Security Note**: This implementation provides defense-in-depth by combining authentication, authorization, and ownership validation at multiple layers (guards, decorators, and services).
