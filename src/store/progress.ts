'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ExerciseScore {
  day: number;
  score: number;
  total: number;
  completedAt: string;
}

/** Stored answer for a single question within an exercise. */
interface StoredAnswer {
  values: string[];
  checked: boolean;
  correct?: boolean;
}

/** All user answers for a specific exercise on a specific day. */
interface ExerciseAnswers {
  /** Key format: "day-exerciseIndex" */
  key: string;
  answers: Record<number, StoredAnswer>;
  submitted: boolean;
  score: number;
  total: number;
  submittedAt?: string;
}

interface ProgressState {
  completedDays: number[];
  currentDay: number;
  exerciseScores: ExerciseScore[];
  exerciseAnswers: ExerciseAnswers[];
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
  checkAndAutoCompleteDay: (day: number, totalExercises: number) => boolean;

  // Exercise answer persistence
  saveExerciseAnswers: (
    day: number,
    exerciseIndex: number,
    answers: Record<number, StoredAnswer>,
    submitted: boolean,
    score: number,
    total: number
  ) => void;
  getExerciseAnswers: (day: number, exerciseIndex: number) => ExerciseAnswers | undefined;
  clearExerciseAnswers: (day: number, exerciseIndex: number) => void;
  getDayExercisesSummary: (day: number) => { totalScore: number; totalQuestions: number; exerciseCount: number };
}

function makeKey(day: number, exerciseIndex: number): string {
  return `${day}-${exerciseIndex}`;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedDays: [],
      currentDay: 1,
      exerciseScores: [],
      exerciseAnswers: [],
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
          exerciseAnswers: [],
        }),

      checkAndAutoCompleteDay: (day: number, totalExercises: number) => {
        const { exerciseAnswers, completedDays } = get();
        const submittedCount = exerciseAnswers.filter(
          (e) => e.key.startsWith(`${day}-`) && e.submitted
        ).length;
        if (submittedCount >= totalExercises && !completedDays.includes(day)) {
          set((state) => ({
            completedDays: [...state.completedDays, day].sort((a, b) => a - b),
            currentDay: Math.max(state.currentDay, day + 1),
          }));
          return true;
        }
        return false;
      },

      // Exercise answer persistence
      saveExerciseAnswers: (
        day: number,
        exerciseIndex: number,
        answers: Record<number, StoredAnswer>,
        submitted: boolean,
        score: number,
        total: number
      ) =>
        set((state) => {
          const key = makeKey(day, exerciseIndex);
          const entry: ExerciseAnswers = {
            key,
            answers,
            submitted,
            score,
            total,
            submittedAt: submitted ? new Date().toISOString() : undefined,
          };
          return {
            exerciseAnswers: [
              ...state.exerciseAnswers.filter((e) => e.key !== key),
              entry,
            ],
          };
        }),

      getExerciseAnswers: (day: number, exerciseIndex: number) => {
        const key = makeKey(day, exerciseIndex);
        return get().exerciseAnswers.find((e) => e.key === key);
      },

      clearExerciseAnswers: (day: number, exerciseIndex: number) =>
        set((state) => {
          const key = makeKey(day, exerciseIndex);
          return {
            exerciseAnswers: state.exerciseAnswers.filter((e) => e.key !== key),
          };
        }),

      getDayExercisesSummary: (day: number) => {
        const { exerciseAnswers } = get();
        const dayAnswers = exerciseAnswers.filter(
          (e) => e.key.startsWith(`${day}-`) && e.submitted
        );
        return {
          totalScore: dayAnswers.reduce((sum, e) => sum + e.score, 0),
          totalQuestions: dayAnswers.reduce((sum, e) => sum + e.total, 0),
          exerciseCount: dayAnswers.length,
        };
      },
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
