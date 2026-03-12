import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CustomerProfile {
  id: number;
  phone: string;
  name: string | null;
  address: string | null;
  city: number | null;
  lat: number | null;
  lng: number | null;
  email: string | null;
  is_active: boolean;
}

interface AppState {
  isHydrated: boolean;
  isAuthenticated: boolean;
  profile: CustomerProfile | null;
  setAuth: (token: string, refresh?: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  setProfile: (profile: CustomerProfile) => void;
  hydrate: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  isHydrated: false,
  isAuthenticated: false,
  profile: null,

  setAuth: async (token: string, refresh?: string) => {
    await AsyncStorage.setItem('customer_access_token', token);
    if (refresh) {
      await AsyncStorage.setItem('customer_refresh_token', refresh);
    }
    set({ isAuthenticated: true });
  },

  clearAuth: async () => {
    await AsyncStorage.removeItem('customer_access_token');
    await AsyncStorage.removeItem('customer_refresh_token');
    set({ isAuthenticated: false, profile: null });
  },

  setProfile: (profile) => set({ profile }),

  hydrate: async () => {
    try {
      const token = await AsyncStorage.getItem('customer_access_token');
      set({ isAuthenticated: !!token, isHydrated: true });
    } catch {
      set({ isHydrated: true });
    }
  },
}));
