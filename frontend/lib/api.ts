//GitCode.dev/frontend/lib/api.ts
import axios from 'axios';
import { ApiResponse, AuthResponse, User } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Tworzymy instancję axios dla publicznych żądań (bez tokena)
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Ważne dla ciasteczek
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nie próbuj refreshować tokena dla endpointu logout
    if (originalRequest.url?.includes('/logout')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Używamy osobnej instancji axios dla refresh, żeby uniknąć zapętlenia
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          { 
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (provider: string = 'keycloak') => {
    window.location.href = `${API_BASE_URL}/api/auth/login?provider=${provider}`;
  },

  refreshToken: async (): Promise<ApiResponse<AuthResponse>> => {
    // Używamy bezpośrednio axios dla refresh, nie api (żeby uniknąć interceptora)
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/refresh`,
      {},
      { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  logout: async (): Promise<ApiResponse> => {
    // Używamy api (z interceptorem) ale z tokenem, żeby backend mógł zidentyfikować użytkownika
    const response = await api.post('/api/auth/logout');
    return response.data;
  },
};

export default api;