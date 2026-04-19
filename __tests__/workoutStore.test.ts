/**
 * @file workoutStore.test.ts
 * Unit tests for the Zustand workout store.
 * All store mutations are tested in isolation – no native modules required.
 */

import { afterEach, describe, expect, it } from '@jest/globals';
import { act } from 'react';

import { useWorkoutStore } from '../store/workoutStore';

// Mock the userStore dependency to avoid circular requires in jest
jest.mock('../store/userStore', () => ({
  useUserStore: { getState: () => ({ defaultUnit: 'lbs' }) },
}));

/** Reset the store back to its initial state after each test */
afterEach(() => {
  act(() => useWorkoutStore.getState().resetWorkout());
});

// ─── Active-session flag ──────────────────────────────────────────────────────

describe('startEmptyWorkout', () => {
  it('sets isActive to true and clears exercises', () => {
    const store = useWorkoutStore.getState();
    act(() => store.startEmptyWorkout());

    const state = useWorkoutStore.getState();
    expect(state.isActive).toBe(true);
    expect(state.exercises).toHaveLength(1); // Now defaults to 1 exercise
    expect(state.activeTemplateId).toBeNull();
  });
});

describe('resetWorkout', () => {
  it('resets all fields to their initial values', () => {
    act(() => useWorkoutStore.getState().startEmptyWorkout());
    act(() => useWorkoutStore.getState().addExercise());
    act(() => useWorkoutStore.getState().resetWorkout());

    const state = useWorkoutStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.exercises).toHaveLength(0);
    expect(state.editingWorkoutId).toBeNull();
    expect(state.activeTemplateId).toBeNull();
  });
});

// ─── Exercise management ──────────────────────────────────────────────────────

describe('addExercise', () => {
  it('appends a blank exercise with one empty set', () => {
    act(() => useWorkoutStore.getState().addExercise());

    const { exercises } = useWorkoutStore.getState();
    expect(exercises).toHaveLength(1);
    expect(exercises[0].name).toBe('');
    expect(exercises[0].sets).toHaveLength(1);
    expect(exercises[0].sets[0].unit).toBe('lbs');
  });

  it('generates unique IDs for each exercise', () => {
    act(() => useWorkoutStore.getState().addExercise());
    act(() => useWorkoutStore.getState().addExercise());

    const { exercises } = useWorkoutStore.getState();
    expect(exercises[0].id).not.toBe(exercises[1].id);
  });
});

describe('updateExerciseName', () => {
  it('updates the name of the matching exercise only', () => {
    act(() => useWorkoutStore.getState().addExercise());
    act(() => useWorkoutStore.getState().addExercise());

    const id = useWorkoutStore.getState().exercises[0].id;
    act(() => useWorkoutStore.getState().updateExerciseName(id, 'Bench Press'));

    const { exercises } = useWorkoutStore.getState();
    expect(exercises[0].name).toBe('Bench Press');
    expect(exercises[1].name).toBe(''); // unchanged
  });
});

describe('removeExercise', () => {
  it('removes the exercise with the given id', () => {
    act(() => useWorkoutStore.getState().addExercise());
    act(() => useWorkoutStore.getState().addExercise());

    const id = useWorkoutStore.getState().exercises[0].id;
    act(() => useWorkoutStore.getState().removeExercise(id));

    const { exercises } = useWorkoutStore.getState();
    expect(exercises).toHaveLength(1);
    expect(exercises[0].id).not.toBe(id);
  });
});

// ─── Set management ───────────────────────────────────────────────────────────

describe('addSet', () => {
  it('appends a set that inherits reps/weight from the previous set', () => {
    act(() => useWorkoutStore.getState().addExercise());
    const exId = useWorkoutStore.getState().exercises[0].id;

    // Fill in the existing set's values
    const setId = useWorkoutStore.getState().exercises[0].sets[0].id;
    act(() => useWorkoutStore.getState().updateSet(exId, setId, 'reps', '10'));
    act(() => useWorkoutStore.getState().updateSet(exId, setId, 'weight', '60'));

    act(() => useWorkoutStore.getState().addSet(exId));

    const sets = useWorkoutStore.getState().exercises[0].sets;
    expect(sets).toHaveLength(2);
    expect(sets[1].reps).toBe('10');
    expect(sets[1].weight).toBe('60');
  });
});

describe('updateSet', () => {
  it('updates only the specified field on the specified set', () => {
    act(() => useWorkoutStore.getState().addExercise());
    const { exercises } = useWorkoutStore.getState();
    const exId = exercises[0].id;
    const setId = exercises[0].sets[0].id;

    act(() => useWorkoutStore.getState().updateSet(exId, setId, 'weight', '80'));

    const updated = useWorkoutStore.getState().exercises[0].sets[0];
    expect(updated.weight).toBe('80');
    expect(updated.reps).toBe(''); // untouched
  });
});

