import { apiClient } from '../client';
import { Game, SummaryKPIs, Bankroll, FinancialSetupPayload } from '@/types/api';

export const dashboardService = {
  getTodayGames: async (): Promise<Game[]> => {
    const response = await apiClient.get<Game[]>('/api/v1/dashboard/games/today');
    return response.data;
  },

  getSummary: async (): Promise<SummaryKPIs> => {
    const response = await apiClient.get<SummaryKPIs>('/api/v1/dashboard/summary');
    return response.data;
  },

  getBankrolls: async (): Promise<Bankroll[]> => {
    const response = await apiClient.get<Bankroll[]>('/api/v1/dashboard/bankrolls');
    return response.data;
  },

  setupFinancial: async (payload: FinancialSetupPayload): Promise<void> => {
    await apiClient.post('/api/v1/dashboard/financial/setup', payload);
  },
};
