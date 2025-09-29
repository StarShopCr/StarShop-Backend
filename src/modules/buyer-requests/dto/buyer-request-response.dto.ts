import type { BuyerRequestStatus } from "../entities/buyer-request.entity"

export interface BuyerRequestResponseDto {
  id: number
  title: string
  description?: string
  budgetMin: number
  budgetMax: number
  categoryId: number
  status: BuyerRequestStatus
  userId: string
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
  user?: {
    id: string
    name: string
    walletAddress: string
  }
  isExpiringSoon?: boolean
  daysUntilExpiry?: number
}

export interface PaginatedBuyerRequestsResponseDto {
  data: BuyerRequestResponseDto[]
  total: number
  page: number
  limit: number
  totalPages: number
  filters?: {
    search?: string
    categoryId?: number
    budgetMin?: number
    budgetMax?: number
    expiringSoon?: boolean
  }
}
