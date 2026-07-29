import { apiClient } from '../client';
import { LucroMensalItem, SaldoCasaItem } from '@/types/api';

export const financeiroService = {
  /**
   * Lucro consolidado por mês (para o gráfico de barras).
   * GET /api/v1/financeiro/lucro-mensal → LucroMensalItem[]
   */
  getLucroMensal: async (): Promise<LucroMensalItem[]> => {
    const response = await apiClient.get<LucroMensalItem[]>('/api/v1/financeiro/lucro-mensal');
    return response.data ?? [];
  },

  /**
   * Saldos por casa de apostas (para a tabela de saldos).
   * GET /api/v1/financeiro/saldos → SaldoCasaItem[]
   */
  getSaldos: async (): Promise<SaldoCasaItem[]> => {
    const response = await apiClient.get<SaldoCasaItem[]>('/api/v1/financeiro/saldos');
    return response.data ?? [];
  },
};
