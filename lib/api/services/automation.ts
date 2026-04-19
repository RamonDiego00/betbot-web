import { apiClient } from '../client';
import { Machine, BetWorkerJsonResponse } from '@/types/api';

export const automationService = {
  getMachines: async (): Promise<Machine[]> => {
    const response = await apiClient.get<Machine[]>('/api/v1/automation/machines');
    return response.data;
  },

  getDailyBets: async (date?: string): Promise<BetWorkerJsonResponse> => {
    const response = await apiClient.get<BetWorkerJsonResponse>('/api/v1/bets/daily-generation', {
      params: { date }
    });
    return response.data;
  },
};
