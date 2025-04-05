// src/routes/attributeValue.routes.ts
import { Router } from 'express';
import {
  createAttributeValue,
  getAllAttributesValues,
  getAttributeValueById,
  updateAttributeValue,
  deleteAttributeValue,
} from '../controllers/AttributeValueController';
import {
  validationMiddleware,
  paramValidationMiddleware,
} from '../middleware/validation.middleware';
import { CreateAttributeValueDto, UpdateAttributeValueDto } from '../dtos/AttributeValueDTO';
import { paramValidators } from '../middleware/validation.middleware';

const router = Router();

router.post('/', validationMiddleware(CreateAttributeValueDto), createAttributeValue);

router.get('/', getAllAttributesValues);

router.get(
  '/:id',
  paramValidationMiddleware({ id: paramValidators.isPositiveInt }),
  getAttributeValueById
);

router.put(
  '/:id',
  paramValidationMiddleware({ id: paramValidators.isPositiveInt }),
  validationMiddleware(UpdateAttributeValueDto),
  updateAttributeValue
);

router.delete(
  '/:id',
  paramValidationMiddleware({ id: paramValidators.isPositiveInt }),
  deleteAttributeValue
);

export default router;
