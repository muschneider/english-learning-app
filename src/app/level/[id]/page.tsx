'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { getLevelContent, course } from '../../../data';
import { MarkdownRenderer } from '../../../components/MarkdownRenderer';

type Section = 'overview' | 'grammar' | 'vocabulary' | 'reading' | 'communication' | 'exercises';

export default function LevelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const levelId = id.toUpperCase();
  const content = getLevelContent(levelId);
  const levelMeta = course.levels.find((l) => l.id === levelId);

  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [expandedItem, setExpandedItem] = useState<number | null>(0);

  if (!content || !levelMeta) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Level not found</h1>
        <Link href="/levels" className="inline-block mt-6 px-4 py-2 rounded-lg font-medium" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
          Back to Levels
        </Link>
      </div>
    );
  }

  const allSections: { id: Section; label: string; count: number }[] = [
    { id: 'overview', label: 'Overview', count: 1 },
    { id: 'grammar', label: 'Grammar', count: content.grammar.length },
    { id: 'vocabulary', label: 'Vocabulary', count: content.vocabulary.length },
    { id: 'reading', label: 'Reading', count: content.reading.length },
    { id: 'communication', label: 'Communication', count: content.communication.length },
    { id: 'exercises', label: 'Exercises', count: content.exercises.length },
  ];
  const sections = allSections.filter((s) => s.count > 0);

  const getItems = () => {
    switch (activeSection) {
      case 'overview':
        return [{ title: content.title || `${levelId} Overview`, content: content.overview }];
      case 'grammar':
        return content.grammar;
      case 'vocabulary':
        return content.vocabulary;
      case 'reading':
        return content.reading;
      case 'communication':
        return content.communication;
      case 'exercises':
        return content.exercises;
      default:
        return [];
    }
  };

  const items = getItems();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Link href="/levels" className="text-sm hover:underline" style={{ color: 'var(--text-secondary)' }}>
          Levels
        </Link>
        <span style={{ color: 'var(--text-secondary)' }}>/</span>
      </div>
      <div className="flex items-center gap-4 mb-6">
        <span
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-xl font-bold text-white"
          style={{ backgroundColor: levelMeta.color }}
        >
          {levelId}
        </span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{levelMeta.name}</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Days {levelMeta.dayStart}–{levelMeta.dayEnd} &middot;{' '}
            {content.grammar.length} grammar topics &middot;{' '}
            {content.vocabulary.length} vocabulary sections
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="lg:w-56 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setActiveSection(s.id);
                  setExpandedItem(0);
                }}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
                style={{
                  backgroundColor: activeSection === s.id ? 'var(--accent)' : 'transparent',
                  color: activeSection === s.id ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {s.label}
                <span className="text-xs opacity-70">{s.count}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {items.map((item, i) => (
            <div
              key={i}
              className="mb-3 rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--border-color)' }}
            >
              <button
                onClick={() => setExpandedItem(expandedItem === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left font-medium transition-colors"
                style={{
                  backgroundColor: expandedItem === i ? 'var(--surface)' : 'transparent',
                }}
              >
                <span className="text-sm sm:text-base">{item.title}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`w-5 h-5 flex-shrink-0 transition-transform ${expandedItem === i ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
              {expandedItem === i && (
                <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <MarkdownRenderer content={item.content} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
