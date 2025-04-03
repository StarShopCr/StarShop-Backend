import { Router } from 'express';
import {
  createProductVariantAttribute,
  getAllProductVariantAttributes,
  getProductVariantAttributeById,
  updateProductVariantAttribute,
  deleteProductVariantAttribute,
} from '../controllers/productVariantAttributeController';
import { authMiddleware } from '../middleware/auth.middleware';
const router = Router();

router.post('/', createProductVariantAttribute);
router.get('/', getAllProductVariantAttributes);
router.get('/:id', getProductVariantAttributeById);
router.put('/:id', authMiddleware, updateProductVariantAttribute);
router.delete('/:id', authMiddleware, deleteProductVariantAttribute);

export default router;
