# Authentication API Documentation

## Overview

The StarShop API uses Stellar wallet-based authentication. Users authenticate by signing challenge messages with their Stellar wallet.

## Authentication Flow

1. **Generate Challenge**: Get a challenge message to sign
2. **Sign Challenge**: User signs the challenge with their Stellar wallet
3. **Authenticate**: Submit the signature to login or register

## Endpoints

### 1. Generate Challenge

**POST** `/api/v1/auth/challenge`

Generate a challenge message for wallet authentication.

#### Request Body
```json
{
  "walletAddress": "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "challenge": "Please sign this message to authenticate: 1234567890",
    "walletAddress": "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890",
    "timestamp": 1640995200000
  }
}
```

### 2. Login

**POST** `/api/v1/auth/login`

Authenticate user using their Stellar wallet signature.

#### Request Body
```json
{
  "walletAddress": "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890",
  "signature": "base64-encoded-signature-string-here",
  "message": "Please sign this message to authenticate: 1234567890"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "walletAddress": "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "buyer"
    },
    "expiresIn": 3600
  }
}
```

**Note**: A JWT token is also set as an HTTP-only cookie.

### 3. Register

**POST** `/api/v1/auth/register`

Register a new user using their Stellar wallet.

#### Request Body
```json
{
  "walletAddress": "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890",
  "signature": "base64-encoded-signature-string-here",
  "message": "Please sign this message to authenticate: 1234567890",
  "name": "John Doe",
  "email": "john.doe@example.com"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "walletAddress": "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "buyer"
    },
    "expiresIn": 3600
  }
}
```

### 4. Get Current User

**GET** `/api/v1/auth/me`

Get information about the currently authenticated user.

#### Headers
```
Authorization: Bearer <jwt-token>
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "walletAddress": "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "buyer",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5. Logout

**DELETE** `/api/v1/auth/logout`

Logout the currently authenticated user.

#### Headers
```
Authorization: Bearer <jwt-token>
```

#### Response
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid Stellar wallet address format"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Authentication failed"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "User already exists"
}
```

## Testing with Swagger

1. Open the Swagger documentation at `http://localhost:3000/docs`
2. Navigate to the "Authentication" section
3. Use the interactive documentation to test the endpoints

## Example Usage with curl

### 1. Generate Challenge
```bash
curl -X POST http://localhost:3000/api/v1/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890",
    "signature": "your-signature-here",
    "message": "Please sign this message to authenticate: 1234567890"
  }'
```

### 3. Get Current User
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer your-jwt-token"
```

## Security Notes

- JWT tokens are stored in HTTP-only cookies for security
- Wallet addresses must follow Stellar format (G + 55 characters)
- Signatures are verified cryptographically
- All sensitive endpoints require authentication 