-- Database schema for Rave Watchparty
-- PostgreSQL database setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Firebase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url VARCHAR(500),
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP DEFAULT NOW(),
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    rooms_created INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Rooms table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT TRUE,
    password_hash VARCHAR(255),
    max_participants INTEGER DEFAULT 50 CHECK (max_participants >= 2 AND max_participants <= 100),
    room_code VARCHAR(10) UNIQUE NOT NULL,
    current_video_id UUID,
    is_playing BOOLEAN DEFAULT FALSE,
    current_video_time DECIMAL(10,3) DEFAULT 0,
    playback_rate DECIMAL(3,2) DEFAULT 1.0 CHECK (playback_rate >= 0.25 AND playback_rate <= 4.0),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Room participants table (many-to-many relationship)
CREATE TABLE room_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW(),
    is_host BOOLEAN DEFAULT FALSE,
    UNIQUE(room_id, user_id)
);

-- Videos table
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    url VARCHAR(1000) NOT NULL,
    thumbnail_url VARCHAR(1000),
    duration DECIMAL(10,3),
    type VARCHAR(20) NOT NULL CHECK (type IN ('youtube', 'file', 'url', 'screen_share')),
    file_path VARCHAR(1000),
    file_size BIGINT,
    mime_type VARCHAR(100),
    added_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Playlists table
CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    current_index INTEGER DEFAULT 0,
    is_shuffled BOOLEAN DEFAULT FALSE,
    repeat_mode VARCHAR(10) DEFAULT 'none' CHECK (repeat_mode IN ('none', 'one', 'all')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Playlist videos table (junction table for playlist and videos)
CREATE TABLE playlist_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(playlist_id, position)
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'reaction')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Chat reactions table
CREATE TABLE chat_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- User sessions table (for JWT token management)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used TIMESTAMP DEFAULT NOW()
);

-- Room events table (for audit/logging)
CREATE TABLE room_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User follows table (social following system)
CREATE TABLE user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Room likes table (social interactions)
CREATE TABLE room_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- Room views table (analytics)
CREATE TABLE room_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Control requests table (DJ control system)
CREATE TABLE control_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP
);

-- Update room_participants table to include DJ controls
ALTER TABLE room_participants ADD COLUMN is_co_host BOOLEAN DEFAULT FALSE;
ALTER TABLE room_participants ADD COLUMN can_request_control BOOLEAN DEFAULT TRUE;

-- FCM tokens table (for push notifications)
CREATE TABLE user_fcm_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fcm_token VARCHAR(255) NOT NULL UNIQUE,
    device_info JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User notifications table
CREATE TABLE user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- room_invite, follow, mention, control_request, room_update, system
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    image_url VARCHAR(500),
    click_action VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP
);

-- User events table (analytics)
CREATE TABLE user_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User bans table (moderation)
CREATE TABLE user_bans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    banned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    duration INTEGER, -- in hours, null for permanent
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- User warnings table (moderation)
CREATE TABLE user_warnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Content reports table (moderation)
CREATE TABLE content_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reported_room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    reported_message_id UUID, -- references chat messages
    reason VARCHAR(50) NOT NULL, -- spam, harassment, inappropriate_content, copyright, other
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
    moderator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_taken VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Moderation events table (audit log)
CREATE TABLE moderation_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- user_banned, user_unbanned, user_warned, room_deleted, report_resolved
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    target_room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_online ON users(is_online);

CREATE INDEX idx_rooms_owner ON rooms(owner_id);
CREATE INDEX idx_rooms_public ON rooms(is_public);
CREATE INDEX idx_rooms_code ON rooms(room_code);
CREATE INDEX idx_rooms_created ON rooms(created_at);

CREATE INDEX idx_room_participants_room ON room_participants(room_id);
CREATE INDEX idx_room_participants_user ON room_participants(user_id);
CREATE INDEX idx_room_participants_activity ON room_participants(last_activity);

CREATE INDEX idx_videos_type ON videos(type);
CREATE INDEX idx_videos_added_by ON videos(added_by);
CREATE INDEX idx_videos_created ON videos(created_at);

CREATE INDEX idx_playlists_room ON playlists(room_id);

CREATE INDEX idx_playlist_videos_playlist ON playlist_videos(playlist_id);
CREATE INDEX idx_playlist_videos_position ON playlist_videos(position);

CREATE INDEX idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);

CREATE INDEX idx_chat_reactions_message ON chat_reactions(message_id);
CREATE INDEX idx_chat_reactions_user ON chat_reactions(user_id);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(refresh_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

CREATE INDEX idx_room_events_room ON room_events(room_id);
CREATE INDEX idx_room_events_user ON room_events(user_id);
CREATE INDEX idx_room_events_type ON room_events(event_type);
CREATE INDEX idx_room_events_created ON room_events(created_at);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON playlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update user last seen
CREATE OR REPLACE FUNCTION update_user_last_seen(user_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE users SET last_seen = NOW() WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to get room participants
CREATE OR REPLACE FUNCTION get_room_participants(room_uuid UUID)
RETURNS TABLE (
    user_id UUID,
    username VARCHAR(50),
    avatar_url VARCHAR(500),
    is_host BOOLEAN,
    joined_at TIMESTAMP,
    last_activity TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.avatar_url,
        rp.is_host,
        rp.joined_at,
        rp.last_activity
    FROM users u
    JOIN room_participants rp ON u.id = rp.user_id
    WHERE rp.room_id = room_uuid
    ORDER BY rp.joined_at;
END;
$$ LANGUAGE plpgsql;

-- Function to get room statistics
CREATE OR REPLACE FUNCTION get_room_stats(room_uuid UUID)
RETURNS TABLE (
    total_participants BIGINT,
    total_messages BIGINT,
    total_videos BIGINT,
    room_age INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM room_participants WHERE room_id = room_uuid) as total_participants,
        (SELECT COUNT(*) FROM chat_messages WHERE room_id = room_uuid) as total_messages,
        (SELECT COUNT(*) FROM playlist_videos pv 
         JOIN playlists p ON pv.playlist_id = p.id 
         WHERE p.room_id = room_uuid) as total_videos,
        (NOW() - r.created_at) as room_age
    FROM rooms r
    WHERE r.id = room_uuid;
END;
$$ LANGUAGE plpgsql;
