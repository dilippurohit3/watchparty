import { Router } from 'express';
import { param } from 'express-validator';
import { 
  followUser, 
  unfollowUser, 
  getFollowers, 
  getFollowing, 
  getFollowStatus 
} from '../controllers/followController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Follow user
router.post('/:userId',
  authenticateToken,
  param('userId').isUUID().withMessage('Invalid user ID'),
  validateRequest,
  asyncHandler(followUser)
);

// Unfollow user
router.delete('/:userId',
  authenticateToken,
  param('userId').isUUID().withMessage('Invalid user ID'),
  validateRequest,
  asyncHandler(unfollowUser)
);

// Get user's followers
router.get('/:userId/followers',
  param('userId').isUUID().withMessage('Invalid user ID'),
  validateRequest,
  asyncHandler(getFollowers)
);

// Get user's following
router.get('/:userId/following',
  param('userId').isUUID().withMessage('Invalid user ID'),
  validateRequest,
  asyncHandler(getFollowing)
);

// Get follow status (for current user)
router.get('/:userId/status',
  authenticateToken,
  param('userId').isUUID().withMessage('Invalid user ID'),
  validateRequest,
  asyncHandler(getFollowStatus)
);

export { router as followRoutes };
