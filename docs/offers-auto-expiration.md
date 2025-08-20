# Auto-Expire Offers After 7 Days

## Overview
This feature automatically rejects offers that haven't been accepted after 7 days, keeping the system clean and ensuring timely responses.

## Features

### 1. Automatic Expiration
- **Default Expiration**: All new offers automatically expire after 7 days
- **Cron Job**: Runs every 30 minutes to check for expired offers
- **Status Update**: Expired offers are automatically changed from `PENDING` to `REJECTED`

### 2. Database Changes
- **New Field**: `expires_at` timestamp column added to offers table
- **Indexes**: Optimized queries for expiration checks
- **Migration**: Automatic handling of existing offers

### 3. Notifications
- **Seller Notifications**: Automatic notifications when offers expire
- **Real-time Updates**: Immediate status changes in the system

## Technical Implementation

### Database Schema
```sql
-- New column
ALTER TABLE offers ADD COLUMN expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days');

-- Performance indexes
CREATE INDEX idx_offers_expires_at ON offers (expires_at);
CREATE INDEX idx_offers_status_expires_at ON offers (status, expires_at);
```

### Service Methods

#### OfferService.expireOffers()
- Finds all pending offers that have expired
- Updates their status to `REJECTED`
- Sends notifications to sellers
- Returns count of expired offers

#### OfferService.getOffersExpiringSoon(hours)
- Returns offers expiring within specified hours
- Useful for warning notifications

#### OfferService.isOfferExpired(offerId)
- Checks if a specific offer has expired
- Considers both expiration date and status

### Cron Job Configuration
```typescript
@Cron(CronExpression.EVERY_30_MINUTES)
async handleOfferExpiration(): Promise<void>
```

## API Endpoints

### Manual Expiration (for testing)
```typescript
POST /offers/expire-manual
// Manually triggers offer expiration process
```

### Check Expiration Status
```typescript
GET /offers/:id/expired
// Returns boolean indicating if offer has expired
```

## Testing

### Unit Tests
- `offer-expiration.service.spec.ts` - Cron job service tests
- `offer.service.expiration.spec.ts` - Expiration logic tests

### Integration Tests
- `offer-expiration.integration.spec.ts` - End-to-end flow tests

### Test Scenarios
✅ Offer rejected after 7 days  
✅ Offer accepted before expiration → unaffected  
✅ Manual rejection still works  
✅ Multiple offers expired simultaneously  
✅ Error handling in cron job  

## Configuration

### Environment Variables
```env
# Optional: Customize expiration interval (default: 7 days)
OFFER_EXPIRATION_DAYS=7

# Optional: Customize cron frequency (default: every 30 minutes)
OFFER_EXPIRATION_CRON="*/30 * * * *"
```

### Cron Job Timing
- **Production**: Every 30 minutes (balanced performance vs. timeliness)
- **Development**: Can be configured for faster testing
- **Custom**: Configurable via environment variables

## Monitoring & Logging

### Log Levels
- **INFO**: Successful expiration operations
- **DEBUG**: No offers to expire
- **ERROR**: Failed expiration attempts

### Metrics
- Count of expired offers per run
- Execution time of expiration process
- Error rates and types

## Performance Considerations

### Database Optimization
- Indexes on `expires_at` and `(status, expires_at)`
- Batch updates for multiple expired offers
- Efficient queries using `LessThan` operator

### Cron Job Efficiency
- 30-minute intervals balance responsiveness with system load
- Batch processing of multiple offers
- Error handling prevents job failures

## Security & Validation

### Data Integrity
- Only `PENDING` offers can be expired
- `ACCEPTED` and `REJECTED` offers are never modified
- Timestamp validation prevents future expiration dates

### Access Control
- Expiration is automatic (no user input required)
- Manual triggers require appropriate permissions
- Audit trail of all expiration operations

## Future Enhancements

### Potential Improvements
1. **Warning Notifications**: Alert sellers before offers expire
2. **Configurable Expiration**: Different timeframes for different offer types
3. **Analytics Dashboard**: Monitor expiration patterns
4. **Webhook Support**: External system notifications
5. **Retry Logic**: Handle failed expiration attempts

### Scalability
- **Horizontal Scaling**: Multiple cron job instances
- **Queue System**: Asynchronous processing for high volumes
- **Database Partitioning**: Time-based partitioning for large datasets

## Troubleshooting

### Common Issues

#### Offers Not Expiring
- Check cron job is running: `ps aux | grep node`
- Verify database indexes exist
- Check application logs for errors

#### Performance Issues
- Monitor database query performance
- Consider adjusting cron frequency
- Review database indexes

#### Notification Failures
- Verify notification service configuration
- Check user notification preferences
- Review notification service logs

### Debug Commands
```bash
# Check cron job status
npm run start:dev

# Manual expiration trigger
curl -X POST http://localhost:3000/offers/expire-manual

# Check database indexes
\d offers
```

## Migration Guide

### From Previous Version
1. Run database migration: `npm run typeorm migration:run`
2. Restart application to enable cron jobs
3. Verify indexes are created
4. Monitor logs for successful initialization

### Rollback
1. Stop application
2. Run migration rollback: `npm run typeorm migration:revert`
3. Restart application

## Support

For technical support or questions about this feature:
- Check application logs for detailed error information
- Review this documentation for configuration details
- Contact development team for complex issues
