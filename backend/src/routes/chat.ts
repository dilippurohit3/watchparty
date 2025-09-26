import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { 
  getMessages, 
  sendMessage, 
  addReaction, 
  removeReaction, 
  getTypingUsers 
} from '../controllers/chatController.js';
import { authenticateToken, requireRoomAccess } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Get messages
router.get('/:roomId/messages',
  authenticateToken,
  requireRoomAccess,
  [
    param('roomId').isUUID().withMessage('Invalid room ID'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be 1-100'),
  ],
  validateRequest,
  asyncHandler(getMessages)
);

// Send message
router.post('/:roomId/messages',
  authenticateToken,
  requireRoomAccess,
  [
    param('roomId').isUUID().withMessage('Invalid room ID'),
    body('message')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be 1-1000 characters'),
    body('type')
      .optional()
      .isIn(['text', 'system', 'reaction'])
      .withMessage('Invalid message type'),
  ],
  validateRequest,
  asyncHandler(sendMessage)
);

// Add reaction
router.post('/messages/:messageId/reactions',
  authenticateToken,
  [
    param('messageId').isUUID().withMessage('Invalid message ID'),
    body('emoji')
      .trim()
      .isLength({ min: 1, max: 10 })
      .withMessage('Emoji must be 1-10 characters'),
  ],
  validateRequest,
  asyncHandler(addReaction)
);

// Remove reaction
router.delete('/messages/:messageId/reactions',
  authenticateToken,
  [
    param('messageId').isUUID().withMessage('Invalid message ID'),
    body('emoji')
      .trim()
      .isLength({ min: 1, max: 10 })
      .withMessage('Emoji must be 1-10 characters'),
  ],
  validateRequest,
  asyncHandler(removeReaction)
);

// Get typing users
router.get('/:roomId/typing',
  authenticateToken,
  requireRoomAccess,
  param('roomId').isUUID().withMessage('Invalid room ID'),
  validateRequest,
  asyncHandler(getTypingUsers)
);

export { router as chatRoutes };
