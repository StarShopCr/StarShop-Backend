import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../modules/auth/services/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../../services/User.service';
import { RoleService } from '../../../modules/auth/services/role.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../../entities/User';
import { Role } from '../../../modules/auth/entities/role.entity';
import { UserRole } from '../../../modules/auth/entities/user-role.entity';
import AppDataSource from '../../../config/ormconfig';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let userService: UserService;
  let roleService: RoleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          ...AppDataSource.options,
          autoLoadEntities: true,
        }),
        TypeOrmModule.forFeature([User, Role, UserRole]),
      ],
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            getUserById: jest.fn(),
          },
        },
        RoleService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    userService = module.get<UserService>(UserService);
    roleService = module.get<RoleService>(RoleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add your specific test cases here
});
