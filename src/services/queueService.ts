import { apiClient } from './apiClient';

export const queueService = {
  triggerQueueWorker: async () => {
    const response = await apiClient.get('/api/posts/worker');
    return response.data;
  },
};
