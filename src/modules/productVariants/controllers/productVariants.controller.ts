import { Controller, Get, Post, Put, Delete, Param, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { ProductVariantService } from '../services/productVariants.service';

@Controller('product-variants')
export class ProductVariantController {
  constructor(private readonly productVariantService: ProductVariantService) {}

  @Get()
  async getAllProductVariants(@Res() res: Response): Promise<void> {
    const productVariants = await this.productVariantService.getAll();
    res.status(200).json({ success: true, data: productVariants });
  }

  @Post()
  async createProductVariant(
    @Body() body: { productId: number; [key: string]: any },
    @Res() res: Response
  ): Promise<void> {
    const { productId, ...variantData } = body;
    const productVariant = await this.productVariantService.create(variantData, productId);
    res.status(201).json({ success: true, data: productVariant });
  }

  @Get(':id')
  async getProductVariantById(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const productVariant = await this.productVariantService.getById(Number(id));
    if (!productVariant) {
      res.status(404).json({ success: false, message: 'ProductVariant not found' });
      return;
    }
    res.status(200).json({ success: true, data: productVariant });
  }

  @Put(':id')
  async updateProductVariant(
    @Param('id') id: string,
    @Body() body: any,
    @Res() res: Response
  ): Promise<void> {
    const productVariant = await this.productVariantService.update(Number(id), body);
    if (!productVariant) {
      res.status(404).json({ success: false, message: 'ProductVariant not found' });
      return;
    }
    res.status(200).json({ success: true, data: productVariant });
  }

  @Delete(':id')
  async deleteProductVariant(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const success = await this.productVariantService.delete(Number(id));
    if (!success) {
      res.status(404).json({ success: false, message: 'ProductVariant not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'ProductVariant deleted' });
  }

  @Put(':id/stock/purchase')
  async updateStockAfterPurchase(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Res() res: Response
  ): Promise<void> {
    const productVariant = await this.productVariantService.updateStockAfterPurchase(
      Number(id),
      amount
    );
    if (!productVariant) {
      res
        .status(404)
        .json({ success: false, message: 'ProductVariant not found or insufficient stock' });
      return;
    }
    res.status(200).json({ success: true, data: productVariant });
  }

  @Put(':id/stock/restore')
  async restoreStockAfterOrderCanceled(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Res() res: Response
  ): Promise<void> {
    const success = await this.productVariantService.restoreAfterOrderCanceled(Number(id), amount);
    if (!success) {
      res.status(404).json({ success: false, message: 'ProductVariant not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Stock restored' });
  }
}
