import { create } from 'zustand';
import { ActiveExercise, ActiveSet } from '../types';

interface WorkoutState {
  isActive: boolean;
  activeTemplateId: string | null;
  date: Date;
  editingWorkoutId: string | null;
  exercises: ActiveExercise[];
  setDate: (date: Date) => void;
  startEmptyWorkout: () => void;
  addExercise: () => void;
  updateExerciseName: (id: string, name: string) => void;
  removeExercise: (id: string) => void;
  addSet: (exerciseId: string) => void;
  updateSet: (exerciseId: string, setId: string, field: keyof ActiveSet, value: string) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  resetWorkout: () => void;
  loadWorkoutForEdit: (workout: any) => void;
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

  setDate: date => set({ date }),

  startEmptyWorkout: () => set({ isActive: true, activeTemplateId: null, exercises: [] }),

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
}));
