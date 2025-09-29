# User Registration API

## Overview
The user registration endpoint allows users to register as either a buyer or seller with additional profile information including location, country, and role-specific data.

## Endpoint
`POST /users`

## Request Body

### Required Fields
- `walletAddress` (string): Stellar wallet address (must start with G and be 56 characters long)
- `role` (string): User role - must be either "buyer" or "seller"

### Optional Fields
- `name` (string): User display name
- `email` (string): User email address
- `location` (string): User location (e.g., "New York")
- `country` (string): User country (e.g., "United States")
- `buyerData` (object): Buyer-specific data (only allowed if role is "buyer")
- `sellerData` (object): Seller-specific data (only allowed if role is "seller")

### Validation Rules
- **Buyers**: Can only have `buyerData`, cannot have `sellerData`
- **Sellers**: Can only have `sellerData`, cannot have `buyerData`
- **buyerData**: Required for buyer role, must be an object
- **sellerData**: Required for seller role, must be an object
- **Cross-role data**: Will cause the entire request to be rejected with a 400 error

## Examples

### Register as a Buyer
```json
{
  "walletAddress": "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890",
  "role": "buyer",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "location": "New York",
  "country": "United States",
  "buyerData": {}
}
```

### Register as a Seller
```json
{
  "walletAddress": "GXYZABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890",
  "role": "seller",
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "location": "Los Angeles",
  "country": "United States",
  "sellerData": {
    "businessName": "Tech Store",
    "categories": ["electronics", "computers"],
    "rating": 4.5,
    "businessAddress": "456 Tech Ave, Los Angeles, CA 90210"
  }
}
```

## Response

### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "walletAddress": "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "buyer",
      "location": "New York",
      "country": "United States",
      "buyerData": {},
      "sellerData": null
    },
    "expiresIn": 3600
  }
}
```

### Error Responses

#### 400 Bad Request - Invalid Wallet Address
```json
{
  "success": false,
  "message": "Invalid Stellar wallet address format"
}
```

#### 400 Bad Request - Missing Required Data
```json
{
  "success": false,
  "message": "Buyer data is required for buyer role"
}
```

#### 400 Bad Request - Invalid Role Data
```json
{
  "success": false,
  "message": "buyerData is only allowed for buyers"
}
```

#### 400 Bad Request - Duplicate Wallet Address
```json
{
  "success": false,
  "message": "Wallet address already registered"
}
```

## Notes

1. **Role-specific Data Validation**: 
   - Buyers can only provide `buyerData` (required)
   - Sellers can only provide `sellerData` (required)
   - Cross-role data is strictly forbidden and will result in validation errors
   - **Validation happens at the DTO level** - requests with forbidden data will be rejected entirely

2. **Authentication**: 
   - A JWT token is automatically generated and set as an HttpOnly cookie
   - The token expires in 1 hour by default

3. **Database**: 
   - The role is stored in the user_roles table as before
   - Location and country are stored as strings
   - Buyer and seller data are stored as JSONB for flexibility

4. **Validation**: 
   - Wallet address must be a valid Stellar address format
   - Email must be a valid email format
   - Role must be either "buyer" or "seller"
   - Role-specific data validation prevents data mixing at the DTO level
   - All optional fields have reasonable length limits
