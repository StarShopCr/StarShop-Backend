import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from '../../../modules/auth/services/role.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../../../modules/auth/entities/role.entity';
import { UserRole } from '../../../modules/auth/entities/user-role.entity';
import AppDataSource from '../../../config/ormconfig';

describe('RoleService', () => {
  let service: RoleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          ...AppDataSource.options,
          autoLoadEntities: true,
        }),
        TypeOrmModule.forFeature([Role, UserRole]),
      ],
      providers: [RoleService],
    }).compile();

    service = module.get<RoleService>(RoleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add your specific test cases here
});
