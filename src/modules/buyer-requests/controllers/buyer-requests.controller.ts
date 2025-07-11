import { Controller, Get, Post, Patch, Param, Delete, UseGuards, Request, ParseIntPipe, Query } from "@nestjs/common"
import { BuyerRequestsService } from "../services/buyer-requests.service"
import { CreateBuyerRequestDto } from "../dto/create-buyer-request.dto"
import { UpdateBuyerRequestDto } from "../dto/update-buyer-request.dto"
import { GetBuyerRequestsQueryDto } from "../dto/get-buyer-requests-query.dto"
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../../auth/guards/roles.guard"
import { Roles } from "../../auth/decorators/roles.decorator"
import { Role } from "../../../types/role"

@Controller("buyer-requests")
export class BuyerRequestsController {
  constructor(private readonly buyerRequestsService: BuyerRequestsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUYER)
  create(createBuyerRequestDto: CreateBuyerRequestDto, @Request() req) {
    return this.buyerRequestsService.create(createBuyerRequestDto, req.user.id)
  }

  @Get()
  findAll(query: GetBuyerRequestsQueryDto) {
    return this.buyerRequestsService.findAll(query)
  }

  @Get("search-suggestions")
  getSearchSuggestions(@Query("q") query: string, @Query("limit") limit?: number) {
    return this.buyerRequestsService.getSearchSuggestions(query, limit ? Number(limit) : 5)
  }

  @Get("popular-categories")
  getPopularCategories() {
    return this.buyerRequestsService.getPopularCategories()
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.buyerRequestsService.findOne(id)
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(@Param("id", ParseIntPipe) id: number, updateBuyerRequestDto: UpdateBuyerRequestDto, @Request() req) {
    return this.buyerRequestsService.update(id, updateBuyerRequestDto, req.user.id)
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id", ParseIntPipe) id: number, @Request() req) {
    return this.buyerRequestsService.remove(id, req.user.id)
  }
}
