'use client';

import Link from 'next/link';
import { course, getLevelContent } from '../../data';
import { useProgressStore } from '../../store/progress';
import { curriculum } from '../../data';

export default function LevelsPage() {
  const completedDays = useProgressStore((s) => s.completedDays);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <h1 className="text-3xl font-bold mb-2">CEFR Levels</h1>
      <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
        Browse content by level — explore grammar, vocabulary, reading, and exercises outside the 90-day path.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {course.levels.map((level) => {
          const content = getLevelContent(level.id);
          const levelDays = curriculum.filter((d) => d.level === level.id);
          const doneCount = levelDays.filter((d) => completedDays.includes(d.day)).length;

          return (
            <Link
              key={level.id}
              href={`/level/${level.id}`}
              className="group rounded-2xl p-6 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-lg font-bold text-white"
                  style={{ backgroundColor: level.color }}
                >
                  {level.id}
                </span>
                <div>
                  <h2 className="text-lg font-semibold group-hover:underline">{level.name}</h2>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Days {level.dayStart}–{level.dayEnd}
                  </p>
                </div>
              </div>

              {content && (
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <StatBox label="Grammar" count={content.grammar.length} />
                  <StatBox label="Vocabulary" count={content.vocabulary.length} />
                  <StatBox label="Reading" count={content.reading.length} />
                  <StatBox label="Exercises" count={content.exercises.length} />
                </div>
              )}

              {/* Mini progress */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: 'var(--border-color)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round((doneCount / levelDays.length) * 100)}%`,
                      backgroundColor: level.color,
                    }}
                  />
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {doneCount}/{levelDays.length}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatBox({ label, count }: { label: string; count: number }) {
  return (
    <div
      className="rounded-lg px-3 py-2 text-center"
      style={{ backgroundColor: 'var(--surface-hover, var(--border-color))' }}
    >
      <div className="text-lg font-bold">{count}</div>
      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </div>
    </div>
  );
}
