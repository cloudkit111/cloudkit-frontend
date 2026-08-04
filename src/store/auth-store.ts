import { create } from 'zustand';

interface AuthStore {
  accessToken: string;
  setAccessToken: (value: string) => void;
}

const useAuthStore = create<AuthStore>((set) => ({
  accessToken: '',
  setAccessToken: (value: string) => set({ accessToken: value }),
}));

export default useAuthStore;
