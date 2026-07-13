import { apiClient } from '../client';
import { BillingStatement, LucroMensalItem, SaldoCasaItem } from '@/types/api';

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
   * Envia o comprovante de lucro mensal (PDF). Reenviar o mesmo período substitui o anterior.
   * POST /api/v1/billing/statements (multipart/form-data)
   *
   * Não seta o Content-Type manualmente com o boundary do multipart — o axios faz isso sozinho.
   * O `headers: { 'Content-Type': undefined }` aqui só remove o default 'application/json' da
   * instância do apiClient, que senão faria o axios serializar o FormData como JSON.
   */
  uploadComprovante: async (period: string, file: File, declaredProfit?: number): Promise<void> => {
    const formData = new FormData();
    formData.append('period', period);
    formData.append('file', file);
    if (declaredProfit !== undefined) formData.append('declaredProfit', String(declaredProfit));

    await apiClient.post('/api/v1/billing/statements', formData, {
      headers: { 'Content-Type': undefined },
    });
  },

  /**
   * Lista os comprovantes de lucro mensal do usuário logado.
   * GET /api/v1/billing/statements → BillingStatement[]
   */
  getMeusComprovantes: async (): Promise<BillingStatement[]> => {
    const response = await apiClient.get<BillingStatement[]>('/api/v1/billing/statements');
    return response.data ?? [];
  },

  /**
   * Busca o PDF bruto de um comprovante (para preview/download via blob).
   * GET /api/v1/billing/statements/{id}/file
   */
  getComprovanteFile: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/v1/billing/statements/${id}/file`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
