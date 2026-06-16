import { apiClient } from '../client';
import { LucroMensalItem, MetaFinanceiraItem, SaldoCasaItem } from '@/types/api';

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
   * Metas e limites financeiros (para os círculos de progresso).
   * GET /api/v1/financeiro/metas-limites → MetaFinanceiraItem[]
   */
  getMetas: async (): Promise<MetaFinanceiraItem[]> => {
    const response = await apiClient.get<MetaFinanceiraItem[]>('/api/v1/financeiro/metas-limites');
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
