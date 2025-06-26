import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/modules/users/entities/user.entity';
import { Role } from '../src/modules/auth/entities/role.entity';
import { UserRole } from '../src/modules/auth/entities/user-role.entity';
import { Wallet } from 'ethers';

describe('Auth wallet login (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('login with valid signature', async () => {
    const wallet = Wallet.createRandom();
    const userRepo = dataSource.getRepository(User);
    const roleRepo = dataSource.getRepository(Role);
    const userRoleRepo = dataSource.getRepository(UserRole);

    const user = await userRepo.save({ walletAddress: wallet.address });
    const role = await roleRepo.findOne({ where: { name: 'buyer' } });
    if (role) {
      await userRoleRepo.save({ userId: user.id, roleId: role.id });
    }
    const message = 'StarShop Login';
    const signature = await wallet.signMessage(message);

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ walletAddress: wallet.address, signature })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.token).toBeDefined();
      });
  });

  it('login with invalid signature fails', async () => {
    const wallet = Wallet.createRandom();
    const other = Wallet.createRandom();
    const userRepo = dataSource.getRepository(User);
    await userRepo.save({ walletAddress: wallet.address });
    const signature = await other.signMessage('StarShop Login');

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ walletAddress: wallet.address, signature })
      .expect(401);
  });

  it('duplicate user registration fails', async () => {
    const wallet = Wallet.createRandom();
    await request(app.getHttpServer())
      .post('/users')
      .send({ walletAddress: wallet.address, role: 'buyer' })
      .expect(201);

    return request(app.getHttpServer())
      .post('/users')
      .send({ walletAddress: wallet.address, role: 'buyer' })
      .expect(400);
  });

  it('accessing /auth/me without token returns 401', () => {
    return request(app.getHttpServer()).get('/auth/me').expect(401);
  });
});
