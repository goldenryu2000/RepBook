import { create } from 'zustand';
import { ActiveExercise, ActiveSet } from '../types';

interface WorkoutState {
  isActive: boolean;
  activeTemplateId: string | null;
  date: Date;
  editingWorkoutId: string | null;
  exercises: ActiveExercise[];
  loggingMode: 'list' | 'focus';
  focusState: {
    exerciseIndex: number;
    setIndex: number;
    step: 'weight' | 'active' | 'reps' | 'rest' | 'complete';
  };
  setDate: (date: Date) => void;
  setLoggingMode: (mode: 'list' | 'focus') => void;
  startEmptyWorkout: () => void;
  addExercise: () => void;
  updateExerciseName: (id: string, name: string) => void;
  removeExercise: (id: string) => void;
  addSet: (exerciseId: string) => void;
  updateSet: (exerciseId: string, setId: string, field: keyof ActiveSet, value: string) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  resetWorkout: () => void;
  loadWorkoutForEdit: (workout: any) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const uid = () => Math.random().toString(36).substring(2, 9);

// Read the global default unit from userStore without causing circular deps
const getDefaultUnit = (): 'lbs' | 'kgs' => {
  try {
    // Dynamic import to avoid circular dependency
    const { useUserStore } = require('./userStore');
    return useUserStore.getState().defaultUnit ?? 'lbs';
  } catch {
    return 'lbs';
  }
};

export const useWorkoutStore = create<WorkoutState>(set => ({
  isActive: false,
  activeTemplateId: null,
  date: new Date(),
  editingWorkoutId: null,
  exercises: [],
  loggingMode: 'list',
  focusState: {
    exerciseIndex: 0,
    setIndex: 0,
    step: 'weight',
  },

  setDate: date => set({ date }),

  setLoggingMode: loggingMode => set({ loggingMode }),

  startEmptyWorkout: () =>
    set(state => {
      const unit = getDefaultUnit();
      const exerciseId = uid();
      return {
        isActive: true,
        activeTemplateId: null,
        loggingMode: 'focus',
        focusState: { exerciseIndex: 0, setIndex: 0, step: 'weight' },
        exercises: [
          {
            id: exerciseId,
            name: '',
            sets: [{ id: uid(), reps: '', weight: '', unit }],
          },
        ],
      };
    }),

  addExercise: () =>
    set(state => {
      const unit = getDefaultUnit();
      return {
        exercises: [
          ...state.exercises,
          { id: uid(), name: '', sets: [{ id: uid(), reps: '', weight: '', unit }] },
        ],
      };
    }),

  updateExerciseName: (id, name) =>
    set(state => ({
      exercises: state.exercises.map(ex => (ex.id === id ? { ...ex, name } : ex)),
    })),

  removeExercise: id =>
    set(state => ({
      exercises: state.exercises.filter(ex => ex.id !== id),
    })),

  addSet: exerciseId =>
    set(state => ({
      exercises: state.exercises.map(ex => {
        if (ex.id !== exerciseId) return ex;
        const last = ex.sets[ex.sets.length - 1];
        // Per-set: inherit from previous set's unit (allows individual override)
        // If no previous set, fall back to global default
        const unit = last?.unit ?? getDefaultUnit();
        return {
          ...ex,
          sets: [
            ...ex.sets,
            { id: uid(), reps: last?.reps ?? '', weight: last?.weight ?? '', unit },
          ],
        };
      }),
    })),

  updateSet: (exerciseId, setId, field, value) =>
    set(state => ({
      exercises: state.exercises.map(ex => {
        if (ex.id !== exerciseId) return ex;
        return { ...ex, sets: ex.sets.map(s => (s.id === setId ? { ...s, [field]: value } : s)) };
      }),
    })),

  removeSet: (exerciseId, setId) =>
    set(state => ({
      exercises: state.exercises.map(ex => {
        if (ex.id !== exerciseId) return ex;
        return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
      }),
    })),

  resetWorkout: () =>
    set({
      isActive: false,
      activeTemplateId: null,
      exercises: [],
      date: new Date(),
      editingWorkoutId: null,
      loggingMode: 'list',
      focusState: { exerciseIndex: 0, setIndex: 0, step: 'weight' },
    }),

  loadWorkoutForEdit: workout =>
    set({
      isActive: true,
      activeTemplateId: null,
      date: new Date(workout.date),
      editingWorkoutId: workout.id,
      exercises: workout.exercises.map((ex: any) => ({
        id: ex.id,
        name: ex.name,
        sets: ex.sets.map((s: any) => ({
          id: s.id,
          reps: s.reps.toString(),
          weight: s.weight.toString(),
          unit: s.unit || 'lbs',
        })),
      })),
    }),

  nextStep: () =>
    set(state => {
      const { exerciseIndex, setIndex, step } = state.focusState;
      const currentExercise = state.exercises[exerciseIndex];
      if (!currentExercise) return state;

      if (step === 'weight') return { focusState: { ...state.focusState, step: 'active' } };
      if (step === 'active') return { focusState: { ...state.focusState, step: 'reps' } };
      if (step === 'reps') return { focusState: { ...state.focusState, step: 'rest' } };

      // step === 'rest' -> move to next set or next exercise
      if (setIndex < currentExercise.sets.length - 1) {
        return { focusState: { ...state.focusState, setIndex: setIndex + 1, step: 'weight' } };
      }

      if (exerciseIndex < state.exercises.length - 1) {
        return { focusState: { exerciseIndex: exerciseIndex + 1, setIndex: 0, step: 'weight' } };
      }

      // End of workout
      return { focusState: { ...state.focusState, step: 'complete' } };
    }),

  prevStep: () =>
    set(state => {
      const { exerciseIndex, setIndex, step } = state.focusState;
      if (step === 'rest') return { focusState: { ...state.focusState, step: 'reps' } };
      if (step === 'reps') return { focusState: { ...state.focusState, step: 'active' } };
      if (step === 'active') return { focusState: { ...state.focusState, step: 'weight' } };

      // step === 'weight' -> move to prev set or prev exercise
      if (setIndex > 0) {
        return { focusState: { ...state.focusState, setIndex: setIndex - 1, step: 'rest' } };
      }

      if (exerciseIndex > 0) {
        const prevExercise = state.exercises[exerciseIndex - 1];
        return {
          focusState: {
            exerciseIndex: exerciseIndex - 1,
            setIndex: prevExercise.sets.length - 1,
            step: 'rest',
          },
        };
      }

      return state;
    }),
}));
