import { Router } from 'express';
import {
  createAttributeValue,
  getAllAttributesValues,
  getAttributeValueById,
  updateAttributeValue,
  deleteAttributeValue,
} from '../controllers/AttributeValueController';

const router = Router();

router.post('/attribute-values', createAttributeValue);
router.get('/attribute-values', getAllAttributesValues);
router.get('/attribute-values/:id', getAttributeValueById);
router.put('/attribute-values/:id', updateAttributeValue);
router.delete('/attribute-values/:id', deleteAttributeValue);

export default router;
