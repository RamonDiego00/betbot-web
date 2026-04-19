import { apiClient } from '../client';
import { Ticket } from '@/types/api';

export const ticketService = {
  getHistory: async (filters?: Record<string, string | number | boolean>): Promise<Ticket[]> => {
    const response = await apiClient.get<Ticket[]>('/api/v1/tickets/history', { params: filters });
    return response.data;
  },

  createTicket: async (ticket: Partial<Ticket>): Promise<Ticket> => {
    const response = await apiClient.post<Ticket>('/api/v1/tickets', ticket);
    return response.data;
  },
};
