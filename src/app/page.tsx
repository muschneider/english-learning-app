'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useProgressStore } from '../store/progress';
import { curriculum, course } from '../data';

function useStoreRehydrated() {
  return useSyncExternalStore(
    () => useProgressStore.persist.hasHydrated,
    () => useProgressStore.persist.hasHydrated(),
    () => false
  );
}

const phaseIcons: Record<string, string> = {
  Grammar: 'G',
  Vocabulary: 'V',
  'Reading & Communication': 'R',
  'Practice & Review': 'P',
};

const phaseColors: Record<string, string> = {
  Grammar: '#3b82f6',
  Vocabulary: '#22c55e',
  'Reading & Communication': '#a855f7',
  'Practice & Review': '#f59e0b',
};

function LoadingDashboard() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <section className="mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          Your <span style={{ color: 'var(--accent)' }}>90-Day</span> English Journey
        </h1>
        <p className="text-base sm:text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>
          From A1 Beginner to C2 Proficiency — a structured path to English mastery.
        </p>
        <div
          className="rounded-2xl p-6 sm:p-8 animate-pulse"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Overall Progress
              </p>
              <p className="text-4xl font-bold" style={{ color: 'var(--accent)' }}>
                0%
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                0 of 90 days completed
              </p>
            </div>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
            <div className="h-full rounded-full" style={{ width: '0%', backgroundColor: 'var(--accent)' }} />
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Dashboard() {
  const rehydrated = useStoreRehydrated();
  const completedDays = useProgressStore((s) => s.completedDays);
  const progressPercent = useProgressStore((s) => s.getProgressPercent());
  const completedCount = useProgressStore((s) => s.getCompletedCount());
  const nextDay = useProgressStore((s) => s.getNextIncompleteDay());

  if (!rehydrated) {
    return <LoadingDashboard />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <section className="mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          Your <span style={{ color: 'var(--accent)' }}>90-Day</span> English Journey
        </h1>
        <p className="text-base sm:text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>
          From A1 Beginner to C2 Proficiency — a structured path to English mastery.
        </p>

        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Overall Progress
              </p>
              <p className="text-4xl font-bold" style={{ color: 'var(--accent)' }}>
                {progressPercent}%
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {completedCount} of 90 days completed
              </p>
            </div>
            <Link
              href={`/day/${nextDay}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition-transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {completedCount === 0 ? 'Start Learning' : 'Resume Learning'}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #22c55e, #3b82f6, #a855f7, #f59e0b, #ef4444, #ec4899)',
              }}
            />
          </div>
          <div className="flex mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {course.levels.map((lvl) => (
              <div key={lvl.id} className="text-center" style={{ width: `${((lvl.dayEnd - lvl.dayStart + 1) / 90) * 100}%` }}>
                {lvl.id}
              </div>
            ))}
          </div>
        </div>
      </section>

      {course.levels.map((level) => {
        const levelDays = curriculum.filter((d) => d.level === level.id);
        const levelCompleted = levelDays.filter((d) => completedDays.includes(d.day)).length;
        const levelPercent = Math.round((levelCompleted / levelDays.length) * 100);

        return (
          <section key={level.id} className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold text-white"
                  style={{ backgroundColor: level.color }}
                >
                  {level.id}
                </span>
                <div>
                  <h2 className="text-lg font-semibold">{level.name}</h2>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Days {level.dayStart}–{level.dayEnd} &middot; {levelCompleted}/{levelDays.length} done
                  </p>
                </div>
              </div>
              <span className="text-sm font-medium" style={{ color: level.color }}>
                {levelPercent}%
              </span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {levelDays.map((dayPlan) => {
                const isCompleted = completedDays.includes(dayPlan.day);
                const isCurrent = dayPlan.day === nextDay;
                return (
                  <Link
                    key={dayPlan.day}
                    href={`/day/${dayPlan.day}`}
                    className="relative flex flex-col items-center justify-center rounded-xl p-2 text-center transition-all hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: isCompleted
                        ? level.color
                        : 'var(--surface)',
                      border: isCurrent
                        ? `2px solid ${level.color}`
                        : '1px solid var(--border-color)',
                      color: isCompleted ? '#fff' : 'var(--foreground)',
                    }}
                    title={`Day ${dayPlan.day}: ${dayPlan.title}`}
                  >
                    <span className="text-xs font-medium">
                      {dayPlan.day}
                    </span>
                    <span
                      className="text-[10px] font-bold mt-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: isCompleted
                          ? 'rgba(255,255,255,0.25)'
                          : phaseColors[dayPlan.phase] + '22',
                        color: isCompleted
                          ? '#fff'
                          : phaseColors[dayPlan.phase],
                      }}
                    >
                      {phaseIcons[dayPlan.phase] || '?'}
                    </span>
                    {isCompleted && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                        className="absolute -top-1 -right-1 w-4 h-4 text-white bg-green-500 rounded-full p-0.5">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="flex flex-wrap gap-4 mt-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
        {Object.entries(phaseColors).map(([phase, color]) => (
          <div key={phase} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            {phase}
          </div>
        ))}
      </div>
    </div>
  );
}
