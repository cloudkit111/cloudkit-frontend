import useAuthStore from '@/store/auth-store';
import axios, { type AxiosInstance } from 'axios';
import { toast } from 'sonner';
axios.defaults.withCredentials = true;

const api: AxiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URI}`,
  timeout: 30000,
  withCredentials: true,
});

const handleLogout = async () => {
  try {
    await axios.get(`${import.meta.env.VITE_BACKEND_URI}/auth/logout`, {
      withCredentials: true,
    });
    window.location.href = '/';
  } catch (err) {
    console.log(err);
  }
};

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

/**
 * Request Interceptor : Attach Access token
 */

api.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const skipRefreshEndpoints = [
      '/api/user/login',
      '/api/user/signup',
      '/api/user/refresh-token',
      '/api/counsellor/login',
    ];

    const shouldSkipRefresh = skipRefreshEndpoints.some((url) =>
      originalRequest.url?.includes(url),
    );

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/refresh-token') &&
      !shouldSkipRefresh
    ) {
      originalRequest._retry = true;

      try {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = api
            .get('/api/user/refresh-token', { withCredentials: true })
            .then((res) => {
              const token = res.data.data.accessToken;
              useAuthStore.getState().setAccessToken(token);
              return token;
            })
            .finally(() => {
              isRefreshing = false;
            });
        }

        const newToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (error) {
        // refresh token expires

        useAuthStore.getState().setAccessToken('');
        // useAuthStore.getState().toggleAuthState(false);
        // window.location.href = '/auth/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Auto logout when token expires after 1.5 seconds
    if (error.response?.status === 401) {
      toast('Session Expired!');
      setTimeout(() => handleLogout(), 1500);
    }
    return Promise.reject(error);
  },
);

export default api;
