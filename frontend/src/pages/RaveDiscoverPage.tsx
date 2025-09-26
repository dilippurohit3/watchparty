import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Users, 
  Clock, 
  Star,
  Fire,
  Music,
  Heart,
  Zap,
  Globe,
  Lock
} from 'lucide-react';
import { useQuery } from 'react-query';
import { roomApi, userApi } from '../services/api';
import RaveBottomTabBar from '../components/RaveBottomTabBar';

interface DiscoverRoom {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  participantCount: number;
  maxParticipants: number;
  isLive: boolean;
  isPublic: boolean;
  dj: {
    id: string;
    username: string;
    avatar: string;
    followers: number;
  };
  currentVideo: {
    title: string;
    thumbnail: string;
    duration: number;
  };
  tags: string[];
  likes: number;
  views: number;
  createdAt: Date;
  trendingScore: number;
}

interface TrendingUser {
  id: string;
  username: string;
  avatar: string;
  followers: number;
  isLive: boolean;
  currentRoom: {
    id: string;
    name: string;
    participantCount: number;
  };
}

const RaveDiscoverPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('trending');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const filters = [
    { id: 'trending', label: 'Trending', icon: TrendingUp, gradient: 'from-pink-500 to-purple-500' },
    { id: 'live', label: 'Live Now', icon: Fire, gradient: 'from-red-500 to-orange-500' },
    { id: 'new', label: 'New', icon: Star, gradient: 'from-blue-500 to-cyan-500' },
    { id: 'popular', label: 'Popular', icon: Users, gradient: 'from-green-500 to-emerald-500' }
  ];

  const genres = [
    'all', 'hip-hop', 'electronic', 'pop', 'rock', 'jazz', 'classical', 'reggae', 'country', 'indie'
  ];

  // Get trending rooms
  const { data: trendingRooms, isLoading: isLoadingRooms } = useQuery(
    ['discover-rooms', selectedFilter, selectedGenre, searchQuery],
    () => roomApi.getRooms({ 
      page: 1, 
      limit: 20, 
      sort: selectedFilter,
      genre: selectedGenre !== 'all' ? selectedGenre : undefined,
      search: searchQuery || undefined
    }),
    {
      onError: (error: any) => {
        console.error('Failed to load rooms:', error);
      },
    }
  );

  // Get trending users
  const { data: trendingUsers, isLoading: isLoadingUsers } = useQuery(
    ['trending-users'],
    () => userApi.getTrendingUsers(),
    {
      onError: (error: any) => {
        console.error('Failed to load trending users:', error);
      },
    }
  );

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

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getRoomThumbnail = (room: DiscoverRoom): string => {
    return room.currentVideo?.thumbnail || room.thumbnail || '/api/placeholder/300/200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Discover</h1>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-white/70 hover:text-white transition-colors"
            >
              <Filter className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rooms, DJs, or genres..."
            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-white/50 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
          />
          <Search className="absolute right-6 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isActive = selectedFilter === filter.id;
            
            return (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-2xl transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? `bg-gradient-to-r ${filter.gradient} text-white shadow-lg`
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{filter.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Genre Filters */}
      {showFilters && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <h3 className="text-white font-bold text-lg mb-4">Genres</h3>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedGenre === genre
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {genre.charAt(0).toUpperCase() + genre.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trending Users */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <h2 className="text-white font-bold text-xl mb-4">Trending DJs</h2>
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {isLoadingUsers ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-24 h-32 bg-white/10 rounded-2xl animate-pulse"></div>
            ))
          ) : (
            trendingUsers?.data?.users?.map((user: TrendingUser) => (
              <Link
                key={user.id}
                to={`/user/${user.id}`}
                className="flex-shrink-0 w-24 text-center group"
              >
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-2 group-hover:scale-110 transition-all duration-300">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      user.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  {user.isLive && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
                <p className="text-white font-medium text-sm truncate">{user.username}</p>
                <p className="text-white/70 text-xs">{user.followers} followers</p>
                {user.currentRoom && (
                  <p className="text-pink-400 text-xs truncate">{user.currentRoom.name}</p>
                )}
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <h2 className="text-white font-bold text-xl mb-6">
          {selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)} Rooms
        </h2>
        
        {isLoadingRooms ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 animate-pulse">
                <div className="aspect-video bg-white/20 rounded-xl mb-4"></div>
                <div className="h-4 bg-white/20 rounded mb-2"></div>
                <div className="h-3 bg-white/20 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingRooms?.data?.rooms?.map((room: DiscoverRoom) => (
              <Link
                key={room.id}
                to={`/room/${room.id}`}
                className="group bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                {/* Room Thumbnail */}
                <div className="relative aspect-video">
                  <img
                    src={getRoomThumbnail(room)}
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Live Badge */}
                  {room.isLive && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>LIVE</span>
                    </div>
                  )}

                  {/* Privacy Badge */}
                  <div className="absolute top-3 right-3">
                    {room.isPublic ? (
                      <Globe className="w-5 h-5 text-green-400" />
                    ) : (
                      <Lock className="w-5 h-5 text-yellow-400" />
                    )}
                  </div>

                  {/* Participant Count */}
                  <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{room.participantCount}/{room.maxParticipants}</span>
                  </div>

                  {/* DJ Info */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {room.dj?.username?.charAt(0) || 'D'}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{room.dj?.username || 'DJ'}</p>
                        <p className="text-white/70 text-xs">{room.dj?.followers} followers</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Room Info */}
                <div className="p-6">
                  <h3 className="text-white font-bold text-lg mb-2 group-hover:text-pink-400 transition-colors">
                    {room.name}
                  </h3>
                  <p className="text-white/70 text-sm mb-4 line-clamp-2">
                    {room.description || 'Join the party!'}
                  </p>

                  {/* Current Video */}
                  {room.currentVideo && (
                    <div className="flex items-center space-x-2 mb-4">
                      <Music className="w-4 h-4 text-pink-400" />
                      <span className="text-white/70 text-sm truncate">
                        {room.currentVideo.title}
                      </span>
                      <span className="text-white/50 text-xs">
                        {formatDuration(room.currentVideo.duration)}
                      </span>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {room.tags?.slice(0, 3).map((tag: string) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-white/70 text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{room.likes || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{room.views || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(room.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Tab Bar */}
      <RaveBottomTabBar />
    </div>
  );
};

export default RaveDiscoverPage;
