import { apiClient } from './apiClient';

export const notificationsService = {
  getNotifications: async (creatorId: string) => {
    const response = await apiClient.get('/api/notifications', {
      params: { creatorId },
    });
    return response.data;
  },

  markAsRead: async (notificationId: string) => {
    const response = await apiClient.patch('/api/notifications', {
      notificationId,
    });
    return response.data;
  },

  markAllAsRead: async (creatorId: string) => {
    const response = await apiClient.patch('/api/notifications', {
      creatorId,
      markAll: true,
    });
    return response.data;
  },

  deleteNotification: async (notificationId: string) => {
    const response = await apiClient.delete('/api/notifications', {
      params: { notificationId },
    });
    return response.data;
  },

  clearAll: async (creatorId: string) => {
    const response = await apiClient.delete('/api/notifications', {
      params: { creatorId, clearAll: 'true' },
    });
    return response.data;
  },

  getPreferences: async (creatorId: string) => {
    const response = await apiClient.get('/api/notifications/preferences', {
      params: { creatorId },
    });
    return response.data;
  },

  savePreferences: async (creatorId: string, preferences: any) => {
    const response = await apiClient.post('/api/notifications/preferences', {
      creatorId,
      ...preferences,
    });
    return response.data;
  },
};
