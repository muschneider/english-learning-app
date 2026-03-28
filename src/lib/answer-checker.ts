/**
 * Answer checking logic for exercise evaluation.
 * Supports flexible matching with normalization.
 */

import type { AnswerEntry, UserAnswer } from './exercise-types';

/**
 * Normalize text for comparison:
 * - lowercase
 * - trim whitespace
 * - collapse multiple spaces
 * - strip trailing punctuation (optional period, comma)
 * - normalize quotes and apostrophes
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/\.+$/, '')
    .trim();
}

/**
 * Check if a user's answer matches the accepted answers for a question.
 *
 * @param userAnswer - The user's submitted answer(s) (one per blank)
 * @param correctAnswer - The accepted answer entry
 * @returns true if the answer is considered correct
 */
export function checkAnswer(
  userAnswer: UserAnswer,
  correctAnswer: AnswerEntry
): boolean {
  const { values } = userAnswer;
  const { acceptedAnswers } = correctAnswer;

  // If there are multiple blank positions, check each one
  if (acceptedAnswers.length > 1 && values.length >= acceptedAnswers.length) {
    return acceptedAnswers.every((alternatives, i) => {
      const userVal = normalize(values[i] || '');
      return alternatives.some((alt) => normalize(alt) === userVal);
    });
  }

  // Single blank: join all user values and check against alternatives
  const userVal = normalize(values.join(' '));
  if (!userVal) return false;

  return acceptedAnswers.some((alternatives) =>
    alternatives.some((alt) => {
      const normalizedAlt = normalize(alt);
      // Exact match
      if (normalizedAlt === userVal) return true;
      // Check if user's answer is contained in a longer accepted answer (for full sentences)
      // Only for longer answers (>20 chars) to avoid false positives
      if (normalizedAlt.length > 20 && normalizedAlt.includes(userVal) && userVal.length > 5) {
        return true;
      }
      return false;
    })
  );
}

/**
 * Calculate the score for a set of user answers against correct answers.
 */
export function calculateScore(
  userAnswers: Record<number, UserAnswer>,
  correctAnswers: Map<number, AnswerEntry>
): { score: number; total: number; results: Map<number, boolean> } {
  const results = new Map<number, boolean>();
  let score = 0;
  const total = correctAnswers.size;

  for (const [qNum, correctAnswer] of correctAnswers) {
    const userAnswer = userAnswers[qNum];
    if (userAnswer && userAnswer.values.some((v) => v.trim().length > 0)) {
      const isCorrect = checkAnswer(userAnswer, correctAnswer);
      results.set(qNum, isCorrect);
      if (isCorrect) score++;
    } else {
      results.set(qNum, false);
    }
  }

  return { score, total, results };
}
