/**
 * @file userStore.test.ts
 * Unit tests for the Zustand user store.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { act } from 'react';
import { useUserStore } from '../store/userStore';

import { getUserProfile, saveSetting, getSetting } from '../db/database';

// Mock database functions
jest.mock('../db/database', () => ({
  getUserProfile: jest.fn(),
  saveUserProfile: jest.fn(),
  saveSetting: jest.fn(),
  getSetting: jest.fn(),
}));

describe('userStore', () => {
  it('initializes with default values', () => {
    const state = useUserStore.getState();
    expect(state.defaultUnit).toBe('lbs');
    expect(state.defaultRestTime).toBe(90);
    expect(state.isLoading).toBe(true);
  });

  it('loads user settings from database', async () => {
    (getUserProfile as jest.Mock).mockResolvedValue({
      profile: null,
      isOnboarded: true,
      defaultUnit: 'kgs',
    });
    (getSetting as jest.Mock).mockResolvedValue('120');

    await act(async () => {
      await useUserStore.getState().loadUser();
    });

    const state = useUserStore.getState();
    expect(state.defaultUnit).toBe('kgs');
    expect(state.defaultRestTime).toBe(120);
    expect(state.isLoading).toBe(false);
  });

  it('updates default unit and persists to database', async () => {
    const store = useUserStore.getState();

    await act(async () => {
      await store.setDefaultUnit('kgs');
    });

    expect(useUserStore.getState().defaultUnit).toBe('kgs');
    expect(saveSetting).toHaveBeenCalledWith('default_unit', 'kgs');
  });

  it('updates rest time and persists to database', async () => {
    const store = useUserStore.getState();

    await act(async () => {
      await store.setRestTime(60);
    });

    expect(useUserStore.getState().defaultRestTime).toBe(60);
    expect(saveSetting).toHaveBeenCalledWith('default_rest_time', '60');
  });
});
