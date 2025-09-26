import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Play, 
  Users, 
  Heart, 
  TrendingUp, 
  Clock, 
  Star,
  Fire,
  Music,
  Plus,
  Search
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from 'react-query';
import { roomApi, trendingApi } from '../services/api';
import RaveBottomTabBar from '../components/RaveBottomTabBar';
import UserProfileCard from '../components/UserProfileCard';
import BoltzyOnboarding from '../components/BoltzyOnboarding';

interface TrendingRoom {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  participantCount: number;
  maxParticipants: number;
  isLive: boolean;
  dj: {
    username: string;
    avatar: string;
  };
  currentVideo: {
    title: string;
    thumbnail: string;
  };
  tags: string[];
  createdAt: Date;
}

const RaveHomePage: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('trending');
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Get trending rooms
  const { data: trendingRooms, isLoading } = useQuery(
    ['trending-rooms'],
    () => trendingApi.getTrendingRooms({ page: 1, limit: 20 }),
    {
      onError: (error: any) => {
        console.error('Failed to load trending rooms:', error);
      },
    }
  );

  // Get trending users
  const { data: trendingUsers, isLoading: usersLoading } = useQuery(
    ['trending-users'],
    () => trendingApi.getTrendingUsers({ page: 1, limit: 6 }),
    {
      onError: (error: any) => {
        console.error('Failed to load trending users:', error);
      },
    }
  );

  const categories = [
    { id: 'trending', label: 'Trending', icon: TrendingUp, gradient: 'from-pink-500 to-purple-500' },
    { id: 'live', label: 'Live Now', icon: Play, gradient: 'from-red-500 to-orange-500' },
    { id: 'new', label: 'New', icon: Star, gradient: 'from-blue-500 to-cyan-500' },
    { id: 'popular', label: 'Popular', icon: Fire, gradient: 'from-yellow-500 to-red-500' }
  ];

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

  // Check if user needs onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('boltzy-onboarding-seen');
    if (!hasSeenOnboarding && user) {
      setShowOnboarding(true);
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('boltzy-onboarding-seen', 'true');
    setShowOnboarding(false);
  };

  const getRoomThumbnail = (room: any): string => {
    return room.currentVideo?.thumbnail || room.thumbnail || '/api/placeholder/300/200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Boltzy</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-white/70 hover:text-white transition-colors">
                <Search className="w-6 h-6" />
              </button>
              <Link
                to="/create"
                className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:scale-105 transition-all duration-300"
              >
                <Plus className="w-6 h-6" />
              </Link>
            </div>
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

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-2xl transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? `bg-gradient-to-r ${category.gradient} text-white shadow-lg`
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {isLoading ? (
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
            {trendingRooms?.data?.rooms?.map((room: any) => (
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

                  {/* Participant Count */}
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1">
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
                        <p className="text-white/70 text-xs">DJ</p>
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
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>{room.likes || 0}</span>
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

      {/* Trending Users Section */}
      <div className="px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Trending DJs</h2>
          <Link 
            to="/discover" 
            className="text-pink-400 hover:text-pink-300 text-sm font-medium transition-colors"
          >
            See All
          </Link>
        </div>

        {usersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-white/20 rounded mb-2" />
                    <div className="h-3 bg-white/20 rounded w-2/3" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-8 bg-white/20 rounded" />
                  <div className="h-8 bg-white/20 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : trendingUsers?.data?.users?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingUsers.data.users.map((user: any) => (
              <UserProfileCard
                key={user.id}
                user={user}
                showFollowButton={true}
                isFollowing={false}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white/50" />
            </div>
            <p className="text-white/70">No trending users found</p>
          </div>
        )}
      </div>

      {/* Bottom Tab Bar */}
      <RaveBottomTabBar />

      {/* Onboarding Modal */}
      <BoltzyOnboarding
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
};

export default RaveHomePage;
