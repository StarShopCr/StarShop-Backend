import { Controller, Get, Post, Put, Delete, Param, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { ProductTypeService } from '../services/productTypes.service';

@Controller('product-types')
export class ProductTypeController {
  constructor(private readonly productTypeService: ProductTypeService) {}

  @Get()
  async getAllProductTypes(@Res() res: Response): Promise<void> {
    const productTypes = await this.productTypeService.getAll();
    res.status(200).json({ success: true, data: productTypes });
  }

  @Post()
  async createProductType(@Body() body: any, @Res() res: Response): Promise<void> {
    const productType = await this.productTypeService.create(body);
    res.status(201).json({ success: true, data: productType });
  }

  @Get(':id')
  async getProductTypeById(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const productType = await this.productTypeService.getById(Number(id));
    if (!productType) {
      res.status(404).json({ success: false, message: 'ProductType not found' });
      return;
    }
    res.status(200).json({ success: true, data: productType });
  }

  @Put(':id')
  async updateProductType(
    @Param('id') id: string,
    @Body() body: any,
    @Res() res: Response
  ): Promise<void> {
    const productType = await this.productTypeService.update(Number(id), body);
    if (!productType) {
      res.status(404).json({ success: false, message: 'ProductType not found' });
      return;
    }
    res.status(200).json({ success: true, data: productType });
  }

  @Delete(':id')
  async deleteProductType(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const success = await this.productTypeService.delete(Number(id));
    if (!success) {
      res.status(404).json({ success: false, message: 'ProductType not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'ProductType deleted' });
  }
}
