// protected.routes.ts - Protected Routes Configuration

// Import necessary packages and middleware
import { Router } from 'express'; // Express Router for handling routes
import { authMiddleware, requireRole } from '../middleware/auth.middleware'; // Authentication middleware

// Create a new router instance
const router = Router();

/**
 * Protected Route - Basic User Access
 * Route: GET /
 * This route is protected and requires a valid authentication token
 * Any authenticated user can access this route
 */
router.get('/test-token', authMiddleware, (req, res) => {
  res.json({ message: 'Protected route accessed' });
});

/**
 * Protected Route - Admin Only Access
 * Route: GET /admin
 * This route requires both authentication and admin role
 * Only users with admin role can access this route
 */
router.get('/admin', authMiddleware, requireRole('admin'), (req, res) => {
  res.json({ message: 'Admin route accessed' });
});

export default router;
