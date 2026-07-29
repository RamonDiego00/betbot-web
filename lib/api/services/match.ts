import { apiClient } from '../client';
import { MatchDetail, MatchInsights } from '@/types/api';

export const matchService = {
  /**
   * Detalhe de um confronto: arquétipo do jogo + pernas de aposta geradas
   */
  getMatchDetail: async (fixtureId: number): Promise<MatchDetail> => {
    const response = await apiClient.get<MatchDetail>(`/api/v1/dashboard/matches/${fixtureId}`);
    return response.data;
  },

  /**
   * Visão estratégica: forma recente + médias dos times e odds por mercado
   */
  getMatchInsights: async (fixtureId: number): Promise<MatchInsights> => {
    const response = await apiClient.get<MatchInsights>(`/api/v1/dashboard/matches/${fixtureId}/insights`);
    return response.data;
  },
};
