import { api } from './api';

export const followApi = {
  // Follow a user
  followUser: (userId: string) => 
    api.post(`/follow/${userId}`),

  // Unfollow a user
  unfollowUser: (userId: string) => 
    api.delete(`/follow/${userId}`),

  // Get user's followers
  getFollowers: (userId: string, page = 1, limit = 20) =>
    api.get(`/follow/${userId}/followers?page=${page}&limit=${limit}`),

  // Get user's following
  getFollowing: (userId: string, page = 1, limit = 20) =>
    api.get(`/follow/${userId}/following?page=${page}&limit=${limit}`),

  // Get follow status (for current user)
  getFollowStatus: (userId: string) =>
    api.get(`/follow/${userId}/status`),
};
