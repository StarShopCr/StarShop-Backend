import { Repository } from 'typeorm';
import AppDataSource from '../../config/ormconfig';
import { UserService } from '../../services/User.service';
import { User } from '../../entities/User';

jest.mock('../../config/ormconfig', () => ({
  getRepository: jest.fn(),
}));

describe('UserService', () => {
  let service: UserService;
  let mockRepo: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepo = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

    service = new UserService(AppDataSource); // Pass the mocked AppDataSource
  });

  it('should create a new user', async () => {
    const newUser: Partial<User> = {
      name: 'New User',
      email: 'newuser@example.com',
      walletAddress: '0x07D97198756295A96C2158a23963306f507b2f70',
      role: 'buyer',
    };

    const createdUser = { id: 1, ...newUser } as User;
    mockRepo.create.mockReturnValue(createdUser);
    mockRepo.save.mockResolvedValue(createdUser);

    const result = await service.createUser(newUser);
    expect(result).toEqual(createdUser);
    expect(mockRepo.create).toHaveBeenCalledWith(newUser);
    expect(mockRepo.save).toHaveBeenCalledWith(createdUser);
  });

  it('should not create a user with a duplicate wallet address', async () => {
    const duplicateUser: Partial<User> = {
      name: 'Duplicate User',
      email: 'duplicate@example.com',
      walletAddress: '0x06D97198756295A96C2158a23963306f507b2f69',
      role: 'buyer',
    };

    const error = new Error(
      'The wallet address is already in use. Please use a unique wallet address.'
    ) as any;
    error.code = 'SQLITE_CONSTRAINT';
    mockRepo.save.mockRejectedValue(error);

    await expect(service.createUser(duplicateUser)).rejects.toThrowError(
      'The wallet address is already in use. Please use a unique wallet address.'
    );
  });

  it('should retrieve an existing user by ID', async () => {
    const user = {
      id: 1,
      name: 'Existing User',
      email: 'existing@example.com',
    } as User;
    mockRepo.findOneBy.mockResolvedValue(user);

    const result = await service.getUserById(1);
    expect(result).toEqual(user);
    expect(mockRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
  });

  it('should return null if the user does not exist', async () => {
    mockRepo.findOneBy.mockResolvedValue(null);

    const result = await service.getUserById(9999);
    expect(result).toBeNull();
    expect(mockRepo.findOneBy).toHaveBeenCalledWith({ id: 9999 });
  });

  it("should update a user's information", async () => {
    const user = {
      id: 1,
      name: 'Existing User',
      email: 'existing@example.com',
    } as User;
    const updatedData = { name: 'Updated User' };
    const updatedUser = { ...user, ...updatedData } as User;

    mockRepo.findOneBy.mockResolvedValue(user);
    mockRepo.save.mockResolvedValue(updatedUser);

    const result = await service.updateUser(1, updatedData);
    expect(result).toEqual(updatedUser);
    expect(mockRepo.save).toHaveBeenCalledWith({ ...user, ...updatedData });
  });

  it('should delete a user', async () => {
    mockRepo.delete.mockResolvedValue({ affected: 1 } as any);

    const result = await service.deleteUser(1);
    expect(result).toBe(true);
    expect(mockRepo.delete).toHaveBeenCalledWith(1);
  });

  it('should retrieve all users', async () => {
    const users = [
      { id: 1, name: 'User 1', email: 'user1@example.com' },
      { id: 2, name: 'User 2', email: 'user2@example.com' },
    ] as User[];

    mockRepo.find.mockResolvedValue(users);

    const result = await service.getAllUsers();
    expect(result).toEqual(users);
    expect(mockRepo.find).toHaveBeenCalled();
  });
});
