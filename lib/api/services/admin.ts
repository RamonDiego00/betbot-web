import { apiClient } from '../client';
import { AdminBillingStatement } from '@/types/api';

/**
 * Endpoints admin-only. Isolado dos demais services para deixar claro que
 * qualquer chamada aqui é restrita ao usuário admin (ramondiego856@gmail.com).
 * Um 403 de qualquer método aqui indica que o usuário logado não é admin.
 */
export const adminService = {
  /**
   * Lista todos os comprovantes de lucro mensal de todos os usuários.
   * GET /api/v1/billing/statements/all → AdminBillingStatement[]
   */
  getTodosComprovantes: async (): Promise<AdminBillingStatement[]> => {
    const response = await apiClient.get<AdminBillingStatement[]>('/api/v1/billing/statements/all');
    return response.data ?? [];
  },

  /**
   * Altera o status de cobrança de um usuário (ativo/bloqueado).
   * PATCH /api/v1/billing/users/{userId}/status
   */
  updateUserStatus: async (userId: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<void> => {
    await apiClient.patch(`/api/v1/billing/users/${userId}/status`, { status });
  },
};
