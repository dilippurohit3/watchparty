import { Router } from 'express';
import { body } from 'express-validator';
import { 
  createOrUpdateUser,
  getProfile,
  updateProfile,
  deleteAccount,
  getFirebaseConfig,
  verifyFirebaseToken
} from '../controllers/firebaseAuthController.js';
import { validateRequest } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Get Firebase config (public)
router.get('/config',
  asyncHandler(getFirebaseConfig)
);

// Create or update user from Firebase
router.post('/user',
  [
    body('firebaseUid').notEmpty().withMessage('Firebase UID is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('username').isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    body('avatarUrl').optional().isURL().withMessage('Avatar URL must be valid')
  ],
  validateRequest,
  asyncHandler(createOrUpdateUser)
);

// Get user profile (protected)
router.get('/profile',
  verifyFirebaseToken,
  asyncHandler(getProfile)
);

// Update user profile (protected)
router.put('/profile',
  verifyFirebaseToken,
  [
    body('username').optional().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    body('avatarUrl').optional().isURL().withMessage('Avatar URL must be valid')
  ],
  validateRequest,
  asyncHandler(updateProfile)
);

// Delete user account (protected)
router.delete('/account',
  verifyFirebaseToken,
  asyncHandler(deleteAccount)
);

export { router as firebaseAuthRoutes };
