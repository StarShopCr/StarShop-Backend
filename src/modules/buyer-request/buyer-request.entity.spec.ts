import { validate } from 'class-validator';
import { BuyerRequest } from './buyer-request.entity';

describe('BuyerRequest Entity', () => {
  it('should throw error if budgetMax < budgetMin', async () => {
    const req = new BuyerRequest();
    req.title = 'Request A';
    req.budgetMin = 100;
    req.budgetMax = 50;
    req.expiresAt = new Date();
    req.status = 'open' as any;

    const errors = await validate(req);
    expect(errors.some(e => e.constraints?.BudgetRange)).toBeTruthy();
  });

  it('should fail if invalid enum is passed', async () => {
    const req = new BuyerRequest();
    req.title = 'Request B';
    req.budgetMin = 50;
    req.budgetMax = 100;
    req.status = 'invalid_status' as any;
    req.expiresAt = new Date();

    const errors = await validate(req);
    expect(errors.some(e => e.property === 'status')).toBeTruthy();
  });
});