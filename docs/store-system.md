# StarShop Store System

## Overview

The StarShop store system automatically creates a default store for every seller upon registration and supports multiple stores per seller. This system provides a comprehensive store management solution with rich features for store customization and administration.

## Key Features

- **🔄 Automatic Store Creation**: Default store created automatically when seller registers
- **🏪 Multiple Stores**: Sellers can create and manage multiple stores
- **📊 Rich Store Data**: Comprehensive store information including contact, address, policies
- **🔍 Advanced Search**: Search stores by name, category, and location
- **🛡️ Role-Based Access**: Only sellers can create and manage stores
- **📈 Store Statistics**: Performance metrics and analytics
- **✅ Admin Controls**: Store approval and status management

## Architecture

### Store Entity

```typescript
@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  logo?: string;

  @Column({ nullable: true })
  banner?: string;

  @Column({ type: 'jsonb', nullable: true })
  contactInfo?: ContactInfo;

  @Column({ type: 'jsonb', nullable: true })
  address?: Address;

  @Column({ type: 'jsonb', nullable: true })
  businessHours?: BusinessHours;

  @Column({ type: 'jsonb', nullable: true })
  categories?: string[];

  @Column({ type: 'jsonb', nullable: true })
  tags?: string[];

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating?: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'jsonb', nullable: true })
  policies?: Policies;

  @Column({ type: 'jsonb', nullable: true })
  settings?: StoreSettings;

  @Column({
    type: 'enum',
    enum: StoreStatus,
    default: StoreStatus.PENDING_APPROVAL,
  })
  status: StoreStatus;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @ManyToOne(() => User, (user) => user.stores)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @Column()
  sellerId: number;
}
```

### Store Status Enum

```typescript
export enum StoreStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_APPROVAL = 'pending_approval',
}
```

## Automatic Store Creation

### How It Works

When a seller registers, the system automatically:

1. **Creates the user account** with seller role
2. **Generates a default store** using seller data
3. **Links the store** to the seller account
4. **Sets initial status** to `PENDING_APPROVAL`

### Default Store Generation

```typescript
async createDefaultStore(sellerId: number, sellerData: any): Promise<Store> {
  const seller = await this.userRepository.findOne({
    where: { id: sellerId },
    relations: ['userRoles'],
  });

  // Create default store based on seller data
  const defaultStore = this.storeRepository.create({
    name: `${seller.name || 'My Store'}'s Store`,
    description: sellerData?.businessDescription || 'Welcome to my store!',
    categories: sellerData?.categories || [],
    contactInfo: {
      email: seller.email,
      phone: sellerData?.phone,
      website: sellerData?.website,
    },
    address: {
      city: seller.location,
      country: seller.country,
    },
    sellerId,
    status: StoreStatus.PENDING_APPROVAL,
  });

  return await this.storeRepository.save(defaultStore);
}
```

### Integration with User Registration

```typescript
// In AuthService.registerWithWallet()
// Create default store for sellers
if (data.role === 'seller') {
  try {
    await this.storeService.createDefaultStore(savedUser.id, data.sellerData);
  } catch (error) {
    console.error('Failed to create default store for seller:', error);
    // Don't fail the registration if store creation fails
  }
}
```

## Store Management

### Creating Additional Stores

Sellers can create multiple stores using the API:

```bash
POST /api/v1/stores
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "My Second Store",
  "description": "A specialized store for electronics",
  "categories": ["electronics", "computers"],
  "contactInfo": {
    "phone": "+1234567890",
    "email": "store2@example.com",
    "website": "https://store2.example.com"
  },
  "address": {
    "street": "456 Tech Ave",
    "city": "Tech City",
    "state": "CA",
    "country": "United States",
    "postalCode": "90210"
  }
}
```

### Store Operations

| Operation | Endpoint | Method | Auth Required | Role Required |
|-----------|----------|--------|---------------|---------------|
| Create Store | `/stores` | POST | ✅ | Seller |
| Get My Stores | `/stores/my-stores` | GET | ✅ | Seller |
| Get Store | `/stores/:id` | GET | ❌ | None |
| Update Store | `/stores/:id` | PUT | ✅ | Seller |
| Delete Store | `/stores/:id` | DELETE | ✅ | Seller |
| Search Stores | `/stores/search` | GET | ❌ | None |
| Store Stats | `/stores/:id/stats` | GET | ✅ | Seller |
| Update Status | `/stores/:id/status` | PUT | ✅ | Admin |

## Store Data Structure

### Contact Information

```typescript
interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}
```

### Address Information

```typescript
interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
}
```

### Business Hours

```typescript
interface BusinessHours {
  monday?: { open: string; close: string; closed: boolean };
  tuesday?: { open: string; close: string; closed: boolean };
  wednesday?: { open: string; close: string; closed: boolean };
  thursday?: { open: string; close: string; closed: boolean };
  friday?: { open: string; close: string; closed: boolean };
  saturday?: { open: string; close: string; closed: boolean };
  sunday?: { open: string; close: string; closed: boolean };
}
```

### Store Policies

```typescript
interface Policies {
  returnPolicy?: string;
  shippingPolicy?: string;
  privacyPolicy?: string;
  termsOfService?: string;
}
```

### Store Settings

```typescript
interface StoreSettings {
  autoApproveReviews?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
}
```

## API Endpoints

### Store Creation

**Endpoint:** `POST /api/v1/stores`

**Request Body:**
```json
{
  "name": "Store Name",
  "description": "Store description",
  "categories": ["category1", "category2"],
  "contactInfo": {
    "phone": "+1234567890",
    "email": "store@example.com"
  },
  "address": {
    "city": "City Name",
    "country": "Country Name"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Store Name",
    "description": "Store description",
    "status": "pending_approval",
    "sellerId": 123,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Seller's Stores

**Endpoint:** `GET /api/v1/stores/my-stores`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "My First Store",
      "status": "active",
      "rating": 4.5,
      "reviewCount": 25
    },
    {
      "id": 2,
      "name": "My Second Store",
      "status": "pending_approval",
      "rating": null,
      "reviewCount": 0
    }
  ]
}
```

### Store Search

**Endpoint:** `GET /api/v1/stores/search?q=electronics&category=tech&location=New York`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Tech Store",
      "categories": ["electronics", "tech"],
      "address": {
        "city": "New York",
        "country": "United States"
      },
      "rating": 4.8,
      "status": "active"
    }
  ]
}
```

