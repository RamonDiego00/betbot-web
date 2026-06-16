import { apiClient } from '../client';
import { MarketStatsRaw, StrategyPerformance } from '@/types/api';

function mapToStrategyPerformance(raw: MarketStatsRaw, index: number): StrategyPerformance {
  return {
    strategyName: raw.market,
    totalBets: raw.quantidadeApostas,
    profit: raw.lucroTotal,
    roi: raw.roi,
    ranking: index + 1,
    winRate: raw.winRate,
  };
}

export const reportService = {
  /**
   * Performance por mercado, mapeada para o shape StrategyPerformance usado na página de analytics.
   * GET /api/v1/analytics/markets → MarketStatsRaw[] → StrategyPerformance[]
   */
  getStrategyPerformance: async (): Promise<StrategyPerformance[]> => {
    const response = await apiClient.get<MarketStatsRaw[]>('/api/v1/analytics/markets');
    return (response.data ?? []).map(mapToStrategyPerformance);
  },
};
