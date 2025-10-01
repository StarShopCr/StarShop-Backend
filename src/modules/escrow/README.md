# Escrow Module - Release Funds Feature

## Overview

The Escrow Module implements secure fund release functionality for the StarShop marketplace. It enables milestone-based payments where buyers can approve work milestones before sellers can release funds.

## Features

✅ **Milestone-based Escrow**: Funds are held in escrow accounts with multiple milestones  
✅ **Buyer Approval Required**: Sellers can only release funds after buyer approval  
✅ **Double Release Prevention**: Each milestone can only be released once  
✅ **Role-based Authorization**: Buyers approve milestones, sellers release funds  
✅ **Transaction Safety**: All operations are wrapped in database transactions  
✅ **Comprehensive Testing**: Unit, integration, and e2e tests included  

## API Endpoints

### 1. Release Funds
**POST** `/escrow/release-funds`

Release funds to seller after buyer approval of milestone.

#### Request Body
```json
{
  "milestoneId": "123e4567-e89b-12d3-a456-426614174000",
  "type": "milestone",
  "notes": "Milestone completed successfully"
}
```

#### Response
```json
{
  "success": true,
  "message": "Funds released successfully",
  "data": {
    "milestoneId": "123e4567-e89b-12d3-a456-426614174000",
    "amount": 500.00,
    "status": "released",
    "releasedAt": "2024-01-01T12:00:00Z",
    "escrowStatus": "funded",
    "totalReleased": 500.00
  }
}
```

#### Business Rules
- ✅ **Buyer must approve** before release
- ❌ **Double release blocked** - prevents releasing same milestone twice
- ✅ **Only seller** can release funds for their milestones

### 2. Approve Milestone
**POST** `/escrow/approve-milestone`

Buyer approves or rejects a milestone.

#### Request Body
```json
{
  "milestoneId": "123e4567-e89b-12d3-a456-426614174000",
  "approved": true,
  "notes": "Work completed satisfactorily"
}
```

### 3. Get Escrow by Offer
**GET** `/escrow/offer/{offerId}`

Retrieve escrow account details and milestones for an offer.

### 4. Get Milestone by ID
**GET** `/escrow/milestone/{milestoneId}`

Retrieve specific milestone details.

## Database Schema

### Escrow Accounts Table
```sql
CREATE TABLE "escrow_accounts" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "offer_id" uuid NOT NULL UNIQUE,
  "buyer_id" integer NOT NULL,
  "seller_id" integer NOT NULL,
  "totalAmount" numeric(12,2) NOT NULL,
  "releasedAmount" numeric(12,2) DEFAULT 0,
  "status" escrow_status_enum DEFAULT 'pending',
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now()
);
```

### Milestones Table
```sql
CREATE TABLE "milestones" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "escrow_account_id" uuid NOT NULL,
  "title" varchar(255) NOT NULL,
  "description" text,
  "amount" numeric(12,2) NOT NULL,
  "status" milestone_status_enum DEFAULT 'pending',
  "buyer_approved" boolean DEFAULT false,
  "approved_at" TIMESTAMP NULL,
  "released_at" TIMESTAMP NULL,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now()
);
```

## Enums

### EscrowStatus
- `pending` - Initial state
- `funded` - Funds deposited
- `released` - All funds released
- `refunded` - Funds returned to buyer
- `disputed` - Under dispute

### MilestoneStatus
- `pending` - Awaiting buyer approval
- `approved` - Buyer approved milestone
- `rejected` - Buyer rejected milestone
- `released` - Funds released to seller

## Usage Example

```typescript
// 1. Create escrow account when offer is accepted
const escrow = await escrowService.createEscrowAccount(
  offerId,
  buyerId,
  sellerId,
  1000, // total amount
  [
    { title: 'Phase 1', description: 'Initial setup', amount: 500 },
    { title: 'Phase 2', description: 'Development', amount: 500 }
  ]
);

// 2. Buyer approves milestone
await escrowService.approveMilestone(
  { milestoneId, approved: true, notes: 'Work looks good' },
  buyerId
);

// 3. Seller releases funds
const result = await escrowService.releaseFunds(
  { milestoneId, type: 'milestone', notes: 'Phase complete' },
  sellerId
);

console.log(result.data.totalReleased); // 500.00
```

## Error Handling

The module implements comprehensive error handling:

- **404 Not Found**: Milestone or escrow account not found
- **403 Forbidden**: User not authorized for the operation
- **400 Bad Request**: Business rule violations (not approved, already released, etc.)

## Testing

Run tests with:
```bash
# Unit tests
npm test -- escrow.service.spec.ts

# Controller tests
npm test -- escrow.controller.spec.ts

# Integration tests
npm test -- escrow.integration.spec.ts
```

## Integration with Existing Systems

The escrow module integrates seamlessly with:
- **Offers Module**: Escrow created when offers are accepted
- **Auth Module**: Uses existing authentication and authorization
- **Users Module**: Links to buyer and seller user accounts
- **Database**: Extends existing TypeORM setup

## Security Features

- **Transaction Safety**: All fund operations are atomic
- **Authorization Checks**: Role-based access control
- **Input Validation**: DTO validation with class-validator
- **Audit Trail**: All milestone state changes are logged
- **Double Release Prevention**: Business logic prevents duplicate releases

## Next Steps

Future enhancements could include:
- **Partial Releases**: Release portion of milestone amount
- **Dispute Resolution**: Handle disputed milestones
- **Auto-release**: Automatic release after timeout
- **Payment Integration**: Connect to actual payment processors
- **Notifications**: Real-time updates on milestone changes
