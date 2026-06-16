import { apiClient } from '../client';
import { BetHistoryItem, PagedResponse, Ticket } from '@/types/api';

function mapToTicket(item: BetHistoryItem): Ticket {
  return {
    id: item.id,
    date: item.date,
    market: item.market,
    selection: item.selection,
    odds: item.odd,
    stake: item.stake,
    profit: item.profit ?? 0,
    result: item.status,
  };
}

export const ticketService = {
  /**
   * Histórico paginado de apostas.
   * GET /api/v1/historico-apostas → PagedResponse<BetHistoryItem>
   *
   * Retorna os tickets normalizados (odd→odds, status→result) e a paginação.
   */
  getHistory: async (
    page = 0,
    size = 20,
    filters?: Record<string, string>,
  ): Promise<{ tickets: Ticket[]; totalPages: number; totalItems: number; currentPage: number }> => {
    const response = await apiClient.get<PagedResponse<BetHistoryItem>>('/api/v1/historico-apostas', {
      params: { page, size, ...filters },
    });
    const paged = response.data;
    return {
      tickets: (paged.items ?? []).map(mapToTicket),
      totalPages: paged.totalPages,
      totalItems: paged.totalItems,
      currentPage: paged.currentPage,
    };
  },
};
