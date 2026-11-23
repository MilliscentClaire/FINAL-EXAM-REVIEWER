import { ArrowLeft, FolderOpen, LayoutGrid, Moon, Sun, Zap } from 'lucide-react';

export type AppTab = 'reviewers' | 'files';

interface NavbarProps {
  darkMode: boolean;
  inSession: boolean;
  sessionTitle?: string;
  activeTab: AppTab;
  reviewerCount: number;
  fileCount: number;
  onSelectTab: (tab: AppTab) => void;
  onToggleDark: () => void;
  onGoHome: () => void;
}

export function Navbar({
  darkMode,
  inSession,
  sessionTitle,
  activeTab,
  reviewerCount,
  fileCount,
  onSelectTab,
  onToggleDark,
  onGoHome,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onGoHome}
            className="flex shrink-0 items-center gap-2 rounded-lg py-1 pr-2 text-left transition hover:opacity-80"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white">
              <Zap className="h-4 w-4" />
            </span>
            <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              QuickReview
            </span>
          </button>

          {!inSession ? (
            <nav
              aria-label="Primary tabs"
              className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-100/80 p-0.5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <button
                type="button"
                onClick={() => onSelectTab('reviewers')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  activeTab === 'reviewers'
                    ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Quiz Reviewers</span>
                <span className="rounded bg-zinc-200/80 px-1.5 py-0.2 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                  {reviewerCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('files')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  activeTab === 'files'
                    ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                <span>Files</span>
                <span className="rounded bg-zinc-200/80 px-1.5 py-0.2 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                  {fileCount}
                </span>
              </button>
            </nav>
          ) : (
            sessionTitle && (
              <span className="hidden truncate border-l border-zinc-200 pl-3 text-sm text-zinc-500 sm:inline dark:border-zinc-800 dark:text-zinc-400">
                {sessionTitle}
              </span>
            )
          )}
        </div>

        <div className="flex items-center gap-2">
          {inSession && (
            <button
              type="button"
              onClick={onGoHome}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Decks</span>
              <kbd className="hidden rounded border border-zinc-200 bg-zinc-50 px-1 text-[10px] text-zinc-500 sm:inline dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                Esc
              </kbd>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleDark}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
