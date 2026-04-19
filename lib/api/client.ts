import axios from 'axios';
import { authUtils } from '../auth';
import { toast } from 'sonner';

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  
  // No desenvolvimento, deixamos vazio para usar o proxy do Next.js (rewrites)
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    return '';
  }
  
  return 'http://localhost:8080';
};

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = authUtils.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle 401 errors (token expiration)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      toast.error('Sessão expirada', {
        description: 'Sua sessão expirou. Por favor, faça login novamente.'
      });
      authUtils.logout();
    }
    return Promise.reject(error);
  }
);
