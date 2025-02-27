import { Router } from 'express';
import {
  createProductVariantAttribute,
  getAllProductVariantAttributes,
  getProductVariantAttributeById,
  updateProductVariantAttribute,
  deleteProductVariantAttribute,
} from '../controllers/productVariantAttributeController';

const router = Router();

router.post('/', createProductVariantAttribute);
router.get('/', getAllProductVariantAttributes);
router.get('/:id', getProductVariantAttributeById);
router.put('/:id', updateProductVariantAttribute);
router.delete('/:id', deleteProductVariantAttribute);

export default router;
