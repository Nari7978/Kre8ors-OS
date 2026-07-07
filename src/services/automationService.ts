import { apiClient } from './apiClient';

export interface CreateRulePayload {
  creatorId: string;
  name: string;
  triggerType: string;
  conditions: any;
  actionType: string;
  actionData: any;
}

export const automationService = {
  getRules: async (creatorId: string) => {
    const response = await apiClient.get('/api/automations', {
      params: { creatorId },
    });
    return response.data;
  },

  createRule: async (payload: CreateRulePayload) => {
    const response = await apiClient.post('/api/automations', payload);
    return response.data;
  },

  toggleRule: async (ruleId: string, isActive: boolean) => {
    const response = await apiClient.post('/api/automations', {
      ruleId,
      isActive,
    });
    return response.data;
  },

  deleteRule: async (ruleId: string) => {
    const response = await apiClient.delete('/api/automations', {
      params: { ruleId },
    });
    return response.data;
  },
};
