import { Router } from 'express';
import { query } from 'express-validator';
import { 
  getTrendingRooms, 
  getTrendingUsers, 
  getRoomCategories 
} from '../controllers/trendingController.js';
import { validateRequest } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Get trending rooms
router.get('/rooms',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be 1-50'),
    query('category')
      .optional()
      .isIn(['all', 'hip-hop', 'electronic', 'pop', 'rock', 'jazz', 'classical', 'reggae', 'country', 'indie'])
      .withMessage('Invalid category'),
  ],
  validateRequest,
  asyncHandler(getTrendingRooms)
);

// Get trending users
router.get('/users',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be 1-50'),
  ],
  validateRequest,
  asyncHandler(getTrendingUsers)
);

// Get room categories
router.get('/categories',
  asyncHandler(getRoomCategories)
);

export { router as trendingRoutes };
