import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/modules/users/entities/user.entity';
import { Role } from '../src/modules/auth/entities/role.entity';
import { UserRole } from '../src/modules/auth/entities/user-role.entity';
import { Keypair } from 'stellar-sdk';

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
    const wallet = Keypair.random();
    const userRepo = dataSource.getRepository(User);
    const roleRepo = dataSource.getRepository(Role);
    const userRoleRepo = dataSource.getRepository(UserRole);

    const user = await userRepo.save({ walletAddress: wallet.publicKey() });
    const role = await roleRepo.findOne({ where: { name: 'buyer' } });
    if (role) {
      await userRoleRepo.save({ userId: user.id, roleId: role.id });
    }
    const message = Buffer.from('StarShop Login');
    const signature = wallet.sign(message).toString('base64');

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ walletAddress: wallet.publicKey(), signature })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.token).toBeDefined();
      });
  });

  it('login with invalid signature fails', async () => {
    const wallet = Keypair.random();
    const other = Keypair.random();
    const userRepo = dataSource.getRepository(User);
    await userRepo.save({ walletAddress: wallet.publicKey() });
    const signature = other.sign(Buffer.from('StarShop Login')).toString('base64');

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ walletAddress: wallet.publicKey(), signature })
      .expect(401);
  });

  it('duplicate user registration fails', async () => {
    const wallet = Keypair.random();
    await request(app.getHttpServer())
      .post('/users')
      .send({ walletAddress: wallet.publicKey(), role: 'buyer' })
      .expect(201);

    return request(app.getHttpServer())
      .post('/users')
      .send({ walletAddress: wallet.publicKey(), role: 'buyer' })
      .expect(400);
  });

  it('accessing /auth/me without token returns 401', () => {
    return request(app.getHttpServer()).get('/auth/me').expect(401);
  });
});
