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

    // TODO: Validate categoryId exists (would need category service/repository)
    // For now, we'll assume it's valid

    const buyerRequest = this.buyerRequestRepository.create({
      ...createDto,
      userId,
      status: BuyerRequestStatus.OPEN,
    })

    const savedRequest = await this.buyerRequestRepository.save(buyerRequest)
    return this.mapToResponseDto(savedRequest)
  }

  async findAll(query: GetBuyerRequestsQueryDto): Promise<PaginatedBuyerRequestsResponseDto> {
    const { page = 1, limit = 10, search, categoryId, minBudget, maxBudget } = query
    const skip = (page - 1) * limit

    const queryBuilder = this.buyerRequestRepository
      .createQueryBuilder("request")
      .leftJoinAndSelect("request.user", "user")
      .where("request.status = :status", { status: BuyerRequestStatus.OPEN })

    if (search) {
      queryBuilder.andWhere("(request.title ILIKE :search OR request.description ILIKE :search)", {
        search: `%${search}%`,
      })
    }

    if (categoryId) {
      queryBuilder.andWhere("request.categoryId = :categoryId", { categoryId })
    }

    if (minBudget !== undefined) {
      queryBuilder.andWhere("request.budgetMax >= :minBudget", { minBudget })
    }

    if (maxBudget !== undefined) {
      queryBuilder.andWhere("request.budgetMin <= :maxBudget", { maxBudget })
    }

    queryBuilder.orderBy("request.createdAt", "DESC").skip(skip).take(limit)

    const [requests, total] = await queryBuilder.getManyAndCount()

    return {
      data: requests.map((request) => this.mapToResponseDto(request)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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

    // Validate budget range if both values are provided
    const newBudgetMin = updateDto.budgetMin ?? request.budgetMin
    const newBudgetMax = updateDto.budgetMax ?? request.budgetMax

    if (newBudgetMin > newBudgetMax) {
      throw new BadRequestException("Budget minimum cannot be greater than budget maximum")
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
    return {
      id: request.id,
      title: request.title,
      description: request.description,
      budgetMin: Number(request.budgetMin),
      budgetMax: Number(request.budgetMax),
      categoryId: request.categoryId,
      status: request.status,
      userId: request.userId,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      user: request.user
        ? {
            id: request.user.id,
            name: request.user.name,
            walletAddress: request.user.walletAddress,
          }
        : undefined,
    }
  }
}
