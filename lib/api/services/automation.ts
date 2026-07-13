import { apiClient } from '../client';
import {
  MachineStatusDTO,
  MachineStatusResponse,
  AutomationServerStatus,
  AutomationDeviceStatus,
  AutomationLogEvent,
  BetWorkerJsonResponse,
} from '@/types/api';

export const automationService = {
  /**
   * Lista todas as máquinas registradas.
   * GET /api/v1/automation/machines → { machines: MachineStatusDTO[] }
   */
  getMachines: async (): Promise<MachineStatusDTO[]> => {
    const response = await apiClient.get<MachineStatusResponse>('/api/v1/automation/machines');
    return response.data.machines ?? [];
  },

  /**
   * Status detalhado do servidor worker (heartbeat, versão).
   * GET /api/v1/automation/mini-server/status
   */
  getServerStatus: async (): Promise<AutomationServerStatus> => {
    const response = await apiClient.get<AutomationServerStatus>('/api/v1/automation/mini-server/status');
    return response.data;
  },

  /**
   * Status do device Android (modelo, bateria, uptime).
   * GET /api/v1/automation/device/status
   */
  getDeviceStatus: async (): Promise<AutomationDeviceStatus> => {
    const response = await apiClient.get<AutomationDeviceStatus>('/api/v1/automation/device/status');
    return response.data;
  },

  /**
   * Lote de apostas do dia (fila de execução).
   * GET /api/v1/bets/daily-generation
   */
  getDailyBets: async (date?: string): Promise<BetWorkerJsonResponse> => {
    const response = await apiClient.get<BetWorkerJsonResponse>('/api/v1/bets/daily-generation', {
      params: { date },
    });
    return response.data;
  },

  /**
   * Logs recentes do worker (snapshot, não streaming).
   * GET /api/v1/automation/logs/recent
   */
  getRecentLogs: async (limit = 50): Promise<AutomationLogEvent[]> => {
    const response = await apiClient.get<AutomationLogEvent[]>('/api/v1/automation/logs/recent', {
      params: { limit },
    });
    return response.data ?? [];
  },

  /**
   * Abre uma conexão SSE para logs em tempo real.
   * GET /api/v1/automation/logs/stream
   *
   * Retorna o EventSource para que o caller possa fechar a conexão (cleanup).
   * Usa a URL direta da API (sem proxy) para evitar timeouts do Vercel Edge.
   */
  /**
   * Atualiza o status de um ticket (usado pelo modo manual da fila de comandos).
   * PATCH /api/v1/bets/tickets/{ticketId}/status
   */
  updateTicketStatus: async (ticketId: string, status: 'PENDING' | 'SKIPPED'): Promise<void> => {
    await apiClient.patch(`/api/v1/bets/tickets/${ticketId}/status`, { status });
  },

  streamLogs: (onLog: (log: AutomationLogEvent) => void, onError?: () => void): EventSource => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
    const source = new EventSource(`${baseUrl}/api/v1/automation/logs/stream`);

    source.addEventListener('log', (event: MessageEvent) => {
      try {
        const log: AutomationLogEvent = JSON.parse(event.data);
        onLog(log);
      } catch {
        // ignora evento malformado
      }
    });

    source.onerror = () => {
      onError?.();
      source.close();
    };

    return source;
  },
};
