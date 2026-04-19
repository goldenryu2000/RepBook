import { create } from 'zustand';
import { UserProfile } from '../types';
import { getUserProfile, saveUserProfile, saveSetting, getSetting } from '../db/database';

interface UserState {
  profile: UserProfile | null;
  isOnboarded: boolean;
  isLoading: boolean;
  defaultUnit: 'lbs' | 'kgs';
  defaultRestTime: number; // in seconds
  loadUser: () => Promise<void>;
  saveProfile: (profile: UserProfile) => Promise<void>;
  setDefaultUnit: (unit: 'lbs' | 'kgs') => Promise<void>;
  setRestTime: (seconds: number) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  isOnboarded: false,
  isLoading: true,
  defaultUnit: 'lbs',
  defaultRestTime: 90,

  loadUser: async () => {
    try {
      const { profile, isOnboarded, defaultUnit } = await getUserProfile();
      const restTime = await getSetting('default_rest_time');

      set({
        profile,
        isOnboarded,
        defaultUnit: defaultUnit ?? 'lbs',
        defaultRestTime: restTime ? parseInt(restTime) : 90,
        isLoading: false,
      });
    } catch {
      set({ defaultRestTime: 90, isLoading: false });
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

  setRestTime: async (seconds: number) => {
    set({ defaultRestTime: seconds });
    await saveSetting('default_rest_time', seconds.toString());
  },
}));
