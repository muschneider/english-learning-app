'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useProgressStore } from '../store/progress';

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

function useStoreRehydrated() {
  return useSyncExternalStore(
    () => useProgressStore.persist.hasHydrated,
    () => useProgressStore.persist.hasHydrated(),
    () => false
  );
}

export function Navbar() {
  const hydrated = useHydrated();
  const rehydrated = useStoreRehydrated();
  const darkMode = useProgressStore((s) => s.darkMode);
  const toggleDarkMode = useProgressStore((s) => s.toggleDarkMode);
  const progressPercent = useProgressStore((s) => s.getProgressPercent());

  return (
    <nav className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{
        borderColor: 'var(--border-color)',
        backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
      }}
    >
      <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg" style={{ color: 'var(--accent)' }}>
          <span className="text-2xl">EN</span>
          <span className="hidden sm:inline" style={{ color: 'var(--foreground)' }}>Learning Path</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {hydrated && rehydrated && (
            <div className="hidden sm:flex items-center gap-2 text-sm px-3 py-1 rounded-full"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}>
              <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%`, backgroundColor: 'var(--accent)' }}
                />
              </div>
              <span>{progressPercent}%</span>
            </div>
          )}

          <Link href="/" className="text-sm px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}>
            Dashboard
          </Link>
          <Link href="/levels" className="text-sm px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}>
            Levels
          </Link>

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06L5.404 4.344a.75.75 0 10-1.06 1.06l1.06 1.06z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
