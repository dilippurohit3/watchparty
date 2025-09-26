import { Router } from 'express';
import { body, param } from 'express-validator';
import { 
  getPlaylist, 
  addVideo, 
  removeVideo, 
  reorderVideos, 
  clearPlaylist, 
  setCurrentVideo 
} from '../controllers/playlistController.js';
import { authenticateToken, requireRoomAccess } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Get playlist
router.get('/:roomId',
  authenticateToken,
  requireRoomAccess,
  param('roomId').isUUID().withMessage('Invalid room ID'),
  validateRequest,
  asyncHandler(getPlaylist)
);

// Add video to playlist
router.post('/:roomId/videos',
  authenticateToken,
  requireRoomAccess,
  [
    param('roomId').isUUID().withMessage('Invalid room ID'),
    body('videoId')
      .optional()
      .isUUID()
      .withMessage('Invalid video ID'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Title must be 1-255 characters'),
    body('url')
      .optional()
      .isURL()
      .withMessage('Valid URL required'),
    body('thumbnail')
      .optional()
      .isURL()
      .withMessage('Valid thumbnail URL required'),
    body('duration')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Duration must be a positive number'),
    body('type')
      .optional()
      .isIn(['youtube', 'file', 'url', 'screen_share'])
      .withMessage('Invalid video type'),
  ],
  validateRequest,
  asyncHandler(addVideo)
);

// Remove video from playlist
router.delete('/:roomId/videos/:videoId',
  authenticateToken,
  requireRoomAccess,
  [
    param('roomId').isUUID().withMessage('Invalid room ID'),
    param('videoId').isUUID().withMessage('Invalid video ID'),
  ],
  validateRequest,
  asyncHandler(removeVideo)
);

// Reorder videos
router.put('/:roomId/reorder',
  authenticateToken,
  requireRoomAccess,
  [
    param('roomId').isUUID().withMessage('Invalid room ID'),
    body('videoIds')
      .isArray({ min: 1 })
      .withMessage('Video IDs array required'),
    body('videoIds.*')
      .isUUID()
      .withMessage('Invalid video ID in array'),
  ],
  validateRequest,
  asyncHandler(reorderVideos)
);

// Clear playlist
router.delete('/:roomId',
  authenticateToken,
  requireRoomAccess,
  param('roomId').isUUID().withMessage('Invalid room ID'),
  validateRequest,
  asyncHandler(clearPlaylist)
);

// Set current video
router.put('/:roomId/current',
  authenticateToken,
  requireRoomAccess,
  [
    param('roomId').isUUID().withMessage('Invalid room ID'),
    body('videoId')
      .isUUID()
      .withMessage('Invalid video ID'),
    body('currentIndex')
      .isInt({ min: 0 })
      .withMessage('Current index must be a non-negative integer'),
  ],
  validateRequest,
  asyncHandler(setCurrentVideo)
);

export { router as playlistRoutes };
