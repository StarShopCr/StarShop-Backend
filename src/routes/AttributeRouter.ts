import { Router } from "express";
import {
  createAttribute,
  getAllAttributes,
  getAttributeById,
  updateAttribute,
  deleteAttribute,
} from "../controllers/AttributeController";

const router = Router();

router.post("/attributes", createAttribute);
router.get("/attributes", getAllAttributes);
router.get("/attributes/:id", getAttributeById);
router.put("/attributes/:id", updateAttribute);
router.delete("/attributes/:id", deleteAttribute);

export default router;
