import { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  Download,
  FileText,
  Layers,
  Play,
  PlayCircle,
  RotateCcw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import type { DeckProgress, QuizDeck } from '../types/quiz';
import { exportProgressBackup, type SavedQuizSession } from '../utils/storage';

export interface DeckEntry {
  deck: QuizDeck;
  isCustom: boolean;
}

interface DeckListProps {
  entries: DeckEntry[];
  progress: Record<string, DeckProgress>;
  savedSessions: Record<string, SavedQuizSession>;
  onStartQuiz: (deck: QuizDeck, missedOnly?: boolean, examMode?: boolean) => void;
  onResumeQuiz: (deck: QuizDeck, saved: SavedQuizSession) => void;
  onStartFlashcards: (deck: QuizDeck) => void;
  onOpenCram: (deck: QuizDeck) => void;
  onImportDeck: (deck: QuizDeck) => void;
  onDeleteCustomDeck: (deckId: string) => void;
  onRestoreBackup: (raw: string) => { ok: boolean; error?: string };
}

export function DeckList({
  entries,
  progress,
  savedSessions,
  onStartQuiz,
  onResumeQuiz,
  onStartFlashcards,
  onOpenCram,
  onImportDeck,
  onDeleteCustomDeck,
  onRestoreBackup,
}: DeckListProps) {
  const courses = useMemo(() => {
    const unique = new Set<string>();
    for (const { deck } of entries) {
      const label = (deck.course ?? deck.subject).trim();
      if (label) unique.add(label);
    }
    return ['All', ...Array.from(unique)];
  }, [entries]);

  const [query, setQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>(() =>
    courses.includes('Arts Appreciation') ? 'Arts Appreciation' : 'All',
  );
  const [statusMsg, setStatusMsg] = useState<{
    kind: 'error' | 'success';
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(({ deck }) => {
      const deckCourse = (deck.course ?? deck.subject).trim();
      if (selectedCourse !== 'All' && deckCourse !== selectedCourse) {
        return false;
      }
      if (!q) return true;
      return (
        deck.title.toLowerCase().includes(q) ||
        deck.subject.toLowerCase().includes(q) ||
        (deck.sectionLabel?.toLowerCase().includes(q) ?? false) ||
        (deck.description?.toLowerCase().includes(q) ?? false) ||
        (deck.sourceFile?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [entries, query, selectedCourse]);

  const comprehensiveEntries = filteredEntries.filter(
    ({ deck }) => deck.isComprehensive,
  );
  const sectionEntries = filteredEntries.filter(
    ({ deck }) => !deck.isComprehensive,
  );

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setStatusMsg(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<QuizDeck>;
      if (
        !parsed ||
        typeof parsed.title !== 'string' ||
        typeof parsed.subject !== 'string' ||
        !Array.isArray(parsed.questions) ||
        parsed.questions.length === 0
      ) {
        setStatusMsg({
          kind: 'error',
          text: 'Invalid deck JSON. Required fields: title, subject, and a non-empty questions array.',
        });
        return;
      }
      const normalized: QuizDeck = {
        id:
          typeof parsed.id === 'string' && parsed.id.trim()
            ? parsed.id.trim()
            : `custom-${Date.now()}`,
        course: parsed.course?.trim() || parsed.subject.trim(),
        title: parsed.title.trim(),
        subject: parsed.subject.trim(),
        description: parsed.description,
        sourceFile: parsed.sourceFile ?? file.name,
        createdAt: parsed.createdAt ?? new Date().toISOString().slice(0, 10),
        questions: parsed.questions,
      };
      onImportDeck(normalized);
      setStatusMsg({
        kind: 'success',
        text: `Imported deck "${normalized.title}" (${normalized.questions.length} Qs).`,
      });
    } catch {
      setStatusMsg({
        kind: 'error',
        text: 'Could not parse JSON file. Please check the file syntax.',
      });
    }
  }

  function handleDownloadBackup() {
    const json = exportProgressBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quickreview-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMsg({
      kind: 'success',
      text: 'Downloaded progress backup file.',
    });
  }

  async function handleRestoreChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setStatusMsg(null);

    try {
      const text = await file.text();
      const res = onRestoreBackup(text);
      if (res.ok) {
        setStatusMsg({
          kind: 'success',
          text: 'Progress and saved quiz sessions restored!',
        });
      } else {
        setStatusMsg({
          kind: 'error',
          text: res.error ?? 'Could not restore backup file.',
        });
      }
    } catch {
      setStatusMsg({
        kind: 'error',
        text: 'Could not read backup file.',
      });
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-100">
            Quiz Reviewers
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500 sm:mt-1 sm:text-sm dark:text-zinc-400">
            Review by main topic section or take the full comprehensive exam.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sections or topics..."
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pr-3 pl-9 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
        </div>
      </div>

      {courses.length > 2 && (
        <div className="flex flex-wrap gap-1.5">
          {courses.map((course) => {
            const active = selectedCourse === course;
            return (
              <button
                key={course}
                type="button"
                onClick={() => setSelectedCourse(course)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                {course}
              </button>
            );
          })}
        </div>
      )}

      {comprehensiveEntries.map(({ deck }) => {
        const deckProgress = progress[deck.id];
        const missedCount = deckProgress?.missedQuestionIds.length ?? 0;
        const saved = savedSessions[deck.id];

        return (
          <div
            key={deck.id}
            className="min-w-0 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-white p-4 shadow-xs sm:p-5 dark:border-indigo-900/60 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-zinc-900"
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                    <Award className="h-3.5 w-3.5" />
                    <span>Comprehensive Exam</span>
                  </span>
                  <span className="rounded-md bg-white/90 px-2 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700">
                    {deck.questions.length} Multiple-Choice Questions
                  </span>
                  {deckProgress && (
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Best {deckProgress.bestScore}%
                    </span>
                  )}
                  {missedCount > 0 && (
                    <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                      {missedCount} missed
                    </span>
                  )}
                </div>

                <h2 className="mt-2 break-words text-base font-bold text-zinc-900 sm:mt-2.5 sm:text-lg dark:text-zinc-100">
                  {deck.title}
                </h2>
                {deck.description && (
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {deck.description}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-indigo-100 pt-3 sm:mt-4 sm:pt-3.5 dark:border-indigo-900/40">
              {saved && (
                <button
                  type="button"
                  onClick={() => onResumeQuiz(deck, saved)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 sm:px-4 sm:py-2"
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  <span>
                    Resume (Q {Math.min(saved.currentIndex + 1, saved.questionIds.length)}/
                    {saved.questionIds.length})
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onStartQuiz(deck, false, true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 sm:px-4 sm:py-2"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Start Full Exam</span>
              </button>

              <button
                type="button"
                onClick={() => onStartQuiz(deck, false, false)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <span>Practice Mode (Instant)</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenCram(deck)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Cram Sheet</span>
              </button>

              {missedCount > 0 && (
                <button
                  type="button"
                  onClick={() => onStartQuiz(deck, true, false)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-950"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Missed ({missedCount})</span>
                </button>
              )}
            </div>
          </div>
        );
      })}

      {sectionEntries.length === 0 && comprehensiveEntries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            No matching reviewers found.
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Clear your search filter or switch course tabs above.
          </p>
        </div>
      ) : (
        sectionEntries.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Topic Sections ({sectionEntries.length})
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              {sectionEntries.map(({ deck, isCustom }) => {
                const deckProgress = progress[deck.id];
                const missedCount = deckProgress?.missedQuestionIds.length ?? 0;
                const saved = savedSessions[deck.id];

                return (
                  <div
                    key={deck.id}
                    className="flex min-w-0 flex-col justify-between rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs transition hover:border-zinc-300 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                  >
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                            {deck.sectionLabel ?? deck.subject}
                          </span>
                          <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            {deck.questions.length} Qs
                          </span>
                          {deckProgress && (
                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                              Best {deckProgress.bestScore}%
                            </span>
                          )}
                          {missedCount > 0 && (
                            <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                              {missedCount} missed
                            </span>
                          )}
                        </div>

                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => onDeleteCustomDeck(deck.id)}
                            title="Delete imported deck"
                            className="rounded-md p-1 text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <h3 className="mt-2 break-words text-sm font-semibold text-zinc-900 sm:mt-2.5 sm:text-base dark:text-zinc-100">
                        {deck.title}
                      </h3>
                      {deck.description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                          {deck.description}
                        </p>
                      )}
                      {deck.sourceFile && (
                        <p className="mt-2 truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                          Sources: {deck.sourceFile}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                      {saved && (
                        <button
                          type="button"
                          onClick={() => onResumeQuiz(deck, saved)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          <span>
                            Resume ({Math.min(saved.currentIndex + 1, saved.questionIds.length)}/
                            {saved.questionIds.length})
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onStartQuiz(deck, false, false)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500"
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>Quiz</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onStartFlashcards(deck)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        <Layers className="h-3.5 w-3.5" />
                        <span>Flashcards</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenCram(deck)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Cram Sheet</span>
                      </button>

                      {missedCount > 0 && (
                        <button
                          type="button"
                          onClick={() => onStartQuiz(deck, true, false)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-950"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Missed ({missedCount})</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      <div className="flex flex-col justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 sm:flex-row sm:items-center sm:p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
          <div className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            <span className="font-semibold text-zinc-900 dark:text-zinc-200">
              Saved per browser:
            </span>{' '}
            Your scores, missed items, and in-progress quizzes auto-save privately in this browser. Back up or restore to transfer across devices.
            {statusMsg && (
              <p
                className={`mt-1.5 flex items-center gap-1 ${
                  statusMsg.kind === 'error'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {statusMsg.kind === 'error' ? (
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>{statusMsg.text}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Backup Progress</span>
          </button>

          <input
            ref={restoreInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleRestoreChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => restoreInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Restore Progress</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import Deck</span>
          </button>
        </div>
      </div>
    </div>
  );
}
