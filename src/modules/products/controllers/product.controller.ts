import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ProductService } from '../services/product.service';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async getAllProducts(
    @Query('category') category: string,
    @Query('minPrice') minPrice: string,
    @Query('maxPrice') maxPrice: string,
    @Query('availability') availability: string,
    @Query('minRating') minRating: string,
    @Query('sortBy') sortBy: 'price' | 'createdAt' | 'popularity',
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC',
    @Res() res: Response
  ): Promise<void> {
    const products = await this.productService.getAll({
      category: category ? Number(category) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      availability:
        availability === 'inStock' ? true : availability === 'outOfStock' ? false : undefined,
      minRating: minRating ? Number(minRating) : undefined,
      sortBy,
      sortOrder,
    });

    res.status(200).json({ success: true, data: products });
  }
}
