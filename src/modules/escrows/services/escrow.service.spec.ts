import { Test, TestingModule } from '@nestjs/testing';
import { EscrowService } from './escrow.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Escrow } from '../entities/escrow.entity';
import { Milestone, MilestoneStatus } from '../entities/milestone.entity';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

// Simple in-memory mocks
class MockRepo<T extends { id?: any }> {
  private entities: T[] = [];
  findOne = jest.fn(async (options: any) => {
    if (options.where?.id) return this.entities.find(e => e.id === options.where.id) || null;
    if (options.where?.id && options.relations) return this.entities.find(e => e.id === options.where.id) || null;
    return null;
  });
  find = jest.fn(async (options: any) => this.entities.filter(e => (options.where?.escrowId ? (e as any).escrowId === options.where.escrowId : true)));
  save = jest.fn(async (entity: T) => {
    const existingIndex = this.entities.findIndex(e => e.id === entity.id);
    if (existingIndex >= 0) this.entities[existingIndex] = entity;
    else this.entities.push(entity);
    return entity;
  });
  seed(data: T[]) { this.entities = data; }
}

const mockTransaction = (cb: any) => cb({
  findOne: (entity: any, opts: any) => entity === Milestone ? milestoneRepo.findOne(opts) : escrowRepo.findOne(opts),
  find: (entity: any, opts: any) => milestoneRepo.find(opts),
  save: (entity: any) => Array.isArray(entity) ? Promise.all(entity.map(e => (e instanceof Milestone ? milestoneRepo.save(e) : escrowRepo.save(e)))) : (entity instanceof Milestone ? milestoneRepo.save(entity) : escrowRepo.save(entity))
});

let escrowRepo: MockRepo<Escrow>;
let milestoneRepo: MockRepo<Milestone>;

describe('EscrowService - changeMilestoneStatus', () => {
  let service: EscrowService;

  beforeEach(async () => {
    escrowRepo = new MockRepo<Escrow>();
    milestoneRepo = new MockRepo<Milestone>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscrowService,
        { provide: getRepositoryToken(Escrow), useValue: escrowRepo },
        { provide: getRepositoryToken(Milestone), useValue: milestoneRepo },
        { provide: DataSource, useValue: { transaction: jest.fn(mockTransaction) } },
      ],
    }).compile();

    service = module.get<EscrowService>(EscrowService);

    // Seed data
    escrowRepo.seed([{ id: 'escrow1', sellerId: 10, buyerId: 20 } as any]);
    milestoneRepo.seed([
      { id: 'm1', escrowId: 'escrow1', status: MilestoneStatus.PENDING } as any,
    ]);
  });

  it('should change status from pending to ready by seller', async () => {
    const result = await service.changeMilestoneStatus('escrow1', 'm1', 10, MilestoneStatus.READY);
    expect(result.status).toBe(MilestoneStatus.READY);
  });

  it('should block non-seller from changing status', async () => {
    await expect(
      service.changeMilestoneStatus('escrow1', 'm1', 999, MilestoneStatus.READY)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should block backwards transition', async () => {
    await service.changeMilestoneStatus('escrow1', 'm1', 10, MilestoneStatus.READY);
    await service.changeMilestoneStatus('escrow1', 'm1', 10, MilestoneStatus.IN_PROGRESS);
    await expect(
      service.changeMilestoneStatus('escrow1', 'm1', 10, MilestoneStatus.READY)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should be idempotent if same status provided', async () => {
    await service.changeMilestoneStatus('escrow1', 'm1', 10, MilestoneStatus.READY);
    const result = await service.changeMilestoneStatus('escrow1', 'm1', 10, MilestoneStatus.READY);
    expect(result.status).toBe(MilestoneStatus.READY);
  });

  it('should not allow change after approval', async () => {
    // Simulate approved milestone
    milestoneRepo.seed([{ id: 'm1', escrowId: 'escrow1', status: MilestoneStatus.APPROVED } as any]);
    await expect(
      service.changeMilestoneStatus('escrow1', 'm1', 10, MilestoneStatus.DELIVERED)
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
