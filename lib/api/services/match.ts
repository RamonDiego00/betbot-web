import { apiClient } from '../client';
import { MatchDetail } from '@/types/api';

export const matchService = {
  /**
   * Detalhe de um confronto: arquétipo do jogo + pernas de aposta geradas
   */
  getMatchDetail: async (fixtureId: number): Promise<MatchDetail> => {
    const response = await apiClient.get<MatchDetail>(`/api/v1/dashboard/matches/${fixtureId}`);
    return response.data;
  },
};
