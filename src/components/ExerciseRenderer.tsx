'use client';

import { useState, useEffect, useCallback } from 'react';
import { parseExercise } from '@/lib/exercise-parser';
import { resolveAnswersForExercise } from '@/lib/answer-key-parser';
import { calculateScore } from '@/lib/answer-checker';
import { useProgressStore } from '@/store/progress';
import { MarkdownRenderer } from './MarkdownRenderer';
import { FillBlankQuestion } from './exercises/FillBlankQuestion';
import { MultipleChoiceQuestion } from './exercises/MultipleChoiceQuestion';
import { TransformationQuestion } from './exercises/TransformationQuestion';
import { FreeTextQuestion } from './exercises/FreeTextQuestion';
import type { ContentSection } from '@/data';
import type { UserAnswer, ParsedExercise } from '@/lib/exercise-types';

interface ExerciseRendererProps {
  /** The day number */
  dayId: number;
  /** All exercises for this day */
  exercises: ContentSection[];
  /** The level's answerKey field */
  answerKey: string;
  /** All exercises in the level (for GABARITO lookup across days) */
  allLevelExercises: ContentSection[];
}

/**
 * Main exercise rendering component.
 * Replaces static markdown rendering for exercises with interactive forms.
 *
 * For exercises that have parseable questions and matching answer keys,
 * renders interactive input components. Otherwise falls back to static markdown.
 */
export function ExerciseRenderer({
  dayId,
  exercises,
  answerKey,
  allLevelExercises,
}: ExerciseRendererProps) {
  const totalExercises = exercises.length;
  
  return (
    <div className="flex flex-col gap-8">
      {exercises.map((exercise, index) => (
        <SingleExercise
          key={index}
          dayId={dayId}
          exercise={exercise}
          exerciseIndex={index}
          totalExercises={totalExercises}
          allLevelExercises={allLevelExercises}
          answerKey={answerKey}
        />
      ))}
    </div>
  );
}

interface SingleExerciseProps {
  dayId: number;
  exercise: ContentSection;
  exerciseIndex: number;
  totalExercises: number;
  allLevelExercises: ContentSection[];
  answerKey: string;
}

