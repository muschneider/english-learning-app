'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { getDayContent, course } from '../../../data';
import { useProgressStore } from '../../../store/progress';
import { MarkdownRenderer } from '../../../components/MarkdownRenderer';
import { ExerciseRenderer } from '../../../components/ExerciseRenderer';

type Tab = 'grammar' | 'vocabulary' | 'reading' | 'dialogues' | 'exercises';

export default function DayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const dayNum = parseInt(id, 10);
  const dayContent = getDayContent(dayNum);
  const completedDays = useProgressStore((s) => s.completedDays);
  const completeDay = useProgressStore((s) => s.completeDay);
  const uncompleteDay = useProgressStore((s) => s.uncompleteDay);

  const [activeTab, setActiveTab] = useState<Tab>('grammar');

  if (!dayContent) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Day not found</h1>
        <p style={{ color: 'var(--text-secondary)' }}>This day does not exist in the curriculum.</p>
        <Link href="/" className="inline-block mt-6 px-4 py-2 rounded-lg font-medium" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const { plan, grammar, vocabulary, reading, dialogues, exercises, answerKey, allLevelExercises } = dayContent;
  const isCompleted = completedDays.includes(dayNum);
  const levelMeta = course.levels.find((l) => l.id === plan.level);

  // Determine available tabs
  const tabs: { id: Tab; label: string; count: number }[] = [];
  if (grammar.length > 0) tabs.push({ id: 'grammar', label: 'Grammar', count: grammar.length });
  if (vocabulary.length > 0) tabs.push({ id: 'vocabulary', label: 'Vocabulary', count: vocabulary.length });
  if (reading.length > 0) tabs.push({ id: 'reading', label: 'Reading', count: reading.length });
  if (dialogues.length > 0) tabs.push({ id: 'dialogues', label: 'Dialogues', count: dialogues.length });
  if (exercises.length > 0) tabs.push({ id: 'exercises', label: 'Exercises', count: exercises.length });

  // Set default active tab to first available
  const effectiveTab = tabs.find((t) => t.id === activeTab) ? activeTab : tabs[0]?.id || 'grammar';

  const renderContent = () => {
    switch (effectiveTab) {
      case 'grammar':
        return grammar.map((item, i) => (
          <div key={i} className="mb-8">
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--accent)' }}>{item.title}</h3>
            <MarkdownRenderer content={item.content} />
          </div>
        ));
      case 'vocabulary':
        return vocabulary.map((item, i) => (
          <div key={i} className="mb-8">
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--accent)' }}>{item.title}</h3>
            <MarkdownRenderer content={item.content} />
          </div>
        ));
      case 'reading':
        return reading.map((item, i) => (
          <div key={i} className="mb-8">
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--accent)' }}>{item.title}</h3>
            <MarkdownRenderer content={item.content} />
          </div>
        ));
      case 'dialogues':
        return dialogues.map((item, i) => (
          <div key={i} className="mb-8">
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--accent)' }}>{item.title}</h3>
            <MarkdownRenderer content={item.content} />
          </div>
        ));
      case 'exercises':
        return (
          <ExerciseRenderer
            dayId={dayNum}
            exercises={exercises}
            answerKey={answerKey}
            allLevelExercises={allLevelExercises}
          />
        );
      default:
        return <p style={{ color: 'var(--text-secondary)' }}>No content available for this section.</p>;
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/" className="text-sm hover:underline" style={{ color: 'var(--text-secondary)' }}>
              Dashboard
            </Link>
            <span style={{ color: 'var(--text-secondary)' }}>/</span>
            <span
              className="text-sm font-medium px-2 py-0.5 rounded-md text-white"
              style={{ backgroundColor: levelMeta?.color || 'var(--accent)' }}
            >
              {plan.level} — {plan.levelDescription}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Day {dayNum}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {plan.phase} &middot; {plan.title}
          </p>
        </div>
        <button
          onClick={() => (isCompleted ? uncompleteDay(dayNum) : completeDay(dayNum))}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
            isCompleted ? 'text-white' : ''
          }`}
          style={{
            backgroundColor: isCompleted ? '#22c55e' : 'var(--surface)',
            border: isCompleted ? 'none' : '1px solid var(--border-color)',
          }}
        >
          {isCompleted ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              Completed
            </>
          ) : (
            'Mark Complete'
          )}
        </button>
      </div>

      {/* Tabs */}
      {tabs.length > 0 && (
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={effectiveTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
              style={{
                backgroundColor: effectiveTab === tab.id ? 'var(--accent)' : 'var(--surface)',
                color: effectiveTab === tab.id ? '#fff' : 'var(--text-secondary)',
                border: effectiveTab === tab.id ? 'none' : '1px solid var(--border-color)',
              }}
            >
              {tab.label}
              <span
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: effectiveTab === tab.id ? 'rgba(255,255,255,0.2)' : 'var(--border-color)',
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div
        className="rounded-2xl p-5 sm:p-8"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-color)' }}
      >
        {renderContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        {dayNum > 1 ? (
          <Link
            href={`/day/${dayNum - 1}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-color)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Day {dayNum - 1}
          </Link>
        ) : (
          <div />
        )}
        {dayNum < 90 ? (
          <Link
            href={`/day/${dayNum + 1}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-color)' }}
          >
            Day {dayNum + 1}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
            </svg>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
