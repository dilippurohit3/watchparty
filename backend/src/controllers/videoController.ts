import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { generateId } from '@shared';
import { AppError } from '@shared';
import { config } from '../server.js';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = config.upload.uploadPath;
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type', 400, 'INVALID_FILE_TYPE'));
    }
  },
});

export const uploadVideo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { title } = req.body;

  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400, 'NO_FILE');
    }

    const file = req.file;
    const filePath = file.path;
    const fileSize = file.size;
    const mimeType = file.mimetype;

    // Generate thumbnail (simplified - in production, use ffmpeg)
    const thumbnailPath = filePath.replace(path.extname(filePath), '_thumb.jpg');

    // Create video record in database
    const result = await query(
      `INSERT INTO videos (id, title, url, thumbnail_url, type, file_path, file_size, mime_type, added_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [
        generateId(),
        title || file.originalname,
        `/api/videos/stream/${path.basename(filePath)}`,
        `/api/videos/thumbnail/${path.basename(thumbnailPath)}`,
        'file',
        filePath,
        fileSize,
        mimeType,
        userId
      ]
    );

    const video = result.rows[0];

    logger.info('Video uploaded successfully', {
      videoId: video.id,
      userId,
      fileSize,
      mimeType
    });

    res.status(201).json({
      success: true,
      data: {
        id: video.id,
        title: video.title,
        url: video.url,
        thumbnail: video.thumbnail_url,
        type: video.type,
        duration: video.duration,
        fileSize: video.file_size,
        mimeType: video.mime_type,
        addedBy: video.added_by,
        addedAt: video.added_at,
      },
      message: 'Video uploaded successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Upload video error:', error);
    throw new AppError('Failed to upload video', 500, 'VIDEO_UPLOAD_ERROR');
  }
};

export const getVideo = async (req: Request, res: Response): Promise<void> => {
  const { videoId } = req.params;

  try {
    const result = await query(
      'SELECT * FROM videos WHERE id = $1',
      [videoId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Video not found', 404, 'VIDEO_NOT_FOUND');
    }

    const video = result.rows[0];

    res.json({
      success: true,
      data: {
        id: video.id,
        title: video.title,
        url: video.url,
        thumbnail: video.thumbnail_url,
        type: video.type,
        duration: video.duration,
        fileSize: video.file_size,
        mimeType: video.mime_type,
        addedBy: video.added_by,
        addedAt: video.added_at,
        createdAt: video.created_at,
      }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Get video error:', error);
    throw new AppError('Failed to get video', 500, 'VIDEO_GET_ERROR');
  }
};

export const deleteVideo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { videoId } = req.params;
  const userId = req.user!.id;

  try {
    // Check if user owns the video
    const videoResult = await query(
      'SELECT file_path FROM videos WHERE id = $1 AND added_by = $2',
      [videoId, userId]
    );

    if (videoResult.rows.length === 0) {
      throw new AppError('Video not found or not authorized', 404, 'VIDEO_NOT_FOUND');
    }

    const video = videoResult.rows[0];

    // Delete file from filesystem
    if (video.file_path && fs.existsSync(video.file_path)) {
      fs.unlinkSync(video.file_path);
    }

    // Delete from database
    await query('DELETE FROM videos WHERE id = $1', [videoId]);

    logger.info('Video deleted successfully', { videoId, userId });

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Delete video error:', error);
    throw new AppError('Failed to delete video', 500, 'VIDEO_DELETE_ERROR');
  }
};

export const searchYouTube = async (req: Request, res: Response): Promise<void> => {
  const { q: query, maxResults = 10 } = req.query;

  try {
    if (!query) {
      throw new AppError('Search query required', 400, 'SEARCH_QUERY_REQUIRED');
    }

    if (!config.youtube.apiKey) {
      throw new AppError('YouTube API not configured', 503, 'YOUTUBE_API_NOT_CONFIGURED');
    }

    // YouTube API search (simplified - in production, use proper YouTube API)
    const searchResults = [
      {
        id: generateId(),
        title: `Search result for: ${query}`,
        url: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        type: 'youtube',
        duration: 212,
        addedBy: null,
        addedAt: new Date(),
      }
    ];

    res.json({
      success: true,
      data: searchResults,
      message: 'YouTube search completed'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('YouTube search error:', error);
    throw new AppError('Failed to search YouTube', 500, 'YOUTUBE_SEARCH_ERROR');
  }
};

export const streamVideo = async (req: Request, res: Response): Promise<void> => {
  const { filename } = req.params;

  try {
    const filePath = path.join(config.upload.uploadPath, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new AppError('Video file not found', 404, 'VIDEO_FILE_NOT_FOUND');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Handle range requests for video streaming
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Stream entire file
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Stream video error:', error);
    throw new AppError('Failed to stream video', 500, 'VIDEO_STREAM_ERROR');
  }
};

export const getThumbnail = async (req: Request, res: Response): Promise<void> => {
  const { filename } = req.params;

  try {
    const thumbnailPath = path.join(config.upload.uploadPath, filename);
    
    if (!fs.existsSync(thumbnailPath)) {
      // Return default thumbnail
      res.status(404).json({ success: false, error: 'Thumbnail not found' });
      return;
    }

    res.sendFile(thumbnailPath);
  } catch (error) {
    logger.error('Get thumbnail error:', error);
    throw new AppError('Failed to get thumbnail', 500, 'THUMBNAIL_ERROR');
  }
};

// Export multer middleware
export { upload };