function SingleExercise({
  dayId,
  exercise,
  exerciseIndex,
  totalExercises,
  allLevelExercises,
  answerKey,
}: SingleExerciseProps) {
  const saveExerciseAnswers = useProgressStore((s) => s.saveExerciseAnswers);
  const getExerciseAnswers = useProgressStore((s) => s.getExerciseAnswers);
  const clearExerciseAnswers = useProgressStore((s) => s.clearExerciseAnswers);
  const saveExerciseScore = useProgressStore((s) => s.saveExerciseScore);
  const getDayExercisesSummary = useProgressStore((s) => s.getDayExercisesSummary);
  const checkAndAutoCompleteDay = useProgressStore((s) => s.checkAndAutoCompleteDay);

  // Parse the exercise and resolve answers
  const parsed: ParsedExercise = parseExercise(exercise.title, exercise.content);
  const correctAnswerMap = resolveAnswersForExercise(
    exercise.title,
    allLevelExercises,
    answerKey
  );

  // Determine if we can render interactively.
  // If we have both parsed questions AND a matching answer key, the exercise is interactive.
  // The isAnswerOnlyExercise check is only a fallback for exercises without answer keys
  // (A2/B1/C1 where content IS the answer key, not questions).
  const canBeInteractive =
    parsed.hasQuestions &&
    parsed.questions.length > 0 &&
    correctAnswerMap !== null &&
    correctAnswerMap.size > 0;

  // Load saved answers
  const savedData = getExerciseAnswers(dayId, exerciseIndex);

  const [userAnswers, setUserAnswers] = useState<Record<number, UserAnswer>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  // Restore saved state on mount
  useEffect(() => {
    if (savedData) {
      const restored: Record<number, UserAnswer> = {};
      for (const [key, val] of Object.entries(savedData.answers)) {
        restored[parseInt(key)] = {
          values: val.values,
          checked: val.checked,
          correct: val.correct,
        };
      }
      setUserAnswers(restored);
      setSubmitted(savedData.submitted);
      setScore(savedData.score);
      setTotal(savedData.total);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnswerChange = useCallback(
    (questionNumber: number, values: string[]) => {
      setUserAnswers((prev) => {
        const updated: Record<number, UserAnswer> = {
          ...prev,
          [questionNumber]: { values, checked: false },
        };
        // Auto-save progress (not submitted yet)
        const storable: Record<number, { values: string[]; checked: boolean; correct?: boolean }> = {};
        for (const [k, v] of Object.entries(updated)) {
          storable[parseInt(k)] = { values: v.values, checked: v.checked, correct: v.correct };
        }
        saveExerciseAnswers(dayId, exerciseIndex, storable, false, 0, 0);
        return updated;
      });
    },
    [dayId, exerciseIndex, saveExerciseAnswers]
  );

  const handleSubmit = () => {
    if (!correctAnswerMap) return;

    const { score: newScore, total: newTotal, results: newResults } = calculateScore(
      userAnswers,
      correctAnswerMap
    );

    // Update user answers with check results
    const checkedAnswers: Record<number, UserAnswer> = {};
    for (const [qNum, answer] of Object.entries(userAnswers)) {
      const num = parseInt(qNum);
      checkedAnswers[num] = {
        ...answer,
        checked: true,
        correct: newResults.get(num) || false,
      };
    }
    // Also mark unanswered questions
    for (const qNum of correctAnswerMap.keys()) {
      if (!checkedAnswers[qNum]) {
        checkedAnswers[qNum] = { values: [], checked: true, correct: false };
      }
    }

    setUserAnswers(checkedAnswers);
    setSubmitted(true);
    setScore(newScore);
    setTotal(newTotal);

    // Persist
    const storable: Record<number, { values: string[]; checked: boolean; correct?: boolean }> = {};
    for (const [k, v] of Object.entries(checkedAnswers)) {
      storable[parseInt(k)] = { values: v.values, checked: v.checked, correct: v.correct };
    }
    saveExerciseAnswers(dayId, exerciseIndex, storable, true, newScore, newTotal);

    // Update day-level score
    const summary = getDayExercisesSummary(dayId);
    const dayScore = summary.totalScore - (savedData?.score || 0) + newScore;
    const dayTotal = summary.totalQuestions - (savedData?.total || 0) + newTotal;
    saveExerciseScore(dayId, dayScore, dayTotal);

    // Auto-complete day if all exercises are done
    checkAndAutoCompleteDay(dayId, totalExercises);
  };

  const handleRetry = () => {
    setUserAnswers({});
    setSubmitted(false);
    setScore(0);
    setTotal(0);
    setShowAnswerKey(false);
    clearExerciseAnswers(dayId, exerciseIndex);
  };

  const answeredCount = Object.values(userAnswers).filter(
    (a) => a.values.some((v) => v.trim().length > 0)
  ).length;
  const totalQuestions = canBeInteractive ? parsed.questions.length : 0;

  // Fallback: render as static markdown (for answer-only exercises without question text)
  if (!canBeInteractive) {
    return (
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--accent)' }}>
          {exercise.title}
        </h3>
        <div
          className="text-xs font-medium px-2.5 py-1 rounded-md mb-3 inline-block"
          style={{ backgroundColor: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
        >
          Answer Key — Review the answers and check your understanding
        </div>
        <MarkdownRenderer content={exercise.content} />
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h3 className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
            {exercise.title}
          </h3>
          {parsed.instruction && parsed.instruction !== exercise.title && (
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {parsed.instruction}
            </p>
          )}
        </div>
        {submitted && total > 0 && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold shrink-0"
            style={{
              backgroundColor:
                score / total >= 0.7
                  ? 'rgba(34, 197, 94, 0.15)'
                  : score / total >= 0.4
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
              color:
                score / total >= 0.7
                  ? '#22c55e'
                  : score / total >= 0.4
                  ? '#f59e0b'
                  : '#ef4444',
            }}
          >
            {score}/{total}
            <span className="text-xs opacity-80">
              ({Math.round((score / total) * 100)}%)
            </span>
          </div>
        )}
      </div>

      {/* Questions */}
      <div
        className="rounded-xl p-4 sm:p-5 flex flex-col gap-4"
        style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border-color)' }}
      >
        {parsed.questions.map((question) => {
          const ua = userAnswers[question.number] || { values: [], checked: false };
          const correctEntry = correctAnswerMap?.get(question.number);

          const commonProps = {
            question,
            userValues: ua.values,
            onChange: (values: string[]) => handleAnswerChange(question.number, values),
            checked: ua.checked,
            correct: ua.correct,
            correctAnswer: correctEntry?.displayAnswer,
            disabled: submitted,
          };

          switch (question.type) {
            case 'multiple-choice':
              return <MultipleChoiceQuestion key={question.number} {...commonProps} />;
            case 'transformation':
              return <TransformationQuestion key={question.number} {...commonProps} />;
            case 'free-text':
              return <FreeTextQuestion key={question.number} {...commonProps} />;
            case 'fill-blank':
            default:
              return <FillBlankQuestion key={question.number} {...commonProps} />;
          }
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-4 flex-wrap">
        {!submitted ? (
          <>
            <button
              onClick={handleSubmit}
              disabled={answeredCount === 0}
              className="px-5 py-2 rounded-lg font-medium text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              Check Answers
              {answeredCount > 0 && (
                <span className="ml-1 opacity-80">
                  ({answeredCount}/{totalQuestions})
                </span>
              )}
            </button>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {answeredCount}/{totalQuestions} answered
            </span>
          </>
        ) : (
          <>
            <button
              onClick={handleRetry}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-color)' }}
            >
              Try Again
            </button>
            <button
              onClick={() => setShowAnswerKey(!showAnswerKey)}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-color)' }}
            >
              {showAnswerKey ? 'Hide' : 'Show'} All Answers
            </button>
            {/* Score summary */}
            <span className="text-sm ml-auto" style={{ color: 'var(--text-secondary)' }}>
              {total > 0 && score >= total
                ? 'Perfect score!'
                : total > 0 && score / total >= 0.7
                ? 'Well done!'
                : total > 0 && score / total >= 0.4
                ? 'Keep practicing!'
                : 'Review the material and try again.'}
            </span>
          </>
        )}
      </div>

      {/* Full answer key */}
      {showAnswerKey && correctAnswerMap && (
        <div
          className="mt-4 rounded-xl p-4"
          style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)' }}
        >
          <h4 className="text-sm font-semibold mb-3" style={{ color: '#22c55e' }}>
            Answer Key
          </h4>
          <div className="flex flex-col gap-1.5">
            {Array.from(correctAnswerMap.entries())
              .sort(([a], [b]) => a - b)
              .map(([num, entry]) => (
                <div key={num} className="text-sm">
                  <span className="font-medium" style={{ color: 'var(--accent)' }}>
                    {num}.
                  </span>{' '}
                  <span>{entry.displayAnswer}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
