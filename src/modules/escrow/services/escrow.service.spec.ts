import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EscrowService } from './escrow.service';
import { BlockchainService } from './blockchain.service';
import { Escrow } from '../entities/escrow.entity';
import { EscrowFundingTx } from '../entities/escrow-funding-tx.entity';
import { ForbiddenError, NotFoundError } from '../../../middleware/error.classes';
import { DataSource } from 'typeorm';

// Using sqlite memory for isolated unit test (if configured) else skip actual db ops

describe('EscrowService', () => {
  let service: EscrowService;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
            dropSchema: true,
            entities: [Escrow, EscrowFundingTx],
            synchronize: true,
          }),
        TypeOrmModule.forFeature([Escrow, EscrowFundingTx]),
      ],
      providers: [EscrowService, BlockchainService],
    }).compile();

    service = moduleRef.get(EscrowService);
    dataSource = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('funds escrow with correct signer', async () => {
    const repo = dataSource.getRepository(Escrow);
    const escrow = repo.create({ expectedSigner: 'SIGNER1', balance: '0' });
    await repo.save(escrow);

    const result = await service.fundEscrow(escrow.id, { signer: 'SIGNER1', amount: 50 });
    expect(result.txHash).toMatch(/^0x/);
    expect(result.balance).toBe('50');
  });

  it('throws ForbiddenError for wrong signer', async () => {
    const repo = dataSource.getRepository(Escrow);
    const escrow = repo.create({ expectedSigner: 'SIGNER2', balance: '0' });
    await repo.save(escrow);

    await expect(
      service.fundEscrow(escrow.id, { signer: 'OTHER', amount: 10 })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('throws NotFoundError for missing escrow', async () => {
    await expect(
      service.fundEscrow('00000000-0000-0000-0000-000000000000', { signer: 'A', amount: 1 })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
