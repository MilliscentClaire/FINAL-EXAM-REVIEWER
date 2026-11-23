import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Play, Search } from 'lucide-react';
import type { QuizDeck } from '../types/quiz';

interface CramSheetProps {
  deck: QuizDeck;
  missedIds: string[];
  onStartQuiz: (missedOnly: boolean) => void;
  onExit: () => void;
}

export function CramSheet({
  deck,
  missedIds,
  onStartQuiz,
  onExit,
}: CramSheetProps) {
  const [query, setQuery] = useState('');
  const [onlyMissed, setOnlyMissed] = useState(false);
  const [hideAnswers, setHideAnswers] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onExit();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  const missedSet = useMemo(() => new Set(missedIds), [missedIds]);

  const filteredQuestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return deck.questions.filter((item) => {
      if (onlyMissed && !missedSet.has(item.id)) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        (item.topic?.toLowerCase().includes(q) ?? false) ||
        (item.explanation?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [deck.questions, missedSet, onlyMissed, query]);

  function toggleCardAnswer(id: string) {
    if (!hideAnswers) return;
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleToggleHideAll() {
    setHideAnswers((prev) => !prev);
    setRevealedIds({});
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
            {deck.subject} · Cram Sheet
          </p>
          <h1 className="mt-0.5 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {deck.title}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => onStartQuiz(onlyMissed && missedIds.length > 0)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
        >
          <Play className="h-3.5 w-3.5" />
          <span>Quiz This Set</span>
        </button>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter questions, answers, or topics..."
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pr-3 pl-9 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setOnlyMissed(false)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                !onlyMissed
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              All ({deck.questions.length})
            </button>
            <button
              type="button"
              disabled={missedIds.length === 0}
              onClick={() => setOnlyMissed(true)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition disabled:opacity-40 ${
                onlyMissed
                  ? 'bg-rose-600 text-white'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Missed ({missedIds.length})
            </button>
          </div>

          <button
            type="button"
            onClick={handleToggleHideAll}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              hideAnswers
                ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            {hideAnswers ? (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span>Answers Hidden</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span>Hide Answers</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredQuestions.map((item, idx) => {
          const showAnswer = !hideAnswers || Boolean(revealedIds[item.id]);
          const isMissed = missedSet.has(item.id);

          return (
            <div
              key={item.id}
              onClick={() => toggleCardAnswer(item.id)}
              className={`rounded-xl border bg-white p-4 transition dark:bg-zinc-900 ${
                hideAnswers ? 'cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700' : ''
              } ${
                isMissed
                  ? 'border-rose-200 dark:border-rose-900/60'
                  : 'border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
                <span>
                  #{idx + 1} · {item.type.replace('-', ' ')}
                </span>
                <div className="flex items-center gap-1.5">
                  {item.topic && (
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {item.topic}
                    </span>
                  )}
                  {isMissed && (
                    <span className="rounded bg-rose-50 px-2 py-0.5 font-medium text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                      Missed
                    </span>
                  )}
                </div>
              </div>

              <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {item.question}
              </p>

              {showAnswer ? (
                <div className="mt-2.5 border-t border-zinc-100 pt-2.5 dark:border-zinc-800">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    {item.answer}
                  </p>
                  {item.explanation && (
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                      {item.explanation}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-2.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  Click card to reveal answer
                </p>
              )}
            </div>
          );
        })}

        {filteredQuestions.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
            No matching questions in this deck.
          </div>
        )}
      </div>
    </div>
  );
}
