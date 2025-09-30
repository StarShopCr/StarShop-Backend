import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EscrowModule } from '../escrow.module';
import { EscrowAccount } from '../entities/escrow-account.entity';
import { Milestone } from '../entities/milestone.entity';
import { EscrowStatus } from '../enums/escrow-status.enum';
import { MilestoneStatus } from '../enums/milestone-status.enum';
import { ReleaseFundsType } from '../dto/release-funds.dto';
import { AuthGuard } from '../../auth/guards/auth.guard';

describe('EscrowController (e2e)', () => {
  let app: INestApplication;
  let escrowRepository: Repository<EscrowAccount>;
  let milestoneRepository: Repository<Milestone>;

  const mockBuyerId = 1;
  const mockSellerId = 2;
  const mockOfferId = 'offer-uuid-123';

  // Mock user data for different roles

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [EscrowAccount, Milestone],
          synchronize: true,
          logging: false,
        }),
        EscrowModule,
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const request = context.switchToHttp().getRequest();
          // Mock authentication based on test headers
          if (request.headers['test-user-id']) {
            request.user = {
              id: parseInt(request.headers['test-user-id']),
              role: request.headers['test-user-role']?.split(',') || ['buyer'],
            };
            return true;
          }
          return false;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    escrowRepository = moduleFixture.get<Repository<EscrowAccount>>(
      getRepositoryToken(EscrowAccount),
    );
    milestoneRepository = moduleFixture.get<Repository<Milestone>>(
      getRepositoryToken(Milestone),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database
    await milestoneRepository.clear();
    await escrowRepository.clear();
  });

  describe('/escrow/release-funds (POST)', () => {
    let escrowAccount: EscrowAccount;
    let approvedMilestone: Milestone;
    let unapprovedMilestone: Milestone;

    beforeEach(async () => {
      // Create test escrow account
      escrowAccount = escrowRepository.create({
        offerId: mockOfferId,
        buyerId: mockBuyerId,
        sellerId: mockSellerId,
        totalAmount: 1000,
        releasedAmount: 0,
        status: EscrowStatus.FUNDED,
      });
      await escrowRepository.save(escrowAccount);

      // Create approved milestone
      approvedMilestone = milestoneRepository.create({
        escrowAccountId: escrowAccount.id,
        title: 'Phase 1',
        description: 'Development phase 1',
        amount: 500,
        status: MilestoneStatus.APPROVED,
        buyerApproved: true,
        approvedAt: new Date(),
      });
      await milestoneRepository.save(approvedMilestone);

      // Create unapproved milestone
      unapprovedMilestone = milestoneRepository.create({
        escrowAccountId: escrowAccount.id,
        title: 'Phase 2',
        description: 'Development phase 2',
        amount: 500,
        status: MilestoneStatus.PENDING,
        buyerApproved: false,
      });
      await milestoneRepository.save(unapprovedMilestone);
    });

    it('should release funds successfully when milestone is approved', () => {
      return request(app.getHttpServer())
        .post('/escrow/release-funds')
        .set('test-user-id', mockSellerId.toString())
        .set('test-user-role', 'seller')
        .send({
          milestoneId: approvedMilestone.id,
          type: ReleaseFundsType.MILESTONE,
          notes: 'Work completed successfully',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('Funds released successfully');
          expect(res.body.data.milestoneId).toBe(approvedMilestone.id);
          expect(res.body.data.amount).toBe(500);
          expect(res.body.data.status).toBe(MilestoneStatus.RELEASED);
        });
    });

    it('should fail when milestone is not approved', () => {
      return request(app.getHttpServer())
        .post('/escrow/release-funds')
        .set('test-user-id', mockSellerId.toString())
        .set('test-user-role', 'seller')
        .send({
          milestoneId: unapprovedMilestone.id,
          type: ReleaseFundsType.MILESTONE,
          notes: 'Trying to release unapproved milestone',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('must be approved by buyer');
        });
    });

    it('should fail when user is not the seller', () => {
      return request(app.getHttpServer())
        .post('/escrow/release-funds')
        .set('test-user-id', mockBuyerId.toString())
        .set('test-user-role', 'buyer')
        .send({
          milestoneId: approvedMilestone.id,
          type: ReleaseFundsType.MILESTONE,
        })
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain('Only the seller can release funds');
        });
    });

    it('should prevent double release', async () => {
      // First release
      await request(app.getHttpServer())
        .post('/escrow/release-funds')
        .set('test-user-id', mockSellerId.toString())
        .set('test-user-role', 'seller')
        .send({
          milestoneId: approvedMilestone.id,
          type: ReleaseFundsType.MILESTONE,
        })
        .expect(200);

      // Second release attempt should fail
      return request(app.getHttpServer())
        .post('/escrow/release-funds')
        .set('test-user-id', mockSellerId.toString())
        .set('test-user-role', 'seller')
        .send({
          milestoneId: approvedMilestone.id,
          type: ReleaseFundsType.MILESTONE,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('already been released');
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/escrow/release-funds')
        .send({
          milestoneId: approvedMilestone.id,
          type: ReleaseFundsType.MILESTONE,
        })
        .expect(403);
    });
  });

  describe('/escrow/approve-milestone (POST)', () => {
    let escrowAccount: EscrowAccount;
    let pendingMilestone: Milestone;

    beforeEach(async () => {
      // Create test escrow account
      escrowAccount = escrowRepository.create({
        offerId: mockOfferId,
        buyerId: mockBuyerId,
        sellerId: mockSellerId,
        totalAmount: 1000,
        status: EscrowStatus.FUNDED,
      });
      await escrowRepository.save(escrowAccount);

      // Create pending milestone
      pendingMilestone = milestoneRepository.create({
        escrowAccountId: escrowAccount.id,
        title: 'Phase 1',
        description: 'Development phase 1',
        amount: 500,
        status: MilestoneStatus.PENDING,
        buyerApproved: false,
      });
      await milestoneRepository.save(pendingMilestone);
    });

    it('should approve milestone successfully', () => {
      return request(app.getHttpServer())
        .post('/escrow/approve-milestone')
        .set('test-user-id', mockBuyerId.toString())
        .set('test-user-role', 'buyer')
        .send({
          milestoneId: pendingMilestone.id,
          approved: true,
          notes: 'Work looks good',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('Milestone approved successfully');
        });
    });

    it('should reject milestone successfully', () => {
      return request(app.getHttpServer())
        .post('/escrow/approve-milestone')
        .set('test-user-id', mockBuyerId.toString())
        .set('test-user-role', 'buyer')
        .send({
          milestoneId: pendingMilestone.id,
          approved: false,
          notes: 'Needs more work',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('Milestone rejected');
        });
    });

    it('should fail when user is not the buyer', () => {
      return request(app.getHttpServer())
        .post('/escrow/approve-milestone')
        .set('test-user-id', mockSellerId.toString())
        .set('test-user-role', 'seller')
        .send({
          milestoneId: pendingMilestone.id,
          approved: true,
        })
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain('Only the buyer can approve');
        });
    });
  });

  describe('/escrow/offer/:offerId (GET)', () => {
    let escrowAccount: EscrowAccount;

    beforeEach(async () => {
      escrowAccount = escrowRepository.create({
        offerId: mockOfferId,
        buyerId: mockBuyerId,
        sellerId: mockSellerId,
        totalAmount: 1000,
        status: EscrowStatus.FUNDED,
      });
      await escrowRepository.save(escrowAccount);
    });

    it('should get escrow account for buyer', () => {
      return request(app.getHttpServer())
        .get(`/escrow/offer/${mockOfferId}`)
        .set('test-user-id', mockBuyerId.toString())
        .set('test-user-role', 'buyer')
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(escrowAccount.id);
          expect(res.body.offerId).toBe(mockOfferId);
          expect(res.body.totalAmount).toBe(1000);
        });
    });

    it('should get escrow account for seller', () => {
      return request(app.getHttpServer())
        .get(`/escrow/offer/${mockOfferId}`)
        .set('test-user-id', mockSellerId.toString())
        .set('test-user-role', 'seller')
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(escrowAccount.id);
          expect(res.body.offerId).toBe(mockOfferId);
        });
    });

    it('should fail for unauthorized user', () => {
      return request(app.getHttpServer())
        .get(`/escrow/offer/${mockOfferId}`)
        .set('test-user-id', '999')
        .set('test-user-role', 'buyer')
        .expect(403);
    });
  });
});
