# 🌟 StarShop Backend

<div align="center">
  <img src="public/starshop-logos/StarShop-Logo.svg" height="200">
</div>

StarShop Backend is a robust and scalable API built with NestJS that provides comprehensive functionality for an e-commerce platform integrated with Stellar blockchain technology. The system includes wallet-based authentication, product management, shopping cart, orders, coupons, real-time notifications, and more.

## 🚀 Key Features

- **Web3 Authentication**: Stellar wallet-based authentication system with cryptographic verification
- **Product Management**: Complete CRUD for products, variants, and product types
- **Shopping Cart**: Cart management with persistence and validations
- **Order System**: Complete order processing with status tracking
- **Coupons & Discounts**: Flexible coupon system with validations
- **Real-time Notifications**: Pusher integration for push notifications
- **File Management**: File upload to AWS S3 and Cloudinary
- **Review System**: Product review management
- **Wishlist**: Wishlist functionality for users
- **Role-Based Access Control**: RBAC with buyer, seller, and admin roles
- **RESTful API**: Well-documented endpoints with OpenAPI/Swagger
- **Database**: PostgreSQL with TypeORM for ORM
- **Testing**: Complete coverage with Jest for unit and e2e tests

## 📋 Available Modules

### 🔐 Authentication (`/auth`)
- Stellar wallet-based authentication
- Cryptographic signature verification
- JWT tokens with HttpOnly cookies
- Role-based access control (RBAC)
- User and profile management

### 👥 Users (`/users`)
- Complete user CRUD operations
- Profile and personal information management
- Data validation and permissions

### 🛍️ Products (`/products`)
- Complete product management
- Categorization and organization
- Advanced search and filtering

### 🏷️ Product Types (`/productTypes`)
- Product categorization
- Type hierarchy and subcategories

### 🔧 Product Variants (`/productVariants`)
- Variant management (size, color, etc.)
- Customizable attributes
- Inventory control per variant

### 📝 Attributes (`/attributes`)
- Dynamic attribute system
- Customizable attribute values
- Association with products and variants

### 🛒 Cart (`/cart`)
- Shopping cart management
- Item persistence
- Stock and price validations

### 📦 Orders (`/orders`)
- Complete order processing
- Order statuses (pending, confirmed, shipped, etc.)
- Purchase history

### 🎫 Coupons (`/coupons`)
- Coupon and discount system
- Date and usage validations
- Different discount types

### 💝 Wishlist (`/wishlist`)
- Wishlist management
- Add/remove products
- List of desired items

### ⭐ Reviews (`/reviews`)
- Product review system
- Ratings and comments
- Previous purchase validation

### 📁 Files (`/files`)
- File upload to AWS S3
- Cloudinary integration
- Image and document management

### 🔔 Notifications (`/notifications`)
- Real-time notifications with Pusher
- Different notification types
- Subscription management

## 🛠️ Technologies Used

- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL with TypeORM (Supabase ready)
- **Authentication**: JWT + Stellar SDK
- **Storage**: AWS S3 + Cloudinary
- **Notifications**: Pusher
- **Testing**: Jest + Supertest
- **Documentation**: OpenAPI/Swagger
- **Validation**: class-validator + class-transformer
- **Rate Limiting**: express-rate-limit
- **Logging**: Winston
- **Supabase**: Supabase client for authentication, storage and other services

## 📦 Installation and Setup

### Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/StarShopCr/StarShop-Backend.git
cd StarShop-Backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Database with Docker

```bash
# Start PostgreSQL database using Docker Compose
docker-compose up -d postgres
```

This will start a PostgreSQL database with the following default configuration:
- **Host**: localhost
- **Port**: 5432
- **Username**: user
- **Password**: password
- **Database**: starshop

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
touch .env
```

Add the following configuration to your `.env` file:

```env
# Database (Docker Compose defaults)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=user
DB_PASSWORD=password
DB_DATABASE=starshop

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION_TIME=1h

