import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Users, 
  Play, 
  Eye, 
  Heart, 
  Plus, 
  Check,
  Crown,
  Music
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useMutation, useQueryClient } from 'react-query';
import { followApi } from '../services/api';
import { toast } from 'react-hot-toast';

interface UserProfile {
  id: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  stats: {
    followersCount: number;
    followingCount: number;
    roomsCreated: number;
    totalViews: number;
    trendingScore: number;
  };
  currentRoom?: {
    id: string;
    name: string;
    participantCount: number;
  };
  createdAt: Date;
}

interface UserProfileCardProps {
  user: UserProfile;
  showFollowButton?: boolean;
  isFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({
  user,
  showFollowButton = true,
  isFollowing = false,
  onFollowChange
}) => {
  const { user: currentUser } = useAuth();
  const [isFollowingState, setIsFollowingState] = useState(isFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const followMutation = useMutation(
    () => followApi.followUser(user.id),
    {
      onSuccess: () => {
        setIsFollowingState(true);
        onFollowChange?.(true);
        toast.success(`Started following ${user.username}`);
        queryClient.invalidateQueries(['user', user.id]);
        queryClient.invalidateQueries(['trending-users']);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to follow user');
      },
    }
  );

  const unfollowMutation = useMutation(
    () => followApi.unfollowUser(user.id),
    {
      onSuccess: () => {
        setIsFollowingState(false);
        onFollowChange?.(false);
        toast.success(`Unfollowed ${user.username}`);
        queryClient.invalidateQueries(['user', user.id]);
        queryClient.invalidateQueries(['trending-users']);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to unfollow user');
      },
    }
  );

  const handleFollowToggle = async () => {
    if (!currentUser) {
      toast.error('Please log in to follow users');
      return;
    }

    if (user.id === currentUser.id) {
      toast.error('Cannot follow yourself');
      return;
    }

    setIsLoading(true);
    try {
      if (isFollowingState) {
        await unfollowMutation.mutateAsync();
      } else {
        await followMutation.mutateAsync();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getInitials = (username: string): string => {
    return username
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (isOnline: boolean): string => {
    return isOnline ? 'bg-green-500' : 'bg-gray-400';
  };

  const getStatusText = (isOnline: boolean): string => {
    return isOnline ? 'Online' : 'Offline';
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitials(user.username)
              )}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${getStatusColor(user.isOnline)}`} />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">{user.username}</h3>
            <div className="flex items-center space-x-2 text-sm text-white/70">
              <span className={getStatusColor(user.isOnline)} />
              <span>{getStatusText(user.isOnline)}</span>
              {!user.isOnline && (
                <span>• {formatTime(user.lastSeen)}</span>
              )}
            </div>
          </div>
        </div>

        {showFollowButton && currentUser && user.id !== currentUser.id && (
          <button
            onClick={handleFollowToggle}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
              isFollowingState
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:scale-105'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isFollowingState ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Following
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-1" />
                Follow
              </>
            )}
          </button>
        )}
      </div>

      {/* Current Room */}
      {user.currentRoom && (
        <div className="mb-4 p-3 bg-white/5 rounded-xl">
          <div className="flex items-center space-x-2 mb-2">
            <Music className="w-4 h-4 text-pink-400" />
            <span className="text-white font-medium text-sm">Currently Hosting</span>
          </div>
          <Link
            to={`/room/${user.currentRoom.id}`}
            className="block text-pink-400 hover:text-pink-300 transition-colors text-sm"
          >
            {user.currentRoom.name}
          </Link>
          <div className="flex items-center space-x-1 text-white/70 text-xs mt-1">
            <Users className="w-3 h-3" />
            <span>{user.currentRoom.participantCount} participants</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{user.stats.followersCount}</div>
          <div className="text-white/70 text-sm">Followers</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{user.stats.followingCount}</div>
          <div className="text-white/70 text-sm">Following</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{user.stats.roomsCreated}</div>
          <div className="text-white/70 text-sm">Rooms</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{user.stats.totalViews}</div>
          <div className="text-white/70 text-sm">Views</div>
        </div>
      </div>

      {/* Trending Score */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/70">Trending Score</span>
        <div className="flex items-center space-x-2">
          <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
              style={{ width: `${Math.min((user.stats.trendingScore / 100) * 100, 100)}%` }}
            />
          </div>
          <span className="text-white font-medium">{Math.round(user.stats.trendingScore)}</span>
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;
