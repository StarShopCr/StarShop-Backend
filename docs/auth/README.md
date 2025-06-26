# Stellar Wallet Authentication

This document describes the Stellar wallet-based authentication system implemented in StarShop.

## Overview

The authentication system uses Stellar wallet addresses and cryptographic signatures to authenticate users. This provides a secure, Web3-style authentication experience without requiring passwords.

## Features

- **Wallet-based authentication**: Users authenticate using their Stellar wallet
- **Cryptographic signature verification**: Uses Stellar SDK to verify message signatures
- **JWT tokens**: Secure session management with configurable expiration
- **Role-based access control**: Support for buyer, seller, and admin roles
- **HttpOnly cookies**: Secure token storage
- **Challenge-response mechanism**: Prevents replay attacks

## API Endpoints Reference

### Authentication Endpoints

#### POST /auth/challenge
Generate an authentication challenge for wallet signature.

**Request Payload:**
```json
{
  "walletAddress": "GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "challenge": "StarShop Authentication Challenge - GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE - 1234567890",
    "walletAddress": "GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE",
    "timestamp": 1234567890
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid wallet address format"
}
```

#### POST /auth/register
Register a new user with Stellar wallet.

**Request Payload:**
```json
{
  "walletAddress": "GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE",
  "signature": "MEUCIQDexample==",
  "message": "StarShop Authentication Challenge - GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE - 1234567890",
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "walletAddress": "GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "buyer"
    },
    "expiresIn": 3600
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Wallet address already registered"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid signature"
}
```

#### POST /auth/login
Login with existing Stellar wallet.

**Request Payload:**
```json
{
  "walletAddress": "GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE",
  "signature": "MEUCIQDexample==",
  "message": "StarShop Authentication Challenge - GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE - 1234567890"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "walletAddress": "GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "buyer"
    },
    "expiresIn": 3600
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "User not found or invalid signature"
}
```

#### GET /auth/me
Get current authenticated user information.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```
OR
```
Cookie: token=<jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "walletAddress": "GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "buyer",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "User not authenticated"
}
```

#### DELETE /auth/logout
Logout current user and clear authentication token.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```
OR
```
Cookie: token=<jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### User Management Endpoints

#### GET /users
Get all users (Admin only).

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```
OR
```
Cookie: token=<jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "walletAddress": "GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "buyer",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "walletAddress": "GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE2",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "seller",
      "createdAt": "2024-01-02T00:00:00.000Z",
      "updatedAt": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

#### POST /users
Create new user (same as /auth/register).

**Request Payload:**
```json
{
  "walletAddress": "GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE",
  "signature": "MEUCIQDexample==",
  "message": "StarShop Authentication Challenge - GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE - 1234567890",
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "walletAddress": "GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "buyer"
    },
    "expiresIn": 3600
  }
}
```

#### GET /users/:id
Get user by ID (Own profile or Admin only).

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```
OR
```
Cookie: token=<jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "walletAddress": "GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "buyer",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "Access denied"
}
```

#### PUT /users/update/:id
Update user information (Own profile or Admin only).

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```
OR
```
Cookie: token=<jwt_token>
```

**Request Payload:**
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "walletAddress": "GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE",
    "name": "John Updated",
    "email": "john.updated@example.com",
    "role": "buyer",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "You can only update your own profile"
}
```

## Authentication Flow

### 1. Challenge Generation
```
POST /auth/challenge
{
  "walletAddress": "GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "challenge": "StarShop Authentication Challenge - GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE - 1234567890",
    "walletAddress": "GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE",
    "timestamp": 1234567890
  }
}
```

### 2. User Registration
```
POST /auth/register
{
  "walletAddress": "GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE",
  "signature": "MEUCIQDexample==",
  "message": "StarShop Authentication Challenge - GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE - 1234567890",
  "name": "John Doe",
  "email": "john@example.com"
}
```

### 3. User Login
```
POST /auth/login
{
  "walletAddress": "GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE",
  "signature": "MEUCIQDexample==",
  "message": "StarShop Authentication Challenge - GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE - 1234567890"
}
```

## Security Features

### Wallet Address Validation
- Must start with 'G' (Stellar public key format)
- Must be exactly 56 characters long
- Must contain only valid Stellar characters (A-Z, 2-7)

### Signature Verification
- Uses Stellar SDK's `Keypair.fromPublicKey().verify()`
- Verifies the signature against the challenge message
- Prevents replay attacks with timestamped challenges

### JWT Token Security
- Stored in HttpOnly cookies (web) or Authorization header (API)
- Configurable expiration (default: 1 hour)
- Contains user ID, wallet address, and role
- Signed with server secret

### Role-Based Access Control
- **buyer**: Default role for new users
- **seller**: Can manage products and orders
- **admin**: Full system access

## Frontend Integration

### Challenge Generation
```javascript
// 1. Generate challenge
const challengeResponse = await fetch('/api/v1/auth/challenge', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ walletAddress: userWalletAddress })
});
const { data: { challenge } } = await challengeResponse.json();

// 2. Sign challenge with wallet
const signature = await wallet.signMessage(challenge);

// 3. Login or register
const authResponse = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress: userWalletAddress,
    signature: signature,
    message: challenge
  })
});
```

### Making Authenticated Requests
```javascript
// Using cookies (automatic)
const response = await fetch('/api/v1/auth/me');

// Using Authorization header
const response = await fetch('/api/v1/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Error Handling

### Common Error Responses

```json
{
  "success": false,
  "message": "Error description"
}
```

### Error Codes
- `400`: Validation error (invalid wallet address, missing fields)
- `401`: Authentication error (invalid signature, user not found)
- `403`: Authorization error (insufficient permissions)
- `409`: Conflict (wallet address already registered)

## Testing

### Unit Tests
```bash
npm test src/modules/auth/tests/auth.service.spec.ts
```

### Integration Tests
```bash
npm run test:e2e test/auth.e2e-spec.ts
```

### Manual Testing
1. Use Stellar testnet wallet
2. Generate challenge with valid wallet address
3. Sign challenge with wallet
4. Test login/register with signature
5. Verify JWT token and user data

## Configuration

### Environment Variables
```env
JWT_SECRET=your-secret-key
JWT_EXPIRATION_TIME=1h
NODE_ENV=production
```

### JWT Token Payload
```json
{
  "id": 1,
  "walletAddress": "GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6FWERVC7ESE",
  "role": "buyer",
  "iat": 1234567890,
  "exp": 1234571490
}
```

## Security Considerations

1. **Challenge uniqueness**: Each challenge includes timestamp to prevent replay
2. **Signature verification**: Always verify signatures server-side
3. **Token expiration**: Short-lived tokens reduce attack window
4. **HttpOnly cookies**: Prevent XSS attacks on token storage
5. **HTTPS only**: Use secure connections in production
6. **Rate limiting**: Implement rate limiting on auth endpoints
7. **Input validation**: Validate all wallet addresses and signatures

## Troubleshooting

### Common Issues

1. **Invalid signature**: Ensure challenge message matches exactly
2. **Wallet format**: Verify wallet address follows Stellar format
3. **Token expiration**: Check JWT expiration time
4. **CORS issues**: Configure CORS for frontend domains
5. **Cookie issues**: Ensure proper cookie settings for domain

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` to see detailed authentication logs. 