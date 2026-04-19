export const AUTH_TOKEN_KEY = 'betbot_auth_token';

export const authUtils = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  setToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  },

  removeToken: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AUTH_TOKEN_KEY);
  },

  isAuthenticated: (): boolean => {
    return !!authUtils.getToken();
  },

  logout: (): void => {
    authUtils.removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
};
