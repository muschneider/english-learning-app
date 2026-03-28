/**
 * Core types for the interactive exercise system.
 */

/** The kind of interaction required for an exercise question. */
export type ExerciseType =
  | 'fill-blank'         // Sentence with _______ blanks to fill
  | 'multiple-choice'    // Options presented as a), b), c) or (opt1 / opt2 / opt3)
  | 'transformation'     // Input → _______ (write the transformed word)
  | 'free-text';         // Open-ended: translation, sentence construction, rewriting

/** A single numbered question within an exercise. */
export interface ExerciseQuestion {
  /** 1-based question number */
  number: number;
  /** The full original line text (for display context) */
  rawText: string;
  /** Detected exercise type */
  type: ExerciseType;
  /** For fill-blank: the sentence template with blanks.
   *  For multiple-choice: the stem/question text. */
  prompt: string;
  /** For multiple-choice: the available options */
  options?: string[];
  /** Number of blanks to fill (fill-blank can have 1-2 blanks per line) */
  blankCount: number;
  /** Hint text in parentheses, e.g., "(not)" or "(cook)" */
  hint?: string;
}

/** A parsed exercise ready for interactive rendering. */
export interface ParsedExercise {
  /** The exercise title */
  title: string;
  /** Instruction text (extracted from title or first non-numbered lines) */
  instruction: string;
  /** The parsed questions */
  questions: ExerciseQuestion[];
  /** Whether this exercise has questions (vs answer-only data) */
  hasQuestions: boolean;
  /** The original markdown content (fallback rendering) */
  rawContent: string;
}

/** Answer data for a single question. */
export interface AnswerEntry {
  /** Acceptable answers (multiple alternatives separated by /) */
  acceptedAnswers: string[][];
  /** The raw answer text for display */
  displayAnswer: string;
}

/** Parsed answer key for an exercise. */
export interface ParsedAnswerKey {
  /** Maps exercise index (0-based) to a map of question number → answer */
  answers: Map<number, AnswerEntry>;
}

/** User's answer for a single question. */
export interface UserAnswer {
  /** The user's text input(s) for each blank */
  values: string[];
  /** Whether the answer has been checked */
  checked: boolean;
  /** Whether the answer is correct (after checking) */
  correct?: boolean;
}

/** Stored exercise attempt for a day+exercise. */
export interface ExerciseAttempt {
  dayId: number;
  exerciseIndex: number;
  answers: Record<number, UserAnswer>;
  score: number;
  total: number;
  submittedAt: string;
}
