import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  BarChart3, 
  AlertTriangle, 
  Settings, 
  Eye, 
  Ban, 
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
  MessageSquare,
  Video,
  Mic,
  Search,
  Filter,
  Download,
  RefreshCw,
  UserPlus,
  UserMinus,
  Crown,
  Star,
  Clock,
  Globe,
  Lock,
  Unlock,
  Trash2,
  Edit,
  MoreHorizontal,
  Calendar,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  Zap,
  Database,
  Server,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle2,
  X,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Share2,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Repeat,
  Shuffle,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Report,
  MessageCircle,
  Send,
  Image,
  FileText,
  Link,
  Hash,
  AtSign,
  Phone,
  Mail,
  MapPin,
  Globe2,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Desktop,
  Headphones,
  Mic2,
  Camera,
  VideoOff,
  MicOff,
  Wifi2,
  Signal,
  Battery,
  BatteryLow,
  BatteryFull,
  Power,
  PowerOff,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  Move,
  Grip,
  Drag,
  MousePointer,
  Hand,
  Eye2,
  EyeOff,
  Lock2,
  Unlock2,
  Key,
  KeyOff,
  Shield2,
  ShieldOff,
  Security,
  Verified,
  Unverified,
  Check,
  X2,
  Plus2,
  Minus2,
  Divide,
  Multiply,
  Equal,
  NotEqual,
  GreaterThan,
  LessThan,
  GreaterThanOrEqual,
  LessThanOrEqual,
  Infinity,
  Pi,
  Sigma,
  Alpha,
  Beta,
  Gamma,
  Delta,
  Epsilon,
  Zeta,
  Eta,
  Theta,
  Iota,
  Kappa,
  Lambda,
  Mu,
  Nu,
  Xi,
  Omicron,
  Rho,
  Tau,
  Upsilon,
  Phi,
  Chi,
  Psi,
  Omega
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

interface AdminStats {
  totalUsers: number;
  totalRooms: number;
  activeUsers: number;
  totalReports: number;
  pendingReports: number;
  totalBans: number;
  totalWarnings: number;
  totalFollows: number;
  totalLikes: number;
  totalViews: number;
  avgSessionDuration: number;
  peakConcurrentUsers: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  lastUpdated: Date;
}

interface PendingReport {
  id: string;
  reporterUsername: string;
  reportedUsername?: string;
  reportedRoomName?: string;
  reason: string;
  description: string;
  createdAt: Date;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
}

interface UserBan {
  id: string;
  username: string;
  reason: string;
  bannedBy: string;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  followersCount: number;
  followingCount: number;
  roomsCreated: number;
  totalViews: number;
  createdAt: Date;
  isBanned: boolean;
  warningCount: number;
}

interface Room {
  id: string;
  name: string;
  description?: string;
  ownerUsername: string;
  participantCount: number;
  isPublic: boolean;
  isActive: boolean;
  createdAt: Date;
  totalViews: number;
  totalLikes: number;
}

interface AnalyticsData {
  userGrowth: Array<{ date: string; newUsers: number; activeUsers: number }>;
  roomTrends: Array<{ date: string; newRooms: number; activeRooms: number }>;
  topRooms: Room[];
  topUsers: User[];
  retentionData: Array<{ cohort: string; day1: number; day7: number; day30: number }>;
  engagementMetrics: {
    avgSessionDuration: number;
    bounceRate: number;
    returnUserRate: number;
    contentEngagement: number;
  };
}

