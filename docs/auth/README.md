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

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/challenge` | Generate authentication challenge | No |
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login with wallet | No |
| GET | `/auth/me` | Get current user info | Yes |
| DELETE | `/auth/logout` | Logout user | Yes |

### User Management Endpoints

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/users` | Get all users | Yes | Admin |
| POST | `/users` | Create user (register) | No | - |
| GET | `/users/:id` | Get user by ID | Yes | Own profile or Admin |
| PUT | `/users/update/:id` | Update user | Yes | Own profile or Admin |

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