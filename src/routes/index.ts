import { Router } from "express";
import userRoutes from "./UserRoutes";
import attributeRoutes from "./AttributeRouter";
import attributeValuesRoutes from "./AttributeValueRoute";
// import productRoutes from './product.routes';
// import storeRoutes from './store.routes';

const router = Router();

// Health Check Route
router.get("/health", (req, res) => {
  res.status(200).json({ status: "success", message: "API is running!" });
});

// Mount route modules
router.use("/users", userRoutes);
router.use("/attributes", attributeRoutes);
router.use("/attribute-values", attributeValuesRoutes);
// router.use("/products", productRoutes);
// router.use("/stores", storeRoutes);

export default router;
