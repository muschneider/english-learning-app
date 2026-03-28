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
 * Renders a fill-in-the-blank question with inline input fields
 * replacing the _______ placeholders in the prompt.
 */
export function FillBlankQuestion({
  question,
  userValues,
  onChange,
  checked,
  correct,
  correctAnswer,
  disabled,
}: Props) {
  // Split prompt by blank markers to create segments
  const parts = question.prompt.split(/_{3,}/);

  const handleChange = (index: number, value: string) => {
    const newValues = [...userValues];
    newValues[index] = value;
    onChange(newValues);
  };

  const getBorderColor = () => {
    if (!checked) return 'var(--border-color)';
    if (correct) return '#22c55e';
    return '#ef4444';
  };

  const getBgColor = () => {
    if (!checked) return 'var(--background)';
    if (correct) return 'rgba(34, 197, 94, 0.1)';
    return 'rgba(239, 68, 68, 0.1)';
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline gap-1 leading-relaxed text-[15px]">
        <span
          className="font-semibold mr-1 min-w-[28px]"
          style={{ color: 'var(--accent)' }}
        >
          {question.number}.
        </span>
        {parts.map((part, i) => (
          <span key={i} className="inline-flex items-baseline gap-1 flex-wrap">
            <span>{part}</span>
            {i < parts.length - 1 && (
              <input
                type="text"
                value={userValues[i] || ''}
                onChange={(e) => handleChange(i, e.target.value)}
                disabled={disabled}
                placeholder="..."
                className="inline-block rounded-md px-2 py-1 text-sm font-medium transition-colors outline-none min-w-[80px] max-w-[200px]"
                style={{
                  border: `2px solid ${getBorderColor()}`,
                  backgroundColor: getBgColor(),
                  color: 'var(--foreground)',
                }}
                autoComplete="off"
                spellCheck={false}
              />
            )}
          </span>
        ))}
        {question.hint && (
          <span className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>
            ({question.hint})
          </span>
        )}
      </div>
      {checked && !correct && correctAnswer && (
        <div className="ml-8 text-sm" style={{ color: '#22c55e' }}>
          Correct answer: <strong>{correctAnswer}</strong>
        </div>
      )}
    </div>
  );
}
