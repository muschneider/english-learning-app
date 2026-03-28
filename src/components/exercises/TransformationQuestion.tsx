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
 * Renders a transformation question (e.g., "book → _______").
 * Shows the input word and an input field for the transformed output.
 */
export function TransformationQuestion({
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

  // Extract the input word (before the arrow)
  const arrowIdx = question.prompt.indexOf('→');
  const inputWord = arrowIdx >= 0 ? question.prompt.substring(0, arrowIdx).trim() : question.prompt;

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
      <div className="flex items-baseline gap-2 text-[15px]">
        <span
          className="font-semibold min-w-[28px]"
          style={{ color: 'var(--accent)' }}
        >
          {question.number}.
        </span>
        <span className="font-medium">{inputWord}</span>
        <span style={{ color: 'var(--text-secondary)' }}>→</span>
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          placeholder="..."
          className="rounded-md px-2 py-1 text-sm font-medium transition-colors outline-none min-w-[120px] max-w-[200px]"
          style={{
            border: `2px solid ${getBorderColor()}`,
            backgroundColor: getBgColor(),
            color: 'var(--foreground)',
          }}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      {checked && !correct && correctAnswer && (
        <div className="ml-8 text-sm" style={{ color: '#22c55e' }}>
          Correct answer: <strong>{correctAnswer}</strong>
        </div>
      )}
    </div>
  );
}
