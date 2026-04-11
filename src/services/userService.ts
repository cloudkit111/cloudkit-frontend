import api from '@/config/api-client';
import { toast } from 'sonner';

export const fetchUserDetails = async () => {
  try {
    const res = await api.get(`${import.meta.env.VITE_BACKEND_URI}/auth/me`);
    return res;
  } catch (error) {
    toast.error('Error Fetching Repos.');
    console.log(error);
  }
};

export const handleLogout = async () => {
  try {
    await api.get(`${import.meta.env.VITE_BACKEND_URI}/auth/logout`);
    window.location.href = '/';
  } catch (err) {
    console.log(err);
  }
};
