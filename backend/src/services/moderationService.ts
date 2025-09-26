import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { AppError } from '@shared';

interface ProfanityFilter {
  words: string[];
  replacements: string[];
  severity: 'low' | 'medium' | 'high';
}

interface ContentReport {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  reportedRoomId?: string;
  reportedMessageId?: string;
  reason: 'spam' | 'harassment' | 'inappropriate_content' | 'copyright' | 'other';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  moderatorId?: string;
  actionTaken?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserBan {
  id: string;
  userId: string;
  bannedBy: string;
  reason: string;
  duration?: number; // in hours, null for permanent
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

class ModerationService {
  private profanityFilter: ProfanityFilter;

  constructor() {
    this.profanityFilter = {
      words: [
        // Basic profanity (add your own list)
        'spam', 'scam', 'fake', 'bot'
      ],
      replacements: ['***', '***', '***', '***'],
      severity: 'medium'
    };
  }

  // Filter profanity from text
  filterProfanity(text: string): { filtered: string; hasProfanity: boolean; severity: string } {
    let filtered = text;
    let hasProfanity = false;
    let severity = 'low';

    for (let i = 0; i < this.profanityFilter.words.length; i++) {
      const word = this.profanityFilter.words[i];
      const replacement = this.profanityFilter.replacements[i] || '***';
      
      if (filtered.toLowerCase().includes(word.toLowerCase())) {
        filtered = filtered.replace(new RegExp(word, 'gi'), replacement);
        hasProfanity = true;
        severity = this.profanityFilter.severity;
      }
    }

    return { filtered, hasProfanity, severity };
  }

  // Check if user is banned
  async isUserBanned(userId: string): Promise<{ isBanned: boolean; banInfo?: UserBan }> {
    try {
      const result = await query(
        `SELECT 
          ub.id, ub.user_id, ub.banned_by, ub.reason, ub.duration, ub.is_active, 
          ub.created_at, ub.expires_at, u.username as banned_by_username
         FROM user_bans ub
         JOIN users u ON ub.banned_by = u.id
         WHERE ub.user_id = $1 AND ub.is_active = true 
         AND (ub.expires_at IS NULL OR ub.expires_at > NOW())`,
        [userId]
      );

      if (result.rows.length > 0) {
        const ban = result.rows[0];
        return {
          isBanned: true,
          banInfo: {
            id: ban.id,
            userId: ban.user_id,
            bannedBy: ban.banned_by,
            reason: ban.reason,
            duration: ban.duration,
            isActive: ban.is_active,
            createdAt: ban.created_at,
            expiresAt: ban.expires_at
          }
        };
      }

      return { isBanned: false };
    } catch (error) {
      logger.error('Check user ban error:', error);
      return { isBanned: false };
    }
  }

  // Ban user
  async banUser(
    userId: string, 
    bannedBy: string, 
    reason: string, 
    duration?: number
  ): Promise<void> {
    try {
      const expiresAt = duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : null;
      
      await query(
        `INSERT INTO user_bans (id, user_id, banned_by, reason, duration, is_active, created_at, expires_at)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, true, NOW(), $5)`,
        [userId, bannedBy, reason, duration, expiresAt]
      );

      // Log the ban event
      await query(
        `INSERT INTO moderation_events (id, moderator_id, action_type, target_user_id, details, created_at)
         VALUES (uuid_generate_v4(), $1, 'user_banned', $2, $3, NOW())`,
        [bannedBy, userId, JSON.stringify({ reason, duration, expiresAt })]
      );

      logger.info('User banned', { userId, bannedBy, reason, duration });
    } catch (error) {
      logger.error('Ban user error:', error);
      throw new AppError('Failed to ban user', 500, 'BAN_USER_ERROR');
    }
  }

  // Unban user
  async unbanUser(userId: string, unbannedBy: string): Promise<void> {
    try {
      await query(
        'UPDATE user_bans SET is_active = false WHERE user_id = $1 AND is_active = true',
        [userId]
      );

      // Log the unban event
      await query(
        `INSERT INTO moderation_events (id, moderator_id, action_type, target_user_id, details, created_at)
         VALUES (uuid_generate_v4(), $1, 'user_unbanned', $2, $3, NOW())`,
        [unbannedBy, userId, JSON.stringify({ unbannedBy })]
      );

      logger.info('User unbanned', { userId, unbannedBy });
    } catch (error) {
      logger.error('Unban user error:', error);
      throw new AppError('Failed to unban user', 500, 'UNBAN_USER_ERROR');
    }
  }

  // Report content
  async reportContent(
    reporterId: string,
    reportedUserId: string | null,
    reportedRoomId: string | null,
    reportedMessageId: string | null,
    reason: string,
    description: string
  ): Promise<string> {
    try {
      const result = await query(
        `INSERT INTO content_reports (id, reporter_id, reported_user_id, reported_room_id, reported_message_id, reason, description, status, created_at, updated_at)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, 'pending', NOW(), NOW())
         RETURNING id`,
        [reporterId, reportedUserId, reportedRoomId, reportedMessageId, reason, description]
      );

      const reportId = result.rows[0].id;
      logger.info('Content reported', { reportId, reporterId, reason });

      return reportId;
    } catch (error) {
      logger.error('Report content error:', error);
      throw new AppError('Failed to report content', 500, 'REPORT_CONTENT_ERROR');
    }
  }

  // Get pending reports
  async getPendingReports(page: number = 1, limit: number = 20): Promise<{ reports: ContentReport[]; total: number }> {
    try {
      const offset = (page - 1) * limit;

      const reportsResult = await query(
        `SELECT 
          cr.id, cr.reporter_id, cr.reported_user_id, cr.reported_room_id, cr.reported_message_id,
          cr.reason, cr.description, cr.status, cr.created_at, cr.updated_at,
          u1.username as reporter_username,
          u2.username as reported_username,
          r.name as reported_room_name
         FROM content_reports cr
         JOIN users u1 ON cr.reporter_id = u1.id
         LEFT JOIN users u2 ON cr.reported_user_id = u2.id
         LEFT JOIN rooms r ON cr.reported_room_id = r.id
         WHERE cr.status = 'pending'
         ORDER BY cr.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const countResult = await query(
        'SELECT COUNT(*) as total FROM content_reports WHERE status = $1',
        ['pending']
      );

      const reports = reportsResult.rows.map(row => ({
        id: row.id,
        reporterId: row.reporter_id,
        reportedUserId: row.reported_user_id,
        reportedRoomId: row.reported_room_id,
        reportedMessageId: row.reported_message_id,
        reason: row.reason,
        description: row.description,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        reporterUsername: row.reporter_username,
        reportedUsername: row.reported_username,
        reportedRoomName: row.reported_room_name
      }));

      return {
        reports,
        total: parseInt(countResult.rows[0].total)
      };
    } catch (error) {
      logger.error('Get pending reports error:', error);
      throw new AppError('Failed to get pending reports', 500, 'GET_REPORTS_ERROR');
    }
  }

  // Resolve report
  async resolveReport(
    reportId: string,
    moderatorId: string,
    action: 'dismiss' | 'warn_user' | 'ban_user' | 'delete_content',
    actionDetails?: string
  ): Promise<void> {
    try {
      // Update report status
      await query(
        'UPDATE content_reports SET status = $1, moderator_id = $2, action_taken = $3, updated_at = NOW() WHERE id = $4',
        ['resolved', moderatorId, action, reportId]
      );

      // Get report details
      const reportResult = await query(
        'SELECT * FROM content_reports WHERE id = $1',
        [reportId]
      );

      if (reportResult.rows.length === 0) {
        throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');
      }

      const report = reportResult.rows[0];

      // Take action based on resolution
      switch (action) {
        case 'warn_user':
          if (report.reported_user_id) {
            await this.warnUser(report.reported_user_id, moderatorId, actionDetails || 'Content violation warning');
          }
          break;
        case 'ban_user':
          if (report.reported_user_id) {
            await this.banUser(report.reported_user_id, moderatorId, actionDetails || 'Content violation ban', 24);
          }
          break;
        case 'delete_content':
          if (report.reported_room_id) {
            await this.deleteRoom(report.reported_room_id, moderatorId, actionDetails || 'Content violation');
          }
          break;
      }

      // Log moderation action
      await query(
        `INSERT INTO moderation_events (id, moderator_id, action_type, target_user_id, details, created_at)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW())`,
        [moderatorId, action, report.reported_user_id, JSON.stringify({ reportId, actionDetails })]
      );

      logger.info('Report resolved', { reportId, moderatorId, action });
    } catch (error) {
      logger.error('Resolve report error:', error);
      throw new AppError('Failed to resolve report', 500, 'RESOLVE_REPORT_ERROR');
    }
  }

  // Warn user
  async warnUser(userId: string, moderatorId: string, reason: string): Promise<void> {
    try {
      await query(
        `INSERT INTO user_warnings (id, user_id, moderator_id, reason, created_at)
         VALUES (uuid_generate_v4(), $1, $2, $3, NOW())`,
        [userId, moderatorId, reason]
      );

      logger.info('User warned', { userId, moderatorId, reason });
    } catch (error) {
      logger.error('Warn user error:', error);
      throw new AppError('Failed to warn user', 500, 'WARN_USER_ERROR');
    }
  }

  // Delete room
  async deleteRoom(roomId: string, moderatorId: string, reason: string): Promise<void> {
    try {
      await query(
        'UPDATE rooms SET is_deleted = true, deleted_at = NOW() WHERE id = $1',
        [roomId]
      );

      // Log the deletion
      await query(
        `INSERT INTO moderation_events (id, moderator_id, action_type, target_room_id, details, created_at)
         VALUES (uuid_generate_v4(), $1, 'room_deleted', $2, $3, NOW())`,
        [moderatorId, roomId, JSON.stringify({ reason })]
      );

      logger.info('Room deleted', { roomId, moderatorId, reason });
    } catch (error) {
      logger.error('Delete room error:', error);
      throw new AppError('Failed to delete room', 500, 'DELETE_ROOM_ERROR');
    }
  }

  // Get moderation stats
  async getModerationStats(): Promise<any> {
    try {
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT ub.id) as total_bans,
          COUNT(DISTINCT uw.id) as total_warnings,
          COUNT(DISTINCT cr.id) as total_reports,
          COUNT(DISTINCT CASE WHEN cr.status = 'pending' THEN cr.id END) as pending_reports,
          COUNT(DISTINCT CASE WHEN cr.status = 'resolved' THEN cr.id END) as resolved_reports
        FROM user_bans ub
        FULL OUTER JOIN user_warnings uw ON 1=1
        FULL OUTER JOIN content_reports cr ON 1=1
      `;

      const stats = await query(statsQuery);

      return stats.rows[0];
    } catch (error) {
      logger.error('Get moderation stats error:', error);
      throw new AppError('Failed to get moderation stats', 500, 'MODERATION_STATS_ERROR');
    }
  }
}

export default ModerationService;
