# StarShop Backend - User Registration System

## 🎯 Overview

This repository contains the complete implementation of a robust user registration system for the StarShop backend. The system supports both buyer and seller registration with enhanced user profile fields and strict role-based data validation.

## ✨ Key Features

- **🔐 Role-Based Registration**: Support for buyer and seller roles
- **📍 Enhanced User Profile**: Location, country, and role-specific data
- **🛡️ Strict Validation**: Prevents cross-role data mixing at multiple levels
- **📊 Flexible Data Storage**: JSON fields for customizable role data
- **🔄 Backward Compatibility**: Maintains existing user_roles structure
- **🧪 Comprehensive Testing**: Full test coverage across all layers

## 📚 Documentation

### 1. [User Registration API](./user-registration.md)
Complete API documentation with examples, request/response formats, and error codes.

### 2. [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
Step-by-step guide for developers implementing or extending the system.

### 3. [Technical Specification](./TECHNICAL_SPECIFICATION.md)
Detailed technical implementation, architecture, and design decisions.

## 🏗️ Architecture

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

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- PostgreSQL 12+
- TypeScript 4.5+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd StarShop-Backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npm run migration:run

# Start the development server
npm run start:dev
```

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

## 📡 API Usage

### Register a Buyer

```bash
curl -X POST 'http://localhost:3000/api/v1/users' \
  -H 'Content-Type: application/json' \
  -d '{
    "walletAddress": "GD6LXK4RB6D522ECACFVUEOKPCYBGQ6SKYONMVNIUOWUAIRNLSYAOB4Q",
    "role": "buyer",
    "name": "John Doe",
    "email": "john@example.com",
    "location": "New York",
    "country": "United States",
    "buyerData": {}
  }'
```

### Register a Seller

```bash
curl -X POST 'http://localhost:3000/api/v1/users' \
  -H 'Content-Type: application/json' \
  -d '{
    "walletAddress": "GXYZABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890",
    "role": "seller",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "location": "Los Angeles",
    "country": "United States",
    "sellerData": {
      "businessName": "Tech Store",
      "categories": ["electronics", "computers"],
      "rating": 4.5
    }
  }'
```

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Files

```bash
# DTO validation tests
npm test -- dto-validation.spec.ts

# Role validation tests
npm test -- role-validation.spec.ts

# User registration tests
npm test -- user-registration.spec.ts
```

### Test Coverage

```bash
npm run test:cov
```

### E2E Tests

```bash
npm run test:e2e
```

## 🔧 Development

### Code Structure

```
src/
├── modules/
│   ├── users/           # User management
│   │   ├── entities/    # Database entities
│   │   ├── controllers/ # API endpoints
│   │   ├── services/    # Business logic
│   │   └── tests/       # Test files
│   └── auth/            # Authentication
│       ├── dto/         # Data transfer objects
│       ├── services/    # Auth services
│       └── tests/       # Auth tests
├── types/               # TypeScript types
├── migrations/          # Database migrations
└── docs/               # Documentation
```

### Key Components

1. **User Entity** (`src/modules/users/entities/user.entity.ts`)
   - Enhanced with new fields: `location`, `country`, `buyerData`, `sellerData`
   - Maintains existing relationships and constraints

2. **Custom Validator** (`src/modules/auth/dto/auth.dto.ts`)
   - `@IsRoleSpecificData` decorator ensures role-specific data rules
   - Prevents buyers from having seller data and vice versa

3. **Service Layer** (`src/modules/users/services/user.service.ts`)
   - Business logic validation
   - Role assignment and user creation

4. **Database Migration** (`src/migrations/1751199237000-AddUserFields.ts`)
   - Adds new columns to users table
   - Maintains data integrity

## 🛡️ Validation Rules

### Required Fields
- `walletAddress`: Valid Stellar wallet address (G + 55 characters)
- `role`: Either "buyer" or "seller"
- `buyerData`: Required for buyer role, must be object
- `sellerData`: Required for seller role, must be object

### Role-Specific Rules

| Role | Allowed Data | Forbidden Data |
|------|--------------|----------------|
| **Buyer** | `buyerData` (required) | `sellerData` |
| **Seller** | `sellerData` (required) | `buyerData` |

### Field Validation
- **walletAddress**: Regex pattern `^G[A-Z2-7]{55}$`
- **email**: Valid email format (if provided)
- **name**: 2-50 characters (if provided)
- **location**: Max 100 characters (if provided)
- **country**: Max 100 characters (if provided)
- **buyerData/sellerData**: Must be valid JSON objects

## 🔍 Error Handling

### Common Error Responses

```json
{
  "success": false,
  "message": "buyerData is only allowed for buyers"
}
```

### HTTP Status Codes

- **200 OK**: Successful operations
- **201 Created**: User registered successfully
- **400 Bad Request**: Validation errors
- **401 Unauthorized**: Missing authentication
- **403 Forbidden**: Insufficient permissions
- **500 Internal Server Error**: Server errors

## 🚀 Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates installed
- [ ] Logging configured
- [ ] Monitoring enabled
- [ ] Health checks implemented

### Database Migration

```bash
# Run migrations
npm run migration:run

# Revert if needed
npm run migration:revert

# Generate new migration
npm run migration:generate -- -n MigrationName
```

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch
3. **Implement** your changes
4. **Add** tests for new functionality
5. **Run** all tests to ensure they pass
6. **Submit** a pull request

### Code Standards

- Follow TypeScript best practices
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Maintain test coverage above 90%
- Follow the existing code style

## 📊 Monitoring

### Key Metrics

- **Registration Success Rate**: Track successful vs failed registrations
- **Validation Error Rates**: Monitor validation failure patterns
- **Response Times**: Track API endpoint performance
- **Error Patterns**: Identify common error scenarios

### Health Checks

```bash
# Health check endpoint
GET /health

# Response
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "database": "connected"
}
```

## 🔮 Future Enhancements

### Planned Features

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

## 📞 Support

### Getting Help

- **Documentation**: Check the docs folder first
- **Issues**: Create a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions

### Common Issues

1. **Validation Errors**: Check the validation rules and ensure data format is correct
2. **Database Errors**: Verify database connection and migration status
3. **Test Failures**: Ensure all dependencies are installed and environment is configured

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- **NestJS Team** for the excellent framework
- **TypeORM** for robust database management
- **class-validator** for comprehensive validation
- **Jest** for testing framework

---

**Built with ❤️ for the StarShop community**
