'use client';

import type { ExerciseQuestion } from '@/lib/exercise-types';

interface Props {
  question: ExerciseQuestion;
  userValues: string[];
  onChange: (values: string[]) => void;
  checked: boolean;
  correct?: boolean;
  correctAnswer?: string;
  disabled: boolean;
}

/**
 * Renders a free-text question (translation, sentence construction, rewriting).
 * Shows a textarea input for the user's answer.
 */
export function FreeTextQuestion({
  question,
  userValues,
  onChange,
  checked,
  correct,
  correctAnswer,
  disabled,
}: Props) {
  const value = userValues[0] || '';

  const handleChange = (newValue: string) => {
    onChange([newValue]);
  };

  const getBorderColor = () => {
    if (!checked) return 'var(--border-color)';
    if (correct) return '#22c55e';
    return '#f59e0b'; // Amber for free-text (manual check)
  };

  const getBgColor = () => {
    if (!checked) return 'var(--background)';
    if (correct) return 'rgba(34, 197, 94, 0.1)';
    return 'rgba(245, 158, 11, 0.1)';
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[15px] leading-relaxed">
        <span
          className="font-semibold mr-1"
          style={{ color: 'var(--accent)' }}
        >
          {question.number}.
        </span>
        <span>{question.prompt}</span>
        {question.hint && (
          <span className="text-sm italic ml-1" style={{ color: 'var(--text-secondary)' }}>
            ({question.hint})
          </span>
        )}
      </div>
      <div className="ml-8">
        <textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          placeholder="Type your answer here..."
          rows={2}
          className="w-full rounded-lg px-3 py-2 text-sm transition-colors outline-none resize-y"
          style={{
            border: `2px solid ${getBorderColor()}`,
            backgroundColor: getBgColor(),
            color: 'var(--foreground)',
            minHeight: '48px',
          }}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      {checked && correctAnswer && (
        <div className="ml-8 text-sm" style={{ color: correct ? '#22c55e' : '#f59e0b' }}>
          {correct ? (
            <span>Correct!</span>
          ) : (
            <>
              <span>Suggested answer: </span>
              <strong>{correctAnswer}</strong>
            </>
          )}
        </div>
      )}
    </div>
  );
}
