import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiSuccessResponse, ApiErrorResponse } from '../../../common/decorators/api-response.decorator';
import { ProductService } from '../services/product.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { BadRequestError, ForbiddenError } from '../../../utils/errors';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiSuccessResponse(200, 'Products retrieved successfully')
  async getAllProducts(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('sort') sort?: string
  ) {
    const products = await this.productService.getAllProducts({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      category,
      sort,
    });

    return { success: true, data: products };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiSuccessResponse(200, 'Product retrieved successfully')
  @ApiErrorResponse(404, 'Product not found')
  async getProductById(@Param('id') id: string) {
    const product = await this.productService.getProductById(parseInt(id));
    return { success: true, data: product };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiSuccessResponse(201, 'Product created successfully')
  async createProduct(@Body() createProductDto: any, @Request() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestError('User not authenticated');
    }

    const { name, description, price, category, images } = createProductDto;
    if (!name || !description || !price || !category) {
      throw new BadRequestError('Missing required fields');
    }

    const product = await this.productService.createProduct({
      name,
      description,
      price,
      category,
      images,
      sellerId: Number(userId),
    });

    return { success: true, data: product };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  @ApiSuccessResponse(200, 'Product updated successfully')
  async updateProduct(@Param('id') id: string, @Body() updateProductDto: any, @Request() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestError('User not authenticated');
    }

    const product = await this.productService.getProductById(parseInt(id));

    if (product.sellerId !== userId) {
      throw new ForbiddenError('Not authorized to update this product');
    }

    const { name, description, price, category, images } = updateProductDto;
    const updatedProduct = await this.productService.updateProduct(parseInt(id), {
      name,
      description,
      price,
      category,
      images,
    });

    return { success: true, data: updatedProduct };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product' })
  @ApiSuccessResponse(200, 'Product deleted successfully')
  async deleteProduct(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestError('User not authenticated');
    }

    const product = await this.productService.getProductById(parseInt(id));

    if (product.sellerId !== userId) {
      throw new ForbiddenError('Not authorized to delete this product');
    }

    await this.productService.deleteProduct(parseInt(id));
    return { success: true, message: 'Product deleted successfully' };
  }
}
