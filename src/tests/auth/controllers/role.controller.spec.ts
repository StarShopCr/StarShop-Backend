import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from '../../../modules/auth/controllers/role.controller';
import { RoleService } from '../../../modules/auth/services/role.service';

describe('RoleController', () => {
  let controller: RoleController;
  let roleService: RoleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        {
          provide: RoleService,
          useValue: {
            // Mock methods here
          },
        },
      ],
    }).compile();

    controller = module.get<RoleController>(RoleController);
    roleService = module.get<RoleService>(RoleService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Add your specific test cases here
});
