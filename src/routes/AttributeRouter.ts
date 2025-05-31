// src/routes/attribute.routes.ts
import { Router } from 'express';
import {
  createAttribute,
  getAllAttributes,
  getAttributeById,
  updateAttribute,
  deleteAttribute,
} from '../controllers/AttributeController';
import { CreateAttributeDto, UpdateAttributeDto } from '../dtos/AttributeDTO';
import {
  paramValidationMiddleware,
  paramValidators,
  validationMiddleware,
} from '../middleware/validation.middleware';

const router = Router();

router.post('/', validationMiddleware(CreateAttributeDto), createAttribute);

router.get('/', getAllAttributes);

router.get(
  '/:id',
  paramValidationMiddleware({ id: paramValidators.isPositiveInt }),
  getAttributeById
);

router.put(
  '/:id',
  paramValidationMiddleware({ id: paramValidators.isPositiveInt }),
  validationMiddleware(UpdateAttributeDto),
  updateAttribute
);

router.delete(
  '/:id',
  paramValidationMiddleware({ id: paramValidators.isPositiveInt }),
  deleteAttribute
);

export default router;
