import type { BuyerRequestStatus } from "../entities/buyer-request.entity"

export class BuyerRequestResponseDto {
  id: number
  title: string
  description: string
  budgetMin: number
  budgetMax: number
  categoryId: number
  status: BuyerRequestStatus
  userId: number
  createdAt: Date
  updatedAt: Date
  user?: {
    id: number
    name: string
    walletAddress: string
  }
}

export class PaginatedBuyerRequestsResponseDto {
  data: BuyerRequestResponseDto[]
  total: number
  page: number
  limit: number
  totalPages: number
}