# AWS S3 (Optional - for file uploads)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name

# Cloudinary (Optional - for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Pusher (Optional - for real-time notifications)
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster

# Application
NODE_ENV=development
PORT=3000
```

### 5. Run Database Migrations

```bash
# Run migrations to create database tables
npm run typeorm migration:run
```

### 6. Start the Application

```bash
# Development mode with hot reload
npm run dev

# Or start in production mode
npm run build
npm run start:prod
```

The application will be available at `http://localhost:3000`

### Alternative: Run Everything with Docker

If you prefer to run the entire application with Docker:

```bash
# Build the application image
docker build -t starshop-backend .

# Start both database and application
docker-compose up -d
```

## 🐳 Docker Setup

### Using Docker Compose (Recommended)

The project includes a `docker-compose.yml` file that sets up the PostgreSQL database:

```bash
# Start only the database
docker-compose up -d postgres

# Start all services (if you add the app service to docker-compose.yml)
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (this will delete all data)
docker-compose down -v
```

### Database Management

```bash
# View database logs
docker-compose logs postgres

# Access database directly
docker exec -it starshop-db psql -U user -d starshop

# Backup database
docker exec starshop-db pg_dump -U user starshop > backup.sql

# Restore database
docker exec -i starshop-db psql -U user -d starshop < backup.sql
```

## 🚀 Available Scripts

```bash
# Development
npm run dev              # Start in development mode
npm run start:dev        # Start with watch mode
npm run start:debug      # Start in debug mode

# Production
npm run build           # Compile TypeScript
npm run start           # Start application
npm run start:prod      # Start in production mode

# Testing
npm run test            # Run unit tests
npm run test:watch      # Tests in watch mode
npm run test:coverage   # Tests with coverage
npm run test:e2e        # End-to-end tests

# Linting and Formatting
npm run lint            # Check linting
npm run lint:fix        # Fix linting errors
npm run format          # Format code

# Documentation
npm run docs:validate   # Validate OpenAPI schema
npm run docs:build      # Generate static documentation
```

## 📚 API Documentation

### Access Documentation

1. Start the server: `npm run dev`
2. Visit: `http://localhost:3000/docs`

### Endpoint Structure

All endpoints follow RESTful patterns and are versioned:

- **Prefix**: `/api/v1`
- **Format**: `GET /api/v1/resource`
- **Responses**: JSON with consistent structure

### Response Example

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### Error Example

```json
{
  "success": false,
  "message": "Error description",
  "error": "Specific error code"
}
```

## 🔐 Authentication

### Authentication Flow

1. **Generate Challenge**:
   ```bash
   POST /api/v1/auth/challenge
   {
     "walletAddress": "GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6EWERVC7ESE"
   }
   ```

2. **Register/Login**:
   ```bash
   POST /api/v1/auth/register
   {
     "walletAddress": "GDRXE2BQUC3AZ6H4YOVGJK2D5SUKZMAWDVSTXWF3SZEUZ6EWERVC7ESE",
     "signature": "MEUCIQDexample==",
     "message": "StarShop Authentication Challenge - ...",
     "name": "John Doe",
     "email": "john@example.com"
   }
   ```

### User Roles

- **buyer**: Buyer user (default role)
- **seller**: Seller with product management permissions
- **admin**: Administrator with full system access

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm run test

# Tests with coverage
npm run test:coverage

# End-to-end tests
npm run test:e2e

# Specific tests
npm test -- --testPathPattern=auth
```

### Test Structure

```
src/modules/
├── auth/
│   └── tests/
│       └── auth.service.spec.ts
├── coupons/
│   └── tests/
│       ├── coupon.controller.spec.ts
│       ├── coupon.service.spec.ts
│       └── coupon.integration.spec.ts
└── files/
    └── tests/
        ├── file.controller.spec.ts
        └── file.service.spec.ts
