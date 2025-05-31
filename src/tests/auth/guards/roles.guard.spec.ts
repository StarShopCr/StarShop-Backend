import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from '../../../modules/auth/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { RoleService } from '../../../modules/auth/services/role.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../../../modules/auth/entities/role.entity';
import { UserRole } from '../../../modules/auth/entities/user-role.entity';
import AppDataSource from '../../../config/ormconfig';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let roleService: RoleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          ...AppDataSource.options,
          autoLoadEntities: true,
        }),
        TypeOrmModule.forFeature([Role, UserRole]),
      ],
      providers: [
        RolesGuard,
        RoleService,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
    roleService = module.get<RoleService>(RoleService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  // Add your specific test cases here
});
