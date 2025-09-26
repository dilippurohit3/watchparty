import { Router } from 'express';
import { body, param } from 'express-validator';
import { 
  uploadVideo, 
  getVideo, 
  deleteVideo, 
  searchYouTube, 
  streamVideo, 
  getThumbnail,
  upload 
} from '../controllers/videoController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Upload video
router.post('/upload',
  authenticateToken,
  upload.single('video'),
  [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Title must be 1-255 characters'),
  ],
  validateRequest,
  asyncHandler(uploadVideo)
);

// Get video
router.get('/:videoId',
  param('videoId').isUUID().withMessage('Invalid video ID'),
  validateRequest,
  asyncHandler(getVideo)
);

// Delete video
router.delete('/:videoId',
  authenticateToken,
  param('videoId').isUUID().withMessage('Invalid video ID'),
  validateRequest,
  asyncHandler(deleteVideo)
);

// Search YouTube
router.get('/youtube/search',
  [
    body('q')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be 1-100 characters'),
  ],
  validateRequest,
  asyncHandler(searchYouTube)
);

// Stream video
router.get('/stream/:filename',
  asyncHandler(streamVideo)
);

// Get thumbnail
router.get('/thumbnail/:filename',
  asyncHandler(getThumbnail)
);

export { router as videoRoutes };
