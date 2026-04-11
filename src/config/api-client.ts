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
