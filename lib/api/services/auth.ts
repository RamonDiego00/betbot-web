import { apiClient } from '../client';

export interface DebugLoginResponse {
  token: string;
}

export const authService = {
  debugLogin: async (email: string): Promise<DebugLoginResponse> => {
    const response = await apiClient.post<DebugLoginResponse>('/api/v1/auth/debug-login', { email });
    return response.data;
  },
};
