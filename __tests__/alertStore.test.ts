/**
 * @file alertStore.test.ts
 * Unit tests for the Zustand alert (modal) store.
 */

import { afterEach, describe, expect, it } from '@jest/globals';
import { act } from 'react';
import { useAlertStore } from '../store/alertStore';

afterEach(() => {
  act(() => useAlertStore.getState().hideAlert());
});

describe('showAlert', () => {
  it('sets visible=true and stores title + message', () => {
    act(() => useAlertStore.getState().showAlert('My Title', 'My Message'));

    const state = useAlertStore.getState();
    expect(state.visible).toBe(true);
    expect(state.title).toBe('My Title');
    expect(state.message).toBe('My Message');
  });

  it('defaults message to empty string when omitted', () => {
    act(() => useAlertStore.getState().showAlert('No Message'));

    expect(useAlertStore.getState().message).toBe('');
  });

  it('adds a default OK button when no buttons provided', () => {
    act(() => useAlertStore.getState().showAlert('Title'));

    const { buttons } = useAlertStore.getState();
    expect(buttons).toHaveLength(1);
    expect(buttons[0].text).toBe('OK');
    expect(buttons[0].style).toBe('default');
  });

  it('stores custom buttons correctly', () => {
    const buttons = [
      { text: 'Cancel', style: 'cancel' as const },
      { text: 'Delete', style: 'destructive' as const, onPress: () => {} },
    ];

    act(() => useAlertStore.getState().showAlert('Confirm', 'Are you sure?', buttons));

    const state = useAlertStore.getState();
    expect(state.buttons).toHaveLength(2);
    expect(state.buttons[0].text).toBe('Cancel');
    expect(state.buttons[1].style).toBe('destructive');
  });
});

describe('hideAlert', () => {
  it('sets visible back to false', () => {
    act(() => useAlertStore.getState().showAlert('Hi'));
    act(() => useAlertStore.getState().hideAlert());

    expect(useAlertStore.getState().visible).toBe(false);
  });
});
