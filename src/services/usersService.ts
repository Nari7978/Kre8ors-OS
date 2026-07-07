import { apiClient } from './apiClient';

export interface UpdateFanProfilePayload {
  fanId: string;
  displayName?: string;
  notes?: string;
  customTags?: string[];
  isSubscriber?: boolean;
  expiresAt?: string | null;
}

export const usersService = {
  getFans: async (creatorId: string, filters: any = {}) => {
    const response = await apiClient.get('/api/fans', {
      params: { creatorId, ...filters },
    });
    return response.data;
  },

  getUniqueTags: async (creatorId: string) => {
    const response = await apiClient.get('/api/fans', {
      params: { creatorId, tagsOnly: 'true' },
    });
    return response.data;
  },

  updateFanProfile: async (payload: UpdateFanProfilePayload) => {
    const response = await apiClient.patch('/api/fans', payload);
    return response.data;
  },

  globalTagAction: async (creatorId: string, action: 'rename' | 'delete', oldTag?: string, newTag?: string, tag?: string) => {
    const response = await apiClient.patch('/api/fans', {
      creatorId,
      globalAction: action,
      oldTag,
      newTag,
      tag,
    });
    return response.data;
  },

  bulkTagAction: async (fanIds: string[], action: 'add' | 'remove', tag: string) => {
    const response = await apiClient.patch('/api/fans', {
      fanIds,
      bulkAction: action,
      tag,
    });
    return response.data;
  },

  dispatchBulkCampaign: async (creatorId: string, fanIds: string[], text: string) => {
    const response = await apiClient.post('/api/fans/bulk-message', {
      creatorId,
      fanIds,
      text,
    });
    return response.data;
  },
};
