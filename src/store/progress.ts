'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ExerciseScore {
  day: number;
  score: number;
  total: number;
  completedAt: string;
}

interface ProgressState {
  completedDays: number[];
  currentDay: number;
  exerciseScores: ExerciseScore[];
  darkMode: boolean;

  completeDay: (day: number) => void;
  uncompleteDay: (day: number) => void;
  setCurrentDay: (day: number) => void;
  saveExerciseScore: (day: number, score: number, total: number) => void;
  getExerciseScore: (day: number) => ExerciseScore | undefined;
  getProgressPercent: () => number;
  getCompletedCount: () => number;
  getNextIncompleteDay: () => number;
  toggleDarkMode: () => void;
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedDays: [],
      currentDay: 1,
      exerciseScores: [],
      darkMode: true,

      completeDay: (day: number) =>
        set((state) => ({
          completedDays: state.completedDays.includes(day)
            ? state.completedDays
            : [...state.completedDays, day].sort((a, b) => a - b),
          currentDay: Math.max(state.currentDay, day + 1),
        })),

      uncompleteDay: (day: number) =>
        set((state) => ({
          completedDays: state.completedDays.filter((d) => d !== day),
        })),

      setCurrentDay: (day: number) => set({ currentDay: day }),

      saveExerciseScore: (day: number, score: number, total: number) =>
        set((state) => ({
          exerciseScores: [
            ...state.exerciseScores.filter((s) => s.day !== day),
            { day, score, total, completedAt: new Date().toISOString() },
          ],
        })),

      getExerciseScore: (day: number) => {
        return get().exerciseScores.find((s) => s.day === day);
      },

      getProgressPercent: () => {
        const { completedDays } = get();
        return Math.round((completedDays.length / 90) * 100);
      },

      getCompletedCount: () => {
        return get().completedDays.length;
      },

      getNextIncompleteDay: () => {
        const { completedDays } = get();
        for (let i = 1; i <= 90; i++) {
          if (!completedDays.includes(i)) return i;
        }
        return 90;
      },

      toggleDarkMode: () =>
        set((state) => ({ darkMode: !state.darkMode })),

      resetProgress: () =>
        set({
          completedDays: [],
          currentDay: 1,
          exerciseScores: [],
        }),
    }),
    {
      name: 'english-learning-progress',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        // SSR fallback
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
    }
  )
);
