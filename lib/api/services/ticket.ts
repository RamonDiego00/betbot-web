import { apiClient } from '../client';
import { TicketHistoryItem, TicketHistoryPeriod, TicketHistoryResponse } from '@/types/api';

export const ticketService = {
  /**
   * Histórico de apostas (granularidade por ticket, sem paginação).
   * GET /api/v1/tickets/history?period={daily|weekly|monthly|custom}&startDate&endDate
   *
   * `startDate`/`endDate` só são considerados quando `period=custom`.
   */
  getHistory: async (
    period: TicketHistoryPeriod = 'daily',
    range?: { startDate?: string; endDate?: string },
  ): Promise<{ tickets: TicketHistoryItem[]; totalTickets: number; period: TicketHistoryPeriod }> => {
    const params: Record<string, string> = { period };
    if (period === 'custom') {
      if (range?.startDate) params.startDate = range.startDate;
      if (range?.endDate) params.endDate = range.endDate;
    }
    const response = await apiClient.get<TicketHistoryResponse>('/api/v1/tickets/history', { params });
    const data = response.data;
    return {
      // `matches`/`legs` podem vir ausentes ou null (dias sem cache no servidor) — normaliza para array.
      tickets: (data.tickets ?? []).map((ticket) => ({
        ...ticket,
        matches: ticket.matches ?? [],
        legs: ticket.legs ?? [],
      })),
      totalTickets: data.totalTickets ?? 0,
      period: data.period ?? period,
    };
  },
};
