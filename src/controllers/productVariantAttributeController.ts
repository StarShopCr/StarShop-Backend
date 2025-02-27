import { Request, Response } from 'express';
import { ProductVariantAttributeService as ProductVariantAttributeServiceClass } from '../services/productVariantAttribute.service';

const ProductVariantAttributeService = new ProductVariantAttributeServiceClass();

//create product variant attribute
export const createProductVariantAttribute = async (req: Request, res: Response): Promise<void> => {
  try {
    const productVariantAttribute = await ProductVariantAttributeService.create(req.body);
    if (!productVariantAttribute) {
      res
        .status(404)
        .json({ success: false, message: 'ProductVariantId or AttributeValueId not found' });
    } else {
      res
        .status(201)
        .json({
          success: true,
          message: 'Product Variant Attribute Created Successfully',
          data: productVariantAttribute,
        });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

//get all product variant attributes
export const getAllProductVariantAttributes = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const productVariantAttributes = await ProductVariantAttributeService.getAll();
    res
      .status(200)
      .json({
        success: true,
        message: 'Product Variant Attributes Retrieved',
        data: productVariantAttributes,
      });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

//get product variant attribute by id
export const getProductVariantAttributeById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const productVariantAttribute = await ProductVariantAttributeService.getById(
      Number(req.params.id)
    );
    if (!productVariantAttribute) {
      res.status(404).json({ success: false, message: 'Product Variant Attribute not found' });
    } else {
      res
        .status(200)
        .json({
          success: true,
          message: 'Product Variant Attribute Retrieved Successfully',
          data: productVariantAttribute,
        });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

//update product variant attribute
export const updateProductVariantAttribute = async (req: Request, res: Response): Promise<void> => {
  try {
    const productVariantAttribute = await ProductVariantAttributeService.update(
      Number(req.params.id),
      req.body
    );
    if (!productVariantAttribute) {
      res
        .status(404)
        .json({ success: false, message: 'Product Variant Attribute not found or invalid data' });
    } else {
      res
        .status(200)
        .json({
          success: true,
          message: 'Product Variant Attribute Updated Successfully',
          data: productVariantAttribute,
        });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

//delete product variant attribute
export const deleteProductVariantAttribute = async (req: Request, res: Response): Promise<void> => {
  try {
    const success = await ProductVariantAttributeService.delete(Number(req.params.id));
    if (!success) {
      res.status(404).json({ success: false, message: 'Product Variant Attribute not found' });
    } else {
      res.status(204).send();
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};
