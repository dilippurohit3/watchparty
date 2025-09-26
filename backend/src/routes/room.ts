import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { createRoom, getRoom, updateRoom, deleteRoom, joinRoom, leaveRoom, getRooms } from '../controllers/roomController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Create room
router.post('/',
  authenticateToken,
  [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Room name must be 1-100 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
    body('password').optional().isLength({ min: 4, max: 50 }).withMessage('Password must be 4-50 characters'),
    body('maxParticipants').optional().isInt({ min: 2, max: 100 }).withMessage('Max participants must be 2-100'),
  ],
  validateRequest,
  asyncHandler(createRoom)
);

// Get room by ID
router.get('/:roomId',
  param('roomId').isUUID().withMessage('Invalid room ID'),
  validateRequest,
  asyncHandler(getRoom)
);

// Update room
router.put('/:roomId',
  authenticateToken,
  [
    param('roomId').isUUID().withMessage('Invalid room ID'),
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Room name must be 1-100 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
    body('password').optional().isLength({ min: 4, max: 50 }).withMessage('Password must be 4-50 characters'),
  ],
  validateRequest,
  asyncHandler(updateRoom)
);

// Delete room
router.delete('/:roomId',
  authenticateToken,
  param('roomId').isUUID().withMessage('Invalid room ID'),
  validateRequest,
  asyncHandler(deleteRoom)
);

// Join room
router.post('/:roomId/join',
  authenticateToken,
  [
    param('roomId').isUUID().withMessage('Invalid room ID'),
    body('password').optional().isLength({ min: 4, max: 50 }).withMessage('Password must be 4-50 characters'),
  ],
  validateRequest,
  asyncHandler(joinRoom)
);

// Leave room
router.post('/:roomId/leave',
  authenticateToken,
  param('roomId').isUUID().withMessage('Invalid room ID'),
  validateRequest,
  asyncHandler(leaveRoom)
);

// Get public rooms
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
    query('search').optional().isLength({ max: 100 }).withMessage('Search term too long'),
  ],
  validateRequest,
  asyncHandler(getRooms)
);

export { router as roomRoutes };
