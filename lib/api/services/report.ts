import { apiClient } from '../client';
import { StrategyPerformance } from '@/types/api';

export const reportService = {
  getStrategyPerformance: async (): Promise<StrategyPerformance[]> => {
    const response = await apiClient.get<StrategyPerformance[]>('/api/v1/reports/strategy-performance');
    return response.data;
  },
};
