import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BuyerRequest, BuyerRequestStatus } from '../entities/buyer-request.entity';
import { User } from '../../users/entities/user.entity';
import { CreateBuyerRequestDto } from '../dto/create-buyer-request.dto';
import { UpdateBuyerRequestDto } from '../dto/update-buyer-request.dto';
import { GetBuyerRequestsQueryDto } from '../dto/get-buyer-requests-query.dto';
import {
  BuyerRequestResponseDto,
  PaginatedBuyerRequestsResponseDto,
} from '../dto/buyer-request-response.dto';

@Injectable()
export class BuyerRequestsService {
  constructor(
    @InjectRepository(BuyerRequest)
    private readonly buyerRequestRepository: Repository<BuyerRequest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  /**
   * Validates that the user's wallet address exists for buyer operations.
   * This is crucial for preventing unauthorized contract calls.
   */
  private async validateBuyerWalletOwnership(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!user.walletAddress) {
      throw new ForbiddenException('User wallet address not found');
    }
  }

  /**
   * Validates that a user can only modify buyer requests they own (wallet ownership validation).
   */
  private async validateBuyerRequestOwnership(
    requestId: number,
    userId: number
  ): Promise<BuyerRequest> {
    const buyerRequest = await this.buyerRequestRepository.findOne({
      where: { id: requestId },
      relations: ['user'],
    });

    if (!buyerRequest) {
      throw new NotFoundException('Buyer request not found');
    }

    if (buyerRequest.userId !== userId) {
      throw new ForbiddenException('You can only modify your own buyer requests');
    }

    // Additional wallet validation to prevent contract call issues
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (buyerRequest.user.walletAddress !== user.walletAddress) {
      throw new ForbiddenException(
        'Wallet ownership mismatch: This buyer request belongs to a different wallet'
      );
    }

    return buyerRequest;
  }

  async create(
    createBuyerRequestDto: CreateBuyerRequestDto,
    userId: string
  ): Promise<BuyerRequestResponseDto> {
    // Validate buyer wallet ownership to prevent unauthorized contract calls
    await this.validateBuyerWalletOwnership(userId);

    const { budgetMin, budgetMax, expiresAt } = createBuyerRequestDto;

    // Validate budget range
    if (budgetMin > budgetMax) {
      throw new BadRequestException('Budget minimum cannot be greater than budget maximum');
    }

    // Validate expiration date if provided
    if (expiresAt) {
      const expirationDate = new Date(expiresAt);
      if (expirationDate <= new Date()) {
        throw new BadRequestException('Expiration date must be in the future');
      }
    }

    // Set default expiration (30 days from now) if not provided
    const defaultExpiresAt = new Date();
    defaultExpiresAt.setDate(defaultExpiresAt.getDate() + 30);

    const buyerRequest = this.buyerRequestRepository.create({
      ...createBuyerRequestDto,
      userId,
      expiresAt: expiresAt ? new Date(expiresAt) : defaultExpiresAt,
      status: BuyerRequestStatus.OPEN,
    });

    const saved = await this.buyerRequestRepository.save(buyerRequest);
    return this.mapToResponseDto(saved);
  }

