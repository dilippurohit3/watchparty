import { api } from './api';

export const trendingApi = {
  // Get trending rooms
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

  // Get trending users
  getTrendingUsers: (params: {
    page?: number;
    limit?: number;
  } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    
    return api.get(`/trending/users?${searchParams.toString()}`);
  },

  // Get room categories
  getRoomCategories: () =>
    api.get('/trending/categories'),
};
