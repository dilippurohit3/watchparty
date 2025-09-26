import { Router } from 'express';
import { param, query } from 'express-validator';
import { getUsers, getUser, updateUser, deleteUser } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Get users
router.get('/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be 1-50'),
    query('search')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Search term too long'),
  ],
  validateRequest,
  asyncHandler(getUsers)
);

// Get user by ID
router.get('/:userId',
  param('userId').isUUID().withMessage('Invalid user ID'),
  validateRequest,
  asyncHandler(getUser)
);

// Update user
router.put('/:userId',
  authenticateToken,
  param('userId').isUUID().withMessage('Invalid user ID'),
  validateRequest,
  asyncHandler(updateUser)
);

// Delete user
router.delete('/:userId',
  authenticateToken,
  param('userId').isUUID().withMessage('Invalid user ID'),
  validateRequest,
  asyncHandler(deleteUser)
);

export { router as userRoutes };
