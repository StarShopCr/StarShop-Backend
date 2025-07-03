import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common"
import { Repository } from "typeorm"
import { BuyerRequest, BuyerRequestStatus } from "../entities/buyer-request.entity"
import { CreateBuyerRequestDto } from "../dto/create-buyer-request.dto"
import { UpdateBuyerRequestDto } from "../dto/update-buyer-request.dto"
import { GetBuyerRequestsQueryDto } from "../dto/get-buyer-requests-query.dto"
import { BuyerRequestResponseDto, PaginatedBuyerRequestsResponseDto } from "../dto/buyer-request-response.dto"
import { InjectRepository } from "@nestjs/typeorm"

@Injectable()
export class BuyerRequestsService {
  constructor(
    @InjectRepository(BuyerRequest)
    private readonly buyerRequestRepository: Repository<BuyerRequest>,
  ) {}

  async create(createDto: CreateBuyerRequestDto, userId: number): Promise<BuyerRequestResponseDto> {
    // Validate budget range
    if (createDto.budgetMin > createDto.budgetMax) {
      throw new BadRequestException("Budget minimum cannot be greater than budget maximum")
    }

    // Set default expiration if not provided (30 days from now)
    const expiresAt = createDto.expiresAt
      ? new Date(createDto.expiresAt)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    // Validate expiration date is in the future
    if (expiresAt <= new Date()) {
      throw new BadRequestException("Expiration date must be in the future")
    }

    // TODO: Validate categoryId exists (would need category service/repository)
    // For now, we'll assume it's valid

    const buyerRequest = this.buyerRequestRepository.create({
      ...createDto,
      userId,
      expiresAt,
      status: BuyerRequestStatus.OPEN,
    })

    const savedRequest = await this.buyerRequestRepository.save(buyerRequest)
    return this.mapToResponseDto(savedRequest)
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
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = query

    const skip = (page - 1) * limit

    const queryBuilder = this.buyerRequestRepository
      .createQueryBuilder("request")
      .leftJoinAndSelect("request.user", "user")
      .where("request.status = :status", { status: BuyerRequestStatus.OPEN })
      .andWhere("(request.expiresAt IS NULL OR request.expiresAt > :now)", { now: new Date() })

    // Full-text search using PostgreSQL tsvector
    if (search) {
      queryBuilder.andWhere(
        `(
          to_tsvector('english', request.title || ' ' || COALESCE(request.description, '')) 
          @@ plainto_tsquery('english', :search)
          OR request.title ILIKE :searchLike 
          OR request.description ILIKE :searchLike
        )`,
        {
          search: search.trim(),
          searchLike: `%${search.trim()}%`,
        },
      )
    }

    // Category filter
    if (categoryId) {
      queryBuilder.andWhere("request.categoryId = :categoryId", { categoryId })
    }

    // Budget filters
    if (budgetMin !== undefined) {
      queryBuilder.andWhere("request.budgetMax >= :budgetMin", { budgetMin })
    }

    if (budgetMax !== undefined) {
      queryBuilder.andWhere("request.budgetMin <= :budgetMax", { budgetMax })
    }

    // Expiring soon filter (within 3 days)
    if (expiringSoon) {
      const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      queryBuilder.andWhere("request.expiresAt <= :threeDaysFromNow", { threeDaysFromNow })
    }

    // Sorting
    const validSortFields = ["createdAt", "budgetMin", "budgetMax", "expiresAt"]
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt"
    queryBuilder.orderBy(`request.${sortField}`, sortOrder === "ASC" ? "ASC" : "DESC")

    // Add secondary sort by createdAt if not already sorting by it
    if (sortField !== "createdAt") {
      queryBuilder.addOrderBy("request.createdAt", "DESC")
    }

    queryBuilder.skip(skip).take(limit)

    const [requests, total] = await queryBuilder.getManyAndCount()

    return {
      data: requests.map((request) => this.mapToResponseDto(request)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      filters: {
        search,
        categoryId,
        budgetMin,
        budgetMax,
        expiringSoon,
      },
    }
  }

  async findOne(id: number): Promise<BuyerRequestResponseDto> {
    const request = await this.buyerRequestRepository.findOne({
      where: { id },
      relations: ["user"],
    })

    if (!request) {
      throw new NotFoundException("Buyer request not found")
    }

    return this.mapToResponseDto(request)
  }

  async update(id: number, updateDto: UpdateBuyerRequestDto, userId: number): Promise<BuyerRequestResponseDto> {
    const request = await this.buyerRequestRepository.findOne({ where: { id } })

    if (!request) {
      throw new NotFoundException("Buyer request not found")
    }

    // Check ownership
    if (request.userId !== userId) {
      throw new ForbiddenException("You can only edit your own requests")
    }

    // Check if request is still open
    if (request.status !== BuyerRequestStatus.OPEN) {
      throw new ForbiddenException("Cannot edit closed requests")
    }

    // Check if request has expired
    if (request.expiresAt && request.expiresAt <= new Date()) {
      throw new ForbiddenException("Cannot edit expired requests")
    }

    // Validate budget range if both values are provided
    const newBudgetMin = updateDto.budgetMin ?? request.budgetMin
    const newBudgetMax = updateDto.budgetMax ?? request.budgetMax

    if (newBudgetMin > newBudgetMax) {
      throw new BadRequestException("Budget minimum cannot be greater than budget maximum")
    }

    // Validate expiration date if provided
    if (updateDto.expiresAt) {
      const newExpiresAt = new Date(updateDto.expiresAt)
      if (newExpiresAt <= new Date()) {
        throw new BadRequestException("Expiration date must be in the future")
      }
      updateDto.expiresAt = newExpiresAt.toISOString()
    }

    // TODO: Validate categoryId exists if provided

    Object.assign(request, updateDto)
    const updatedRequest = await this.buyerRequestRepository.save(request)

    return this.mapToResponseDto(updatedRequest)
  }

  async remove(id: number, userId: number): Promise<void> {
    const request = await this.buyerRequestRepository.findOne({ where: { id } })

    if (!request) {
      throw new NotFoundException("Buyer request not found")
    }

    // Check ownership
    if (request.userId !== userId) {
      throw new ForbiddenException("You can only delete your own requests")
    }

    // Soft delete by marking as closed
    request.status = BuyerRequestStatus.CLOSED
    await this.buyerRequestRepository.save(request)
  }

  private mapToResponseDto(request: BuyerRequest): BuyerRequestResponseDto {
    const now = new Date()
    const isExpiringSoon = request.expiresAt
      ? request.expiresAt.getTime() - now.getTime() <= 3 * 24 * 60 * 60 * 1000
      : false

    const daysUntilExpiry = request.expiresAt
      ? Math.ceil((request.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      : undefined

    return {
      id: request.id,
      title: request.title,
      description: request.description,
      budgetMin: Number(request.budgetMin),
      budgetMax: Number(request.budgetMax),
      categoryId: request.categoryId,
      status: request.status,
      userId: request.userId,
      expiresAt: request.expiresAt,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      isExpiringSoon,
      daysUntilExpiry,
      user: request.user
        ? {
            id: request.user.id,
            name: request.user.name,
            walletAddress: request.user.walletAddress,
          }
        : undefined,
    }
  }

  async getSearchSuggestions(query: string, limit = 5): Promise<string[]> {
    if (!query || query.trim().length < 2) {
      return []
    }

    const suggestions = await this.buyerRequestRepository
      .createQueryBuilder("request")
      .select("DISTINCT request.title", "title")
      .where("request.status = :status", { status: BuyerRequestStatus.OPEN })
      .andWhere("request.title ILIKE :query", { query: `%${query.trim()}%` })
      .orderBy("LENGTH(request.title)", "ASC")
      .limit(limit)
      .getRawMany()

    return suggestions.map((s) => s.title)
  }

  async getPopularCategories(): Promise<Array<{ categoryId: number; count: number }>> {
    const categories = await this.buyerRequestRepository
      .createQueryBuilder("request")
      .select("request.categoryId", "categoryId")
      .addSelect("COUNT(*)", "count")
      .where("request.status = :status", { status: BuyerRequestStatus.OPEN })
      .andWhere("(request.expiresAt IS NULL OR request.expiresAt > :now)", { now: new Date() })
      .groupBy("request.categoryId")
      .orderBy("count", "DESC")
      .limit(10)
      .getRawMany()

    return categories.map((c) => ({
      categoryId: Number(c.categoryId),
      count: Number(c.count),
    }))
  }
}