```

## 📁 Project Structure

```
src/
├── config/                 # Configurations
│   ├── database.ts        # Database configuration
│   └── index.ts           # General configuration
├── modules/               # Application modules
│   ├── auth/             # Authentication and authorization
│   ├── users/            # User management
│   ├── products/         # Product management
│   ├── cart/             # Shopping cart
│   ├── orders/           # Order management
│   ├── coupons/          # Coupon system
│   ├── reviews/          # Review system
│   ├── files/            # File management
│   ├── notifications/    # Real-time notifications
│   └── shared/           # Shared components
├── middleware/           # Custom middlewares
├── utils/               # Utilities and helpers
├── types/               # TypeScript type definitions
└── main.ts              # Application entry point
```

## 🔧 Development Configuration

### Docker Development

```bash
# Start database only (recommended for development)
docker-compose up -d postgres

# Build and run application with Docker
docker build -t starshop-backend .
docker run -p 3000:3000 --env-file .env starshop-backend

# Or use Docker Compose for both (if you extend docker-compose.yml)
docker-compose up -d
```

### Database Management

```bash
# Create new migration
npm run typeorm migration:create -- -n CreateNewTable

# Run migrations
npm run typeorm migration:run

# Revert last migration
npm run typeorm migration:revert

# Generate migration from entity changes
npm run typeorm migration:generate -- -n MigrationName
```

### Development Workflow

1. **Start Database**: `docker-compose up -d postgres`
2. **Install Dependencies**: `npm install`
3. **Setup Environment**: Create `.env` file
4. **Run Migrations**: `npm run typeorm migration:run`
5. **Start Development Server**: `npm run dev`
6. **Access API**: `http://localhost:3000`
7. **View Documentation**: `http://localhost:3000/docs`

## 📝 Coding Standards

### Conventions

- **Language**: TypeScript
- **Formatting**: Prettier + ESLint
- **Naming**:
  - `camelCase` for variables and functions
  - `PascalCase` for classes and interfaces
  - `UPPER_SNAKE_CASE` for constants
  - `kebab-case` for API routes

### Commits

Format: `[Type] [Scope]: [Description]`

Examples:
- `feat: Add user authentication system`
- `fix: Resolve database connection issue`
- `docs: Update API documentation`
- `test: Add unit tests for auth service`

### Pull Requests

1. Create branch from `develop`
2. Implement changes with tests
3. Run linting and tests
4. Create PR with detailed description
5. Wait for review and approval

### Type Safety & Avoiding `any`

Strict TypeScript options are enabled (`strict`, `noImplicitAny`, `strictNullChecks`). Do not introduce unchecked `any`.

Guidelines:

- Prefer `unknown` for opaque values instead of `any`.
- Use generics in helpers (e.g. async handlers, validation middleware) to propagate types.
- DTOs must define explicit field types. For collections of key/value attributes create a small interface (see `AttributeValueDTO`).
- Dynamic JSON blobs: `Record<string, unknown>`.
- If interoperating with untyped libraries, narrow as soon as possible and add runtime guards.
- Only in tests you may coerce with `as unknown as T`; keep the cast local.

Audit command:

```bash
grep -R "any" src | grep -v spec || true
```

If you intentionally keep an `any`, annotate with `// INTENTIONAL_ANY: reason`.

## 🚀 Deployment

### Production

```bash
# Build application
npm run build

# Start in production
npm run start:prod
```

### Production Environment Variables

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-production-secret
DB_HOST=your-production-db-host
# ... other production configurations
```

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow established coding standards
- Add tests for new features
- Update documentation when necessary
- Ensure all tests pass before PR

## 📄 License

This project is licensed under the ISC License. See the `LICENSE` file for details.

## 🆘 Support

For technical support or questions:

- Create an issue on GitHub
- Review documentation in `/docs`
- Check tests for usage examples
- **Telegram**: [@Villarley](https://t.me/Villarley)

## 🔗 Useful Links

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Stellar SDK](https://stellar.github.io/js-stellar-sdk/)
- [OpenAPI Specification](https://swagger.io/specification/)
