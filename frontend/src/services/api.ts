import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { User, Room, Video, ChatMessage, Playlist, ApiResponse } from '@shared';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<{ user: User; token: string; refreshToken: string }> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data.data;
  },

  register: async (username: string, email: string, password: string): Promise<{ user: User; token: string; refreshToken: string }> => {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put('/auth/profile', data);
    return response.data.data;
  },

  refreshToken: async (): Promise<{ token: string; refreshToken: string }> => {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data.data;
  },
};

// Room API
export const roomApi = {
  createRoom: async (data: {
    name: string;
    description?: string;
    isPublic?: boolean;
    password?: string;
    maxParticipants?: number;
  }): Promise<Room> => {
    const response = await api.post('/rooms', data);
    return response.data.data.room;
  },

  getRoom: async (roomId: string): Promise<Room> => {
    const response = await api.get(`/rooms/${roomId}`);
    return response.data.data.room;
  },

  updateRoom: async (roomId: string, data: Partial<Room>): Promise<Room> => {
    const response = await api.put(`/rooms/${roomId}`, data);
    return response.data.data.room;
  },

  deleteRoom: async (roomId: string): Promise<void> => {
    await api.delete(`/rooms/${roomId}`);
  },

  joinRoom: async (roomId: string, password?: string): Promise<Room> => {
    const response = await api.post(`/rooms/${roomId}/join`, { password });
    return response.data.data.room;
  },

  leaveRoom: async (roomId: string): Promise<void> => {
    await api.post(`/rooms/${roomId}/leave`);
  },

  getRooms: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ rooms: Room[]; pagination: any }> => {
    const response = await api.get('/rooms', { params });
    return response.data.data;
  },
};

// Video API
export const videoApi = {
  uploadVideo: async (file: File, onProgress?: (progress: number) => void): Promise<Video> => {
    const formData = new FormData();
    formData.append('video', file);

    const response = await api.post('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data.data;
  },

  getVideo: async (videoId: string): Promise<Video> => {
    const response = await api.get(`/videos/${videoId}`);
    return response.data.data;
  },

  deleteVideo: async (videoId: string): Promise<void> => {
    await api.delete(`/videos/${videoId}`);
  },

  searchYouTube: async (query: string): Promise<Video[]> => {
    const response = await api.get('/videos/youtube/search', { params: { q: query } });
    return response.data.data;
  },
};

// Chat API
export const chatApi = {
  getMessages: async (roomId: string, page = 1, limit = 50): Promise<ChatMessage[]> => {
    const response = await api.get(`/chat/${roomId}/messages`, {
      params: { page, limit },
    });
    return response.data.data;
  },

  sendMessage: async (roomId: string, message: string): Promise<ChatMessage> => {
    const response = await api.post(`/chat/${roomId}/messages`, { message });
    return response.data.data;
  },

  addReaction: async (messageId: string, emoji: string): Promise<void> => {
    await api.post(`/chat/messages/${messageId}/reactions`, { emoji });
  },

  removeReaction: async (messageId: string, emoji: string): Promise<void> => {
    await api.delete(`/chat/messages/${messageId}/reactions`, { data: { emoji } });
  },
};

// Playlist API
export const playlistApi = {
  getPlaylist: async (roomId: string): Promise<Playlist> => {
    const response = await api.get(`/playlist/${roomId}`);
    return response.data.data;
  },

  addVideo: async (roomId: string, video: Video): Promise<void> => {
    await api.post(`/playlist/${roomId}/videos`, video);
  },

  removeVideo: async (roomId: string, videoId: string): Promise<void> => {
    await api.delete(`/playlist/${roomId}/videos/${videoId}`);
  },

  reorderVideos: async (roomId: string, videoIds: string[]): Promise<void> => {
    await api.put(`/playlist/${roomId}/reorder`, { videoIds });
  },

  clearPlaylist: async (roomId: string): Promise<void> => {
    await api.delete(`/playlist/${roomId}`);
  },
};

// Follow API
export const followApi = {
  followUser: (userId: string) => 
    api.post(`/follow/${userId}`),

  unfollowUser: (userId: string) => 
    api.delete(`/follow/${userId}`),

  getFollowers: (userId: string, page = 1, limit = 20) =>
    api.get(`/follow/${userId}/followers?page=${page}&limit=${limit}`),

  getFollowing: (userId: string, page = 1, limit = 20) =>
    api.get(`/follow/${userId}/following?page=${page}&limit=${limit}`),

  getFollowStatus: (userId: string) =>
    api.get(`/follow/${userId}/status`),
};

// Trending API
export const trendingApi = {
  getTrendingRooms: (params: {
    page?: number;
    limit?: number;
    category?: string;
  } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.category) searchParams.append('category', params.category);
    
    return api.get(`/trending/rooms?${searchParams.toString()}`);
  },

  getTrendingUsers: (params: {
    page?: number;
    limit?: number;
  } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    
    return api.get(`/trending/users?${searchParams.toString()}`);
  },

  getRoomCategories: () =>
    api.get('/trending/categories'),
};

// DJ Control API
export const djApi = {
  requestControl: (roomId: string) =>
    api.post(`/dj/${roomId}/request-control`),

  approveControlRequest: (roomId: string, requestId: string) =>
    api.post(`/dj/${roomId}/requests/${requestId}/approve`),

  rejectControlRequest: (roomId: string, requestId: string) =>
    api.post(`/dj/${roomId}/requests/${requestId}/reject`),

  getControlRequests: (roomId: string) =>
    api.get(`/dj/${roomId}/requests`),

  removeCoHost: (roomId: string, userId: string) =>
    api.delete(`/dj/${roomId}/co-hosts/${userId}`),

  transferHost: (roomId: string, newHostId: string) =>
    api.post(`/dj/${roomId}/transfer-host`, { newHostId }),
};

export default api;
