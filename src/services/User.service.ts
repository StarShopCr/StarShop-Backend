import { Repository } from 'typeorm';
import { User } from '../entities/User';
import AppDataSource from '../config/ormconfig';
import { NotFoundError, BadRequestError } from '../utils/errors';

export class UserService {
  private userRepository: Repository<User>;

  constructor(dataSource: typeof AppDataSource) {
    this.userRepository = dataSource.getRepository(User);
  }

  async createUser(data: Partial<User>): Promise<User> {
    try {
      const user = this.userRepository.create(data);
      return await this.userRepository.save(user);
    } catch (error: any) {
      if (error.code === '23505' || error.code === 'SQLITE_CONSTRAINT') {
        if (error.message.includes('UQ_fc71cd6fb73f95244b23e2ef113')) {
          throw new BadRequestError(
            'The wallet address is already in use. Please use a unique wallet address.'
          );
        }
      }
      throw new BadRequestError(`Database Error: ${error.message}`);
    }
  }

  async getUserById(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found.`);
    }
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    try {
      const user = await this.userRepository.findOneBy({ id });
      if (!user) {
        throw new NotFoundError(`User with ID ${id} not found.`);
      }
      Object.assign(user, data);
      return await this.userRepository.save(user);
    } catch (error: any) {
      if (error.code === '23505' || error.code === 'SQLITE_CONSTRAINT') {
        if (error.message.includes('UQ_fc71cd6fb73f95244b23e2ef113')) {
          throw new BadRequestError(
            'The wallet address is already in use. Please use a unique wallet address.'
          );
        }
      }
      throw new BadRequestError(`Database Error: ${error.message}`);
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await this.userRepository.delete(id);
      if (result.affected !== 1) {
        throw new NotFoundError(`User with ID ${id} not found or could not be deleted.`);
      }
      return true;
    } catch (error: any) {
      throw new BadRequestError(`Database Error: ${error.message}`);
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await this.userRepository.find();
    } catch (error: any) {
      throw new BadRequestError(`Database Error: ${error.message}`);
    }
  }
}
