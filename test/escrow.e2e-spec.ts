import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Escrow, EscrowStatus } from '../src/modules/escrows/entities/escrow.entity';
import { Milestone } from '../src/modules/escrows/entities/milestone.entity';
import { Offer, OfferStatus } from '../src/modules/offers/entities/offer.entity';
import { BuyerRequest, BuyerRequestStatus } from '../src/modules/buyer-requests/entities/buyer-request.entity';
import { User } from '../src/modules/users/entities/user.entity';
import { Role } from '../src/modules/auth/entities/role.entity';
import { UserRole } from '../src/modules/auth/entities/user-role.entity';

// Utility to create a user with role
async function createUser(ds: DataSource, wallet: string, roleName: 'buyer' | 'seller'): Promise<User> {
  const userRepo = ds.getRepository(User);
  const roleRepo = ds.getRepository(Role);
  const userRoleRepo = ds.getRepository(UserRole);

  let role = await roleRepo.findOne({ where: { name: roleName } });
  if (!role) {
    role = roleRepo.create({ name: roleName });
    await roleRepo.save(role);
  }

  const user = userRepo.create({ walletAddress: wallet });
  await userRepo.save(user);
  const ur = userRoleRepo.create({ userId: user.id.toString(), roleId: role.id });
  await userRoleRepo.save(ur);
  return user;
}

describe('Escrow Milestone Approval (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let ds: DataSource;
  let buyer: User;
  let seller: User;
  let escrow: Escrow;
  let milestones: Milestone[];
  let authTokenBuyer: string;
  let authTokenSeller: string;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    ds = moduleFixture.get(DataSource);

    buyer = await createUser(ds, 'GBUYERADDRESS', 'buyer');
    seller = await createUser(ds, 'GSELLERADDRESS', 'seller');

    // Create buyer request and accepted offer for context
    const brRepo = ds.getRepository(BuyerRequest);
    const offerRepo = ds.getRepository(Offer);
    const escrowRepo = ds.getRepository(Escrow);
    const milestoneRepo = ds.getRepository(Milestone);

    const br = brRepo.create({
      title: 'Test Request',
      description: 'Need something',
      budgetMin: 10,
      budgetMax: 100,
      categoryId: 1,
      userId: buyer.id.toString(),
      status: BuyerRequestStatus.OPEN,
    });
    await brRepo.save(br);

    const offer = offerRepo.create({
      buyerRequestId: br.id,
      sellerId: seller.id,
      title: 'Offer',
      description: 'desc',
      price: 50,
      deliveryDays: 5,
      status: OfferStatus.ACCEPTED,
    });
    await offerRepo.save(offer);

    escrow = escrowRepo.create({
      offerId: offer.id,
      buyerId: buyer.id,
      sellerId: seller.id,
      totalAmount: 50,
      status: EscrowStatus.PENDING,
    });
    await escrowRepo.save(escrow);

    milestones = await milestoneRepo.save([
      milestoneRepo.create({ escrowId: escrow.id, sequence: 1, title: 'Phase 1', amount: 25 }),
      milestoneRepo.create({ escrowId: escrow.id, sequence: 2, title: 'Phase 2', amount: 25 }),
    ]);

    // Simulate login by generating tokens via registerWithWallet (simplify by hitting auth/register)
    const buyerReg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ walletAddress: buyer.walletAddress, role: 'buyer' });
    authTokenBuyer = buyerReg.headers['set-cookie'][0].split(';')[0].split('=')[1];

    const sellerReg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ walletAddress: seller.walletAddress, role: 'seller' });
    authTokenSeller = sellerReg.headers['set-cookie'][0].split(';')[0].split('=')[1];
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow buyer to approve a milestone', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/escrows/${escrow.id}/milestones/${milestones[0].id}/approve`)
      .set('Cookie', `token=${authTokenBuyer}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('approved');
  });

  it('should block non-buyer (seller) from approving', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/escrows/${escrow.id}/milestones/${milestones[1].id}/approve`)
      .set('Cookie', `token=${authTokenSeller}`)
      .expect(403);
  });

  it('should prevent approving the same milestone twice', async () => {
    // First approval already done in previous test for milestones[0]
    await request(app.getHttpServer())
      .patch(`/api/v1/escrows/${escrow.id}/milestones/${milestones[0].id}/approve`)
      .set('Cookie', `token=${authTokenBuyer}`)
      .expect(400);
  });
});
