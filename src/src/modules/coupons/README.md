# Coupons Module

This module handles all coupon-related functionality in the application, following NestJS and Domain-Driven Design (DDD) principles.

## Structure

```
coupons/
├── controllers/         # Handles HTTP requests
│   └── coupon.controller.ts
├── dto/                # Data Transfer Objects
│   └── coupon.dto.ts
├── entities/           # Database entities
│   └── coupon.entity.ts
├── services/           # Business logic
│   └── coupon.service.ts
└── coupon.module.ts    # Module configuration
```

## Components

### Controllers
- `CouponController`: Handles HTTP requests for coupon operations
  - `POST /coupons`: Create a new coupon
  - `GET /coupons/:code/validate`: Validate a coupon
  - `POST /coupons/:id/apply`: Apply a coupon to an order

### Services
- `CouponService`: Contains business logic for coupon operations
  - `createCoupon`: Creates a new coupon
  - `validateCoupon`: Validates a coupon's code and conditions
  - `applyCouponToOrder`: Applies a coupon to an order and calculates discounts

### DTOs
- `CreateCouponDto`: Data structure for creating coupons
- `ApplyCouponDto`: Data structure for applying coupons to orders

### Entities
- `Coupon`: Database entity for coupons
- `CouponUsage`: Database entity for tracking coupon usage

## Usage

The module is configured in `coupon.module.ts` and uses TypeORM for database operations. It's protected by JWT authentication and can be imported into other modules as needed.

### Example Usage

```typescript
// Creating a coupon
POST /coupons
{
  "code": "SUMMER2024",
  "value": 20,
  "type": "PERCENTAGE",
  "min_cart_value": 100,
  "max_uses": 1000,
  "expires_at": "2024-08-31"
}

// Validating a coupon
GET /coupons/SUMMER2024/validate?cartValue=150

// Applying a coupon
POST /coupons/orders/123/apply
{
  "code": "SUMMER2024",
  "user_id": "456",
  "total": 150
}
```

## Dependencies
- NestJS
- TypeORM
- JWT Authentication 