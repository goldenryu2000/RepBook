import { create } from 'zustand';
import { UserProfile } from '../types';
import { getUserProfile, saveUserProfile, saveSetting } from '../db/database';

interface UserState {
  profile: UserProfile | null;
  isOnboarded: boolean;
  isLoading: boolean;
  defaultUnit: 'lbs' | 'kgs';
  loadUser: () => Promise<void>;
  saveProfile: (profile: UserProfile) => Promise<void>;
  setDefaultUnit: (unit: 'lbs' | 'kgs') => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  isOnboarded: false,
  isLoading: true,
  defaultUnit: 'lbs',

  loadUser: async () => {
    try {
      const { profile, isOnboarded, defaultUnit } = await getUserProfile();
      set({
        profile,
        isOnboarded,
        defaultUnit: defaultUnit ?? 'lbs',
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  saveProfile: async (profile: UserProfile) => {
    // Merge defaultUnit from current state into profile if not provided
    const merged: UserProfile = {
      defaultUnit: get().defaultUnit,
      ...profile,
    };
    await saveUserProfile(merged);
    set({ profile: merged, isOnboarded: true });
  },

  setDefaultUnit: async (unit: 'lbs' | 'kgs') => {
    set({ defaultUnit: unit });
    // Persist to DB
    await saveSetting('default_unit', unit);
    // Also update profile object if it exists
    const { profile } = get();
    if (profile) {
      const updated = { ...profile, defaultUnit: unit };
      await saveUserProfile(updated);
      set({ profile: updated });
    }
  },
}));
