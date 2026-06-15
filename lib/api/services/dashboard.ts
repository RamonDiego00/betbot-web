import { apiClient } from '../client';
import { 
  Game, 
  DashboardSummary, 
  Bankroll, 
  FinancialSetupPayload, 
  DashboardLeagueGames,
  FinancialSummary
} from '@/types/api';

export const dashboardService = {
  /**
   * Resumo financeiro do dashboard (KPIs principais + stats do dia)
   */
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await apiClient.get<DashboardSummary>('/api/v1/dashboard/summary');
    return response.data;
  },

  /**
   * Listar bancas do usuário
   */
  getBankrolls: async (): Promise<Bankroll[]> => {
    const response = await apiClient.get<Bankroll[]>('/api/v1/dashboard/bankrolls');
    return response.data;
  },

  /**
   * Listar principais jogos do dia (Raw format)
   */
  getTodayGames: async (): Promise<Game[]> => {
    // Note: API returns DashboardGamesResponse which has { date, games }
    // but the controller signature shows it returns DashboardGamesResponse
    // Let's adjust to handle the structure correctly if needed.
    const response = await apiClient.get<{ date: string; games: Game[] }>('/api/v1/dashboard/games/today');
    return response.data.games;
  },

  /**
   * Jogos do Dashboard Agrupados por Liga (Accordion Pattern)
   * Ideal para exibição no frontend.
   */
  getGamesByLeague: async (date?: string): Promise<DashboardLeagueGames[]> => {
    const params = date ? { date } : {};
    const response = await apiClient.get<DashboardLeagueGames[]>('/api/v1/dashboard/games', { params });
    return response.data;
  },

  /**
   * KPIs financeiros detalhados (Lucro, Perda, ROI por banca)
   */
  getFinancialSummary: async (): Promise<FinancialSummary> => {
    const response = await apiClient.get<FinancialSummary>('/api/v1/dashboard/financial-summary');
    return response.data;
  },

  /**
   * Configurar parâmetros financeiros (Banca inicial, Stake, Target ROI)
   */
  setupFinancial: async (payload: FinancialSetupPayload): Promise<void> => {
    await apiClient.post('/api/v1/dashboard/financial/setup', payload);
  },
};
