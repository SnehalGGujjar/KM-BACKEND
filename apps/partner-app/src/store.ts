import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PartnerApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED' | 'INCOMPLETE';

interface PartnerProfile {
  id: number;
  phone: string;
  name: string | null;
  city: number | null;
  approval_status: PartnerApprovalStatus;
  rejection_reason: string | null;
  is_online: boolean;
  rating: number;
}

interface AppState {
  isHydrated: boolean;
  isAuthenticated: boolean;
  profile: PartnerProfile | null;
  setAuth: (token: string, refresh?: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  setProfile: (profile: PartnerProfile) => void;
  hydrate: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  isHydrated: false,
  isAuthenticated: false,
  profile: null,

  setAuth: async (token: string, refresh?: string) => {
    await AsyncStorage.setItem('partner_access_token', token);
    if (refresh) {
      await AsyncStorage.setItem('partner_refresh_token', refresh);
    }
    set({ isAuthenticated: true });
  },

  clearAuth: async () => {
    await AsyncStorage.removeItem('partner_access_token');
    await AsyncStorage.removeItem('partner_refresh_token');
    set({ isAuthenticated: false, profile: null });
  },

  setProfile: (profile) => set({ profile }),

  hydrate: async () => {
    try {
      const token = await AsyncStorage.getItem('partner_access_token');
      set({ isAuthenticated: !!token, isHydrated: true });
    } catch {
      set({ isHydrated: true });
    }
  },
}));