  async findAll(query: GetBuyerRequestsQueryDto): Promise<PaginatedBuyerRequestsResponseDto> {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      budgetMin,
      budgetMax,
      expiringSoon,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.buildQueryBuilder();

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        "(to_tsvector('english', request.title || ' ' || COALESCE(request.description, '')) @@ plainto_tsquery('english', :search) OR request.title ILIKE :searchLike OR request.description ILIKE :searchLike)",
        { search, searchLike: `%${search}%` }
      );
    }

    if (categoryId) {
      queryBuilder.andWhere('request.categoryId = :categoryId', { categoryId });
    }

    if (budgetMin !== undefined) {
      queryBuilder.andWhere('request.budgetMax >= :budgetMin', { budgetMin });
    }

    if (budgetMax !== undefined) {
      queryBuilder.andWhere('request.budgetMin <= :budgetMax', { budgetMax });
    }

    if (expiringSoon) {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      queryBuilder.andWhere('request.expiresAt <= :threeDaysFromNow', { threeDaysFromNow });
    }

    // Apply sorting
    queryBuilder.orderBy(`request.${sortBy}`, sortOrder);
    if (sortBy !== 'createdAt') {
      queryBuilder.addOrderBy('request.createdAt', 'DESC');
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data: data.map(this.mapToResponseDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      filters: { search, categoryId, budgetMin, budgetMax, expiringSoon },
    };
  }

  async findOne(id: number): Promise<BuyerRequestResponseDto> {
    const buyerRequest = await this.buyerRequestRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!buyerRequest) {
      throw new NotFoundException('Buyer request not found');
    }

    return this.mapToResponseDto(buyerRequest);
  }

  async update(
    id: number,
    updateBuyerRequestDto: UpdateBuyerRequestDto,
    userId: string
  ): Promise<BuyerRequestResponseDto> {
    // Validate wallet ownership before allowing updates that could trigger contract calls
    const buyerRequest = await this.validateBuyerRequestOwnership(id, userId);

    // Check if request is still open
    if (buyerRequest.status !== BuyerRequestStatus.OPEN) {
      throw new ForbiddenException('Cannot update closed or fulfilled requests');
    }

    // Check if request is not expired
    if (buyerRequest.expiresAt && buyerRequest.expiresAt <= new Date()) {
      throw new ForbiddenException('Cannot update expired requests');
    }

    // Validate budget range if both are provided
    const newBudgetMin = updateBuyerRequestDto.budgetMin ?? buyerRequest.budgetMin;
    const newBudgetMax = updateBuyerRequestDto.budgetMax ?? buyerRequest.budgetMax;

    if (newBudgetMin > newBudgetMax) {
      throw new BadRequestException('Budget minimum cannot be greater than budget maximum');
    }

    // Validate expiration date if provided
    if (updateBuyerRequestDto.expiresAt) {
      const expirationDate = new Date(updateBuyerRequestDto.expiresAt);
      if (expirationDate <= new Date()) {
        throw new BadRequestException('Expiration date must be in the future');
      }
    }

    Object.assign(buyerRequest, updateBuyerRequestDto);

    if (updateBuyerRequestDto.expiresAt) {
      buyerRequest.expiresAt = new Date(updateBuyerRequestDto.expiresAt);
    }

    const updated = await this.buyerRequestRepository.save(buyerRequest);
    return this.mapToResponseDto(updated);
  }

  async remove(id: number, userId: number): Promise<void> {
    // Validate wallet ownership before allowing deletions that could affect contracts
    const buyerRequest = await this.validateBuyerRequestOwnership(id, userId);

    await this.buyerRequestRepository.remove(buyerRequest);
  }

  async getSearchSuggestions(query: string, limit = 5): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const queryBuilder = this.buyerRequestRepository
      .createQueryBuilder('request')
      .select('request.title')
      .where('request.status = :status', { status: BuyerRequestStatus.OPEN })
      .andWhere('request.title ILIKE :query', { query: `%${query}%` })
      .addSelect(
        "ts_rank(to_tsvector('english', request.title), plainto_tsquery('english', :search))",
        'rank'
      )
      .orderBy('rank', 'DESC')
      .addOrderBy('request.createdAt', 'DESC')
      .limit(limit);

    const results = await queryBuilder.getRawMany();
    return results.map((r) => r.request_title || r.title);
  }

  async getPopularCategories(): Promise<Array<{ categoryId: number; count: number }>> {
    const results = await this.buyerRequestRepository
      .createQueryBuilder('request')
      .select('request.categoryId', 'categoryId')
      .addSelect('COUNT(*)', 'count')
      .where('request.status = :status', { status: BuyerRequestStatus.OPEN })
      .groupBy('request.categoryId')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return results.map((result) => ({
      categoryId: parseInt(result.categoryId, 10),
      count: parseInt(result.count, 10),
    }));
  }

  private buildQueryBuilder(): SelectQueryBuilder<BuyerRequest> {
    return this.buyerRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.user', 'user')
      .where('request.status = :status', { status: BuyerRequestStatus.OPEN });
  }

  private mapToResponseDto(buyerRequest: BuyerRequest): BuyerRequestResponseDto {
    const now = new Date();
    const expiresAt = buyerRequest.expiresAt;
    const isExpiringSoon = expiresAt
      ? expiresAt <= new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      : false;
    const daysUntilExpiry = expiresAt
      ? Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      : undefined;

    return {
      id: buyerRequest.id,
      title: buyerRequest.title,
      description: buyerRequest.description,
      budgetMin: Number(buyerRequest.budgetMin),
      budgetMax: Number(buyerRequest.budgetMax),
      categoryId: buyerRequest.categoryId,
      status: buyerRequest.status,
      userId: buyerRequest.userId,
      expiresAt: buyerRequest.expiresAt,
      createdAt: buyerRequest.createdAt,
      updatedAt: buyerRequest.updatedAt,
      user: buyerRequest.user
        ? {
            id: buyerRequest.user.id,
            name: buyerRequest.user.name || '',
            walletAddress: buyerRequest.user.walletAddress || '',
          }
        : undefined,
      isExpiringSoon,
      daysUntilExpiry,
    };
  }

  /**
   * Manually close a buyer request (buyer-only access)
   */
  async closeRequest(id: number, userId: string): Promise<BuyerRequestResponseDto> {
    const buyerRequest = await this.buyerRequestRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!buyerRequest) {
      throw new NotFoundException('Buyer request not found');
    }

    // Only the buyer who created the request can close it
    if (buyerRequest.userId !== userId) {
      throw new ForbiddenException('You can only close your own buyer requests');
    }

    // Check if already closed
    if (buyerRequest.status === BuyerRequestStatus.CLOSED) {
      throw new BadRequestException('Buyer request is already closed');
    }

    // Update status to closed
    buyerRequest.status = BuyerRequestStatus.CLOSED;
    const updatedRequest = await this.buyerRequestRepository.save(buyerRequest);

    return this.mapToResponseDto(updatedRequest);
  }
}