describe('removeSet', () => {
  it('removes only the specified set from the exercise', () => {
    act(() => useWorkoutStore.getState().addExercise());
    const exId = useWorkoutStore.getState().exercises[0].id;
    act(() => useWorkoutStore.getState().addSet(exId));

    const setId = useWorkoutStore.getState().exercises[0].sets[0].id;
    act(() => useWorkoutStore.getState().removeSet(exId, setId));

    const sets = useWorkoutStore.getState().exercises[0].sets;
    expect(sets).toHaveLength(1);
    expect(sets[0].id).not.toBe(setId);
  });
});

// ─── loadWorkoutForEdit ───────────────────────────────────────────────────────

describe('loadWorkoutForEdit', () => {
  it('populates state from a workout object and marks session active', () => {
    const mockWorkout = {
      id: 'w1',
      date: '2026-01-15T10:00:00.000Z',
      exercises: [
        {
          id: 'e1',
          name: 'Squat',
          sets: [{ id: 's1', reps: 5, weight: 100, unit: 'kgs' }],
        },
      ],
    };

    act(() => useWorkoutStore.getState().loadWorkoutForEdit(mockWorkout));

    const state = useWorkoutStore.getState();
    expect(state.isActive).toBe(true);
    expect(state.editingWorkoutId).toBe('w1');
    expect(state.exercises).toHaveLength(1);
    expect(state.exercises[0].name).toBe('Squat');
    expect(state.exercises[0].sets[0].reps).toBe('5');
    expect(state.exercises[0].sets[0].weight).toBe('100');
    expect(state.exercises[0].sets[0].unit).toBe('kgs');
  });
});

// ─── Focus Mode Navigation ────────────────────────────────────────────────────

describe('Focus Mode State Machine', () => {
  it('initializes with default focus state', () => {
    const { focusState, loggingMode } = useWorkoutStore.getState();
    expect(loggingMode).toBe('list');
    expect(focusState).toEqual({
      exerciseIndex: 0,
      setIndex: 0,
      step: 'weight',
    });
  });

  it('cycles through steps for a single set', () => {
    act(() => {
      useWorkoutStore.getState().startEmptyWorkout();
    });

    expect(useWorkoutStore.getState().exercises).toHaveLength(1);
    expect(useWorkoutStore.getState().focusState.step).toBe('weight');

    // weight -> active
    act(() => useWorkoutStore.getState().nextStep());
    expect(useWorkoutStore.getState().focusState.step).toBe('active');

    // active -> reps
    act(() => useWorkoutStore.getState().nextStep());
    expect(useWorkoutStore.getState().focusState.step).toBe('reps');

    // reps -> rest
    act(() => useWorkoutStore.getState().nextStep());
    expect(useWorkoutStore.getState().focusState.step).toBe('rest');
  });

  it('moves to next set after rest', () => {
    act(() => {
      useWorkoutStore.getState().startEmptyWorkout();
    });

    // Add another set manually
    const exId = useWorkoutStore.getState().exercises[0].id;
    act(() => {
      useWorkoutStore.getState().addSet(exId);
    });

    expect(useWorkoutStore.getState().exercises[0].sets).toHaveLength(2);

    // Move to rest of first set
    act(() => {
      useWorkoutStore.getState().nextStep(); // weight -> active
      useWorkoutStore.getState().nextStep(); // active -> reps
      useWorkoutStore.getState().nextStep(); // reps -> rest
    });

    expect(useWorkoutStore.getState().focusState.setIndex).toBe(0);
    expect(useWorkoutStore.getState().focusState.step).toBe('rest');

    // rest -> next set weight
    act(() => useWorkoutStore.getState().nextStep());
    expect(useWorkoutStore.getState().focusState.setIndex).toBe(1);
    expect(useWorkoutStore.getState().focusState.step).toBe('weight');
  });

  it('transitions to complete at the end of the workout', () => {
    act(() => {
      useWorkoutStore.getState().startEmptyWorkout(); // 1 ex, 1 set
    });

    act(() => {
      useWorkoutStore.getState().nextStep(); // to active
      useWorkoutStore.getState().nextStep(); // to reps
      useWorkoutStore.getState().nextStep(); // to rest
      useWorkoutStore.getState().nextStep(); // to complete
    });

    expect(useWorkoutStore.getState().focusState.step).toBe('complete');
  });

  it('navigates backwards correctly with prevStep', () => {
    act(() => {
      useWorkoutStore.getState().startEmptyWorkout();
    });

    act(() => useWorkoutStore.getState().nextStep()); // weight -> active
    expect(useWorkoutStore.getState().focusState.step).toBe('active');

    act(() => useWorkoutStore.getState().prevStep()); // active -> weight
    expect(useWorkoutStore.getState().focusState.step).toBe('weight');
  });
});
