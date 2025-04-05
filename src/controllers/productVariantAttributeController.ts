import { Request, Response } from 'express';
import { ProductVariantAttributeService as ProductVariantAttributeServiceClass } from '../services/productVariantAttribute.service';
import asyncHandler from '../middleware/async.middleware';

const ProductVariantAttributeService = new ProductVariantAttributeServiceClass();

//create product variant attribute
export const createProductVariantAttribute = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const productVariantAttribute = await ProductVariantAttributeService.create(req.body);
    if (!productVariantAttribute) {
      res
        .status(404)
        .json({ success: false, message: 'ProductVariantId or AttributeValueId not found' });
    } else {
      res.status(201).json({
        success: true,
        message: 'Product Variant Attribute Created Successfully',
        data: productVariantAttribute,
      });
    }
  }
);

//get all product variant attributes
export const getAllProductVariantAttributes = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const productVariantAttributes = await ProductVariantAttributeService.getAll();
    res.status(200).json({
      success: true,
      message: 'Product Variant Attributes Retrieved',
      data: productVariantAttributes,
    });
  }
);

//get product variant attribute by id
export const getProductVariantAttributeById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const productVariantAttribute = await ProductVariantAttributeService.getById(
      Number(req.params.id)
    );
    if (!productVariantAttribute) {
      res.status(404).json({ success: false, message: 'Product Variant Attribute not found' });
    } else {
      res.status(200).json({
        success: true,
        message: 'Product Variant Attribute Retrieved Successfully',
        data: productVariantAttribute,
      });
    }
  }
);

//update product variant attribute
export const updateProductVariantAttribute = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const productVariantAttribute = await ProductVariantAttributeService.update(
      Number(req.params.id),
      req.body
    );
    if (!productVariantAttribute) {
      res
        .status(404)
        .json({ success: false, message: 'Product Variant Attribute not found or invalid data' });
    } else {
      res.status(200).json({
        success: true,
        message: 'Product Variant Attribute Updated Successfully',
        data: productVariantAttribute,
      });
    }
  }
);

//delete product variant attribute
export const deleteProductVariantAttribute = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const success = await ProductVariantAttributeService.delete(Number(req.params.id));
    if (!success) {
      res.status(404).json({ success: false, message: 'Product Variant Attribute not found' });
    } else {
      res.status(204).send();
    }
  }
);
