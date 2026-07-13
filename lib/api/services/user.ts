import { apiClient } from '../client';

export interface UserProfile {
  email: string;
  name: string | null;
  status: string | null;
  authorities: string[];
}

export const userService = {
  /**
   * Perfil do usuário autenticado (dados reais do tb_user_profile)
   */
  getMe: async (): Promise<UserProfile> => {
    const { data } = await apiClient.get<UserProfile>('/api/v1/user/me');
    return data;
  },
};
