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
 * Renders a multiple-choice question with radio buttons for each option.
 */
export function MultipleChoiceQuestion({
  question,
  userValues,
  onChange,
  checked,
  correct,
  correctAnswer,
  disabled,
}: Props) {
  const selected = userValues[0] || '';
  const options = question.options || [];

  const handleSelect = (value: string) => {
    if (disabled) return;
    onChange([value]);
  };

  const isOptionCorrect = (option: string) => {
    if (!checked || !correctAnswer) return false;
    const normalizedCorrect = correctAnswer.toLowerCase().trim();
    const normalizedOption = option.toLowerCase().trim();
    return normalizedCorrect === normalizedOption ||
      normalizedCorrect.includes(normalizedOption);
  };

  const getOptionStyle = (option: string) => {
    const isSelected = selected.toLowerCase().trim() === option.toLowerCase().trim();

    if (!checked) {
      return {
        backgroundColor: isSelected ? 'var(--accent)' : 'var(--surface)',
        color: isSelected ? '#fff' : 'var(--foreground)',
        border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border-color)'}`,
      };
    }

    // After checking
    if (isOptionCorrect(option)) {
      return {
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        color: '#22c55e',
        border: '2px solid #22c55e',
        fontWeight: 600 as const,
      };
    }

    if (isSelected && !correct) {
      return {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        color: '#ef4444',
        border: '2px solid #ef4444',
      };
    }

    return {
      backgroundColor: 'var(--surface)',
      color: 'var(--text-secondary)',
      border: '2px solid var(--border-color)',
      opacity: 0.6,
    };
  };

  return (
    <div className="flex flex-col gap-3">
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
      <div className="flex flex-wrap gap-2 ml-8">
        {options.map((option, i) => {
          const letter = String.fromCharCode(97 + i); // a, b, c, d
          return (
            <button
              key={i}
              onClick={() => handleSelect(option)}
              disabled={disabled}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer disabled:cursor-default"
              style={getOptionStyle(option)}
            >
              <span className="font-medium opacity-70">{letter})</span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>
      {checked && !correct && correctAnswer && (
        <div className="ml-8 text-sm" style={{ color: '#22c55e' }}>
          Correct answer: <strong>{correctAnswer}</strong>
        </div>
      )}
    </div>
  );
}