## Database Schema

### Stores Table

```sql
CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  logo VARCHAR,
  banner VARCHAR,
  contactInfo JSONB,
  address JSONB,
  businessHours JSONB,
  categories JSONB,
  tags JSONB,
  rating DECIMAL(3,2),
  reviewCount INTEGER DEFAULT 0,
  policies JSONB,
  settings JSONB,
  status VARCHAR CHECK (status IN ('active', 'inactive', 'suspended', 'pending_approval')) DEFAULT 'pending_approval',
  isVerified BOOLEAN DEFAULT FALSE,
  isFeatured BOOLEAN DEFAULT FALSE,
  verifiedAt TIMESTAMP,
  featuredAt TIMESTAMP,
  sellerId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_stores_seller_id ON stores(sellerId);
CREATE INDEX idx_stores_status ON stores(status);
CREATE INDEX idx_stores_categories ON stores USING GIN(categories);
CREATE INDEX idx_stores_tags ON stores USING GIN(tags);
CREATE INDEX idx_stores_rating ON stores(rating);
CREATE INDEX idx_stores_created_at ON stores(createdAt);
```

## Store Lifecycle

### 1. Registration Phase
- Seller registers with `role: 'seller'`
- System automatically creates default store
- Store status: `PENDING_APPROVAL`

### 2. Approval Phase
- Admin reviews store information
- Admin can approve, reject, or request changes
- Store status changes to `ACTIVE` upon approval

### 3. Active Phase
- Store is visible to customers
- Can receive orders and reviews
- Seller can manage store settings

### 4. Management Phase
- Seller can create additional stores
- Update store information
- Manage store policies and settings

## Security & Access Control

### Role-Based Permissions

- **Sellers**: Can create, read, update, delete their own stores
- **Buyers**: Can only view active stores
- **Admins**: Can manage all stores, update statuses

### Data Validation

- All store data is validated using DTOs
- Input sanitization prevents XSS attacks
- SQL injection protection via TypeORM

### Store Ownership

- Sellers can only access their own stores
- Store operations are restricted by `sellerId`
- Admin operations require admin role verification

## Performance Considerations

### Database Optimization

- **Indexing**: Strategic indexes on frequently queried fields
- **JSONB**: Efficient storage and querying of flexible data
- **Pagination**: Support for large store datasets

### Caching Strategy

- **Store Data**: Cache frequently accessed store information
- **Search Results**: Cache search queries and results
- **Store Lists**: Cache store listings with TTL

### Query Optimization

- **Selective Loading**: Load only required fields
- **Relationship Loading**: Efficient loading of seller data
- **Search Optimization**: Full-text search capabilities

## Monitoring & Analytics

### Store Metrics

- **Registration Rate**: New stores created per day
- **Approval Rate**: Stores approved vs pending
- **Performance**: Store rating and review trends
- **Growth**: Multiple store adoption rate

### Health Checks

- **Store Status**: Monitor store approval workflow
- **Data Integrity**: Verify store-seller relationships
- **Performance**: Track store search and retrieval times

## Future Enhancements

### Planned Features

1. **Store Templates**: Pre-built store configurations
2. **Advanced Analytics**: Detailed store performance metrics
3. **Store Verification**: Enhanced verification process
4. **Multi-language Support**: International store localization
5. **Store Networks**: Store chain management
6. **Automated Approval**: AI-powered store review system

### Integration Opportunities

- **Payment Systems**: Store-specific payment processing
- **Inventory Management**: Product catalog integration
- **Customer Reviews**: Enhanced review and rating system
- **Marketing Tools**: Store promotion and advertising
- **Analytics Dashboard**: Comprehensive store insights

## Conclusion

The StarShop store system provides a robust foundation for multi-store seller management with:

- ✅ **Automatic store creation** for new sellers
- ✅ **Multiple store support** per seller
- ✅ **Comprehensive store data** management
- ✅ **Advanced search and filtering** capabilities
- ✅ **Role-based access control** and security
- ✅ **Performance optimization** and scalability
- ✅ **Extensible architecture** for future enhancements

This system enables sellers to establish their online presence immediately upon registration while maintaining the flexibility to expand their business with multiple specialized stores.
