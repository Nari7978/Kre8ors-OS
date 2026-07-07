import { apiClient } from './apiClient';

export const analyticsService = {
  getConversions: async (creatorId: string) => {
    const response = await apiClient.get('/api/analytics/conversions', {
      params: { creatorId },
    });
    return response.data;
  },

  getOperators: async () => {
    const response = await apiClient.get('/api/analytics/operators');
    return response.data;
  },

  getRetention: async (creatorId: string) => {
    const response = await apiClient.get('/api/analytics/retention', {
      params: { creatorId },
    });
    return response.data;
  },

  getEarnings: async (creatorId: string) => {
    const response = await apiClient.get('/api/earnings', {
      params: { creatorId },
    });
    return response.data;
  },

  getPayouts: async (creatorId: string) => {
    const response = await apiClient.get('/api/earnings/payouts', {
      params: { creatorId },
    });
    return response.data;
  },

  getTransactions: async (creatorId: string, filters: any = {}) => {
    const response = await apiClient.get('/api/earnings/transactions', {
      params: { creatorId, ...filters },
    });
    return response.data;
  },
};
