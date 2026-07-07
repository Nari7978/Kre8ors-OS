import { apiClient } from './apiClient';

export interface MessagePayload {
  creatorId: string;
  fanId: string;
  text?: string;
  mediaUrls?: string[];
  price?: number;
}

export interface PpvTemplatePayload {
  templateId?: string;
  creatorId?: string;
  name: string;
  description?: string;
  price: number;
  pricingRules?: any[];
  messageText: string;
  mediaUrls: string[];
  lockType?: string;
  previewSeconds?: number;
}

export const messagesService = {
  getMessages: async (creatorId: string, fanId: string, cursor?: string, limit?: number) => {
    const params: any = { creatorId, fanId };
    if (cursor) params.cursor = cursor;
    if (limit) params.limit = limit;
    const response = await apiClient.get('/api/messages', { params });
    return response.data;
  },

  sendMessage: async (payload: MessagePayload) => {
    const response = await apiClient.post('/api/messages', payload);
    return response.data;
  },

  unlockMessage: async (messageId: string) => {
    const response = await apiClient.post('/api/messages/unlock', { messageId });
    return response.data;
  },

  getPpvTemplates: async (creatorId: string) => {
    const response = await apiClient.get('/api/messages/ppv-templates', {
      params: { creatorId },
    });
    return response.data;
  },

  savePpvTemplate: async (payload: PpvTemplatePayload) => {
    const response = await apiClient.post('/api/messages/ppv-templates', payload);
    return response.data;
  },

  deletePpvTemplate: async (templateId: string) => {
    const response = await apiClient.delete('/api/messages/ppv-templates', {
      params: { templateId },
    });
    return response.data;
  },
};
