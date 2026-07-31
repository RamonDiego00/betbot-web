import { apiClient } from '../client';
import { LucroMensalItem, SaldoCasaItem, PontoSaldo, TopMercadoItem, FluxoCaixaItem } from '@/types/api';

export interface FinanceiroPeriodParams {
  period: string;
  startDate?: string;
  endDate?: string;
}

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

  /**
   * Série temporal do saldo da banca (para o gráfico de evolução).
   * GET /api/v1/financeiro/evolucao-saldo → PontoSaldo[]
   */
  getEvolucaoSaldo: async (params: FinanceiroPeriodParams): Promise<PontoSaldo[]> => {
    const response = await apiClient.get<PontoSaldo[]>('/api/v1/financeiro/evolucao-saldo', { params });
    return response.data ?? [];
  },

  /**
   * Mercados e linhas mais apostados no período (para a tabela de top mercados).
   * GET /api/v1/financeiro/top-mercados → TopMercadoItem[]
   */
  getTopMercados: async (params: FinanceiroPeriodParams): Promise<TopMercadoItem[]> => {
    const response = await apiClient.get<TopMercadoItem[]>('/api/v1/financeiro/top-mercados', { params });
    return response.data ?? [];
  },

  /**
   * Composição do fluxo de caixa do período (para o gráfico de cascata).
   * GET /api/v1/financeiro/fluxo-caixa → FluxoCaixaItem
   */
  getFluxoCaixa: async (params: FinanceiroPeriodParams): Promise<FluxoCaixaItem> => {
    const response = await apiClient.get<FluxoCaixaItem>('/api/v1/financeiro/fluxo-caixa', { params });
    return response.data;
  },
};
