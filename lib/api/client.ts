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
      console.log('Sending token to:', config.url, 'Token prefix:', token.substring(0, 15));
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle 401 errors (token expiration) and log 500 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      toast.error('Sessão expirada', {
        description: 'Sua sessão expirou. Por favor, faça login novamente.'
      });
      authUtils.logout();
    }
    
    if (error.response?.status === 500) {
      console.error('------- BACKEND ERROR (500) -------');
      console.error('URL:', error.config?.url);
      console.error('Method:', error.config?.method?.toUpperCase());
      console.error('Payload:', error.config?.data);
      console.error('Params:', error.config?.params);
      console.error('Response Data:', error.response.data);
      console.error('-----------------------------------');
      
      toast.error('Erro no servidor', {
        description: error.response.data?.message || 'Erro interno no processamento dos dados.'
      });
    }
    
    return Promise.reject(error);
  }
);