interface SystemHealth {
  database: 'healthy' | 'warning' | 'critical';
  redis: 'healthy' | 'warning' | 'critical';
  websocket: 'healthy' | 'warning' | 'critical';
  api: 'healthy' | 'warning' | 'critical';
  uptime: number;
  responseTime: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
  const [userBans, setUserBans] = useState<UserBan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Check if user is admin
  const isAdmin = user?.username === 'admin' || user?.email?.includes('admin');

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(fetchAdminData, 30000);
      setRefreshInterval(interval);
    }
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [isAdmin]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch all admin data in parallel
      const [
        statsResponse,
        reportsResponse,
        bansResponse,
        usersResponse,
        roomsResponse,
        analyticsResponse,
        healthResponse
      ] = await Promise.all([
        api.get('/analytics/platform'),
        api.get('/moderation/reports?status=pending'),
        api.get('/moderation/bans'),
        api.get('/users?limit=100'),
        api.get('/rooms?limit=100'),
        api.get('/analytics/detailed'),
        api.get('/system/health')
      ]);

      setStats(statsResponse.data.data.platform);
      setPendingReports(reportsResponse.data.data.reports);
      setUserBans(bansResponse.data.data.bans);
      setUsers(usersResponse.data.data.users);
      setRooms(roomsResponse.data.data.rooms);
      setAnalytics(analyticsResponse.data.data);
      setSystemHealth(healthResponse.data.data);

    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId: string, action: 'dismiss' | 'warn_user' | 'ban_user' | 'delete_content') => {
    try {
      await api.post(`/moderation/reports/${reportId}/resolve`, {
        action,
        actionDetails: `Resolved by admin: ${action}`
      });
      
      fetchAdminData();
    } catch (error) {
      console.error('Failed to resolve report:', error);
    }
  };

  const handleUnbanUser = async (banId: string) => {
    try {
      await api.delete(`/moderation/bans/${banId}`);
      fetchAdminData();
    } catch (error) {
      console.error('Failed to unban user:', error);
    }
  };

  const handleBanUser = async (userId: string, reason: string, duration?: number) => {
    try {
      await api.post('/moderation/ban', {
        userId,
        reason,
        duration
      });
      fetchAdminData();
    } catch (error) {
      console.error('Failed to ban user:', error);
    }
  };

  const handleWarnUser = async (userId: string, reason: string) => {
    try {
      await api.post('/moderation/warn', {
        userId,
        reason
      });
      fetchAdminData();
    } catch (error) {
      console.error('Failed to warn user:', error);
    }
  };

  const handleDeleteRoom = async (roomId: string, reason: string) => {
    try {
      await api.delete(`/rooms/${roomId}?reason=${reason}`);
      fetchAdminData();
    } catch (error) {
      console.error('Failed to delete room:', error);
    }
  };

  const handleBulkAction = async (action: 'ban' | 'warn' | 'delete') => {
    if (selectedUsers.length === 0) return;
    
    try {
      await api.post('/moderation/bulk', {
        userIds: selectedUsers,
        action,
        reason: `Bulk ${action} by admin`
      });
      
      setSelectedUsers([]);
      setShowBulkActions(false);
      fetchAdminData();
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
    }
  };

  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'banned' && user.isBanned) ||
                         (filterStatus === 'active' && user.isOnline) ||
                         (filterStatus === 'warned' && user.warningCount > 0);
    return matchesSearch && matchesFilter;
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-white">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Boltzy Admin Dashboard</h1>
            <p className="text-gray-400">Complete platform management and moderation</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchAdminData}
              className="flex items-center space-x-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <span className="text-sm text-gray-400">Welcome, {user?.username}</span>
            <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">{user?.username?.charAt(0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'moderation', label: 'Moderation', icon: Shield },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'rooms', label: 'Rooms', icon: Video },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'system', label: 'System', icon: Server }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-pink-500 text-pink-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* System Health */}
            {systemHealth && (
              <div className="bg-gray-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">System Health</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-3">
                    <Database className={`w-6 h-6 ${systemHealth.database === 'healthy' ? 'text-green-400' : systemHealth.database === 'warning' ? 'text-yellow-400' : 'text-red-400'}`} />
                    <div>
                      <p className="text-sm text-gray-400">Database</p>
                      <p className={`font-semibold ${systemHealth.database === 'healthy' ? 'text-green-400' : systemHealth.database === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
                        {systemHealth.database}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Server className={`w-6 h-6 ${systemHealth.redis === 'healthy' ? 'text-green-400' : systemHealth.redis === 'warning' ? 'text-yellow-400' : 'text-red-400'}`} />
                    <div>
                      <p className="text-sm text-gray-400">Redis</p>
                      <p className={`font-semibold ${systemHealth.redis === 'healthy' ? 'text-green-400' : systemHealth.redis === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
                        {systemHealth.redis}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Wifi className={`w-6 h-6 ${systemHealth.websocket === 'healthy' ? 'text-green-400' : systemHealth.websocket === 'warning' ? 'text-yellow-400' : 'text-red-400'}`} />
                    <div>
                      <p className="text-sm text-gray-400">WebSocket</p>
                      <p className={`font-semibold ${systemHealth.websocket === 'healthy' ? 'text-green-400' : systemHealth.websocket === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
                        {systemHealth.websocket}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Zap className={`w-6 h-6 ${systemHealth.api === 'healthy' ? 'text-green-400' : systemHealth.api === 'warning' ? 'text-yellow-400' : 'text-red-400'}`} />
                    <div>
                      <p className="text-sm text-gray-400">API</p>
                      <p className={`font-semibold ${systemHealth.api === 'healthy' ? 'text-green-400' : systemHealth.api === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
                        {systemHealth.api}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-6 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">Total Users</p>
                    <p className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</p>
                    <p className="text-white/60 text-xs">+12% this week</p>
                  </div>
                  <Users className="w-8 h-8 text-white/80" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-6 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">Active Rooms</p>
                    <p className="text-3xl font-bold text-white">{stats?.totalRooms || 0}</p>
                    <p className="text-white/60 text-xs">+8% this week</p>
                  </div>
                  <Video className="w-8 h-8 text-white/80" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">Active Users</p>
                    <p className="text-3xl font-bold text-white">{stats?.activeUsers || 0}</p>
                    <p className="text-white/60 text-xs">+15% this week</p>
                  </div>
                  <Activity className="w-8 h-8 text-white/80" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">Pending Reports</p>
                    <p className="text-3xl font-bold text-white">{stats?.pendingReports || 0}</p>
                    <p className="text-white/60 text-xs">-3% this week</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-white/80" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('moderation')}
                  className="flex items-center space-x-3 p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors"
                >
                  <Shield className="w-6 h-6 text-yellow-400" />
                  <div className="text-left">
                    <p className="font-semibold text-white">Review Reports</p>
                    <p className="text-sm text-gray-400">{stats?.pendingReports || 0} pending</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('users')}
                  className="flex items-center space-x-3 p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors"
                >
                  <Users className="w-6 h-6 text-blue-400" />
                  <div className="text-left">
                    <p className="font-semibold text-white">Manage Users</p>
                    <p className="text-sm text-gray-400">{stats?.totalUsers || 0} total users</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className="flex items-center space-x-3 p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors"
                >
                  <BarChart3 className="w-6 h-6 text-green-400" />
                  <div className="text-left">
                    <p className="font-semibold text-white">View Analytics</p>
                    <p className="text-sm text-gray-400">Platform insights</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'moderation' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Content Moderation</h2>
            
            {/* Pending Reports */}
            <div className="bg-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Pending Reports</h3>
              <div className="space-y-4">
                {pendingReports.map(report => (
                  <div key={report.id} className="bg-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-400">Reported by: {report.reporterUsername}</span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-gray-400">{new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                        {report.reason}
                      </span>
                    </div>
                    
                    <p className="text-white mb-2">{report.description}</p>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleResolveReport(report.id, 'dismiss')}
                        className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-500"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleResolveReport(report.id, 'warn_user')}
                        className="px-3 py-1 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600"
                      >
                        Warn User
                      </button>
                      <button
                        onClick={() => handleResolveReport(report.id, 'ban_user')}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                      >
                        Ban User
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User Bans */}
            <div className="bg-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Active Bans</h3>
              <div className="space-y-4">
                {userBans.map(ban => (
                  <div key={ban.id} className="bg-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">{ban.username}</p>
                        <p className="text-sm text-gray-400">Banned by: {ban.bannedBy}</p>
                        <p className="text-sm text-gray-400">Reason: {ban.reason}</p>
                        <p className="text-sm text-gray-400">
                          {ban.expiresAt ? `Expires: ${new Date(ban.expiresAt).toLocaleDateString()}` : 'Permanent ban'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleUnbanUser(ban.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                      >
                        Unban
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">User Management</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active</option>
                  <option value="banned">Banned</option>
                  <option value="warned">Warned</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
              <div className="bg-gray-800 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-white">{selectedUsers.length} users selected</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleBulkAction('warn')}
                      className="px-3 py-1 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600"
                    >
                      Warn Selected
                    </button>
                    <button
                      onClick={() => handleBulkAction('ban')}
                      className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                    >
                      Ban Selected
                    </button>
                    <button
                      onClick={() => setSelectedUsers([])}
                      className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-500"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="bg-gray-800 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-white font-semibold">User</th>
                    <th className="px-4 py-3 text-left text-white font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-white font-semibold">Stats</th>
                    <th className="px-4 py-3 text-left text-white font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map(user => (
                    <tr key={user.id} className="border-t border-gray-700 hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleUserSelection(user.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                            alt={user.username}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <p className="text-white font-semibold">{user.username}</p>
                            <p className="text-sm text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          {user.isOnline ? (
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          ) : (
                            <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                          )}
                          <span className="text-sm text-gray-400">
                            {user.isOnline ? 'Online' : 'Offline'}
                          </span>
                          {user.isBanned && (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                              Banned
                            </span>
                          )}
                          {user.warningCount > 0 && (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                              {user.warningCount} warnings
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-400">
                          <p>Followers: {user.followersCount}</p>
                          <p>Rooms: {user.roomsCreated}</p>
                          <p>Views: {user.totalViews}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleWarnUser(user.id, 'Admin warning')}
                            className="px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                          >
                            Warn
                          </button>
                          <button
                            onClick={() => handleBanUser(user.id, 'Admin ban', 24)}
                            className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                          >
                            Ban
                          </button>
                          <button className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-500">
                            <MoreHorizontal className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-gray-400">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 bg-pink-500 text-white rounded-lg">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage * itemsPerPage >= filteredUsers.length}
                  className="px-3 py-1 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rooms' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Room Management</h2>
            <div className="bg-gray-800 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map(room => (
                  <div key={room.id} className="bg-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold">{room.name}</h3>
                      <div className="flex items-center space-x-2">
                        {room.isPublic ? (
                          <Globe className="w-4 h-4 text-green-400" />
                        ) : (
                          <Lock className="w-4 h-4 text-yellow-400" />
                        )}
                        {room.isActive ? (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        ) : (
                          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">Owner: {room.ownerUsername}</p>
                    <p className="text-sm text-gray-400 mb-2">Participants: {room.participantCount}</p>
                    <p className="text-sm text-gray-400 mb-4">Views: {room.totalViews}</p>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDeleteRoom(room.id, 'Admin deletion')}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                      >
                        Delete
                      </button>
                      <button className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-500">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Platform Analytics</h2>
            <div className="bg-gray-800 rounded-2xl p-6">
              <p className="text-gray-400">Analytics dashboard coming soon...</p>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">System Monitoring</h2>
            <div className="bg-gray-800 rounded-2xl p-6">
              <p className="text-gray-400">System monitoring dashboard coming soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;