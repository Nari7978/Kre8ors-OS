import { apiClient } from './apiClient';

export interface CreatePostPayload {
  creatorId: string;
  text: string;
  mediaUrls?: string[];
  scheduledFor?: string | null;
  price?: number;
  status?: string;
}

export const postsService = {
  getPosts: async (creatorId: string) => {
    const response = await apiClient.get('/api/posts', {
      params: { creatorId },
    });
    return response.data;
  },

  createPost: async (payload: CreatePostPayload) => {
    const response = await apiClient.post('/api/posts', payload);
    return response.data;
  },

  publishNow: async (postId: string) => {
    const response = await apiClient.patch('/api/posts', {
      postId,
      action: 'publish_now',
    });
    return response.data;
  },

  deletePost: async (postId: string) => {
    const response = await apiClient.delete('/api/posts', {
      params: { postId },
    });
    return response.data;
  },
};
