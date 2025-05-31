// src/routes/productVariantAttribute.routes.ts
import { Router } from 'express';
import {
  createProductVariantAttribute,
  getAllProductVariantAttributes,
  getProductVariantAttributeById,
  updateProductVariantAttribute,
  deleteProductVariantAttribute,
} from '../controllers/productVariantAttributeController';
import {
  validationMiddleware,
  paramValidationMiddleware,
} from '../middleware/validation.middleware';
import {
  CreateProductVariantAttributeDto,
  UpdateProductVariantAttributeDto,
} from '../dtos/ProductVariantAttributeDTO';
import { paramValidators } from '../middleware/validation.middleware';

const router = Router();

router.post(
  '/',
  validationMiddleware(CreateProductVariantAttributeDto),
  createProductVariantAttribute
);

router.get('/', getAllProductVariantAttributes);

router.get(
  '/:id',
  paramValidationMiddleware({ id: paramValidators.isPositiveInt }),
  getProductVariantAttributeById
);

router.put(
  '/:id',
  paramValidationMiddleware({ id: paramValidators.isPositiveInt }),
  validationMiddleware(UpdateProductVariantAttributeDto),
  updateProductVariantAttribute
);

router.delete(
  '/:id',
  paramValidationMiddleware({ id: paramValidators.isPositiveInt }),
  deleteProductVariantAttribute
);

export default router;
