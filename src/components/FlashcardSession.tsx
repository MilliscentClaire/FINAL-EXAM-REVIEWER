import { useCallback, useEffect, useState } from 'react';
import { Check, Eye, RotateCcw } from 'lucide-react';
import type { QuizDeck, QuizQuestion } from '../types/quiz';

interface FlashcardSessionProps {
  deck: QuizDeck;
  onExit: () => void;
}

export function FlashcardSession({ deck, onExit }: FlashcardSessionProps) {
  const [queue, setQueue] = useState<QuizQuestion[]>(() => [...deck.questions]);
  const [flipped, setFlipped] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);

  const currentCard = queue[0];
  const totalCount = deck.questions.length;

  const markAgain = useCallback(() => {
    setQueue((prev) => {
      if (prev.length <= 1) return prev;
      const [first, ...rest] = prev;
      return [...rest, first];
    });
    setFlipped(false);
  }, []);

  const markGotIt = useCallback(() => {
    setQueue((prev) => prev.slice(1));
    setMasteredCount((c) => c + 1);
    setFlipped(false);
  }, []);

  const restart = useCallback(() => {
    setQueue([...deck.questions]);
    setMasteredCount(0);
    setFlipped(false);
  }, [deck.questions]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onExit();
        return;
      }

      if (!currentCard) return;

      if (event.key === ' ') {
        event.preventDefault();
        setFlipped((f) => !f);
        return;
      }

      if (flipped) {
        if (event.key === 'ArrowLeft' || event.key === '1') {
          event.preventDefault();
          markAgain();
        } else if (event.key === 'ArrowRight' || event.key === '2') {
          event.preventDefault();
          markGotIt();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCard, flipped, markAgain, markGotIt, onExit]);

  if (!currentCard) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-zinc-200 bg-white p-5 text-center shadow-xs sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs font-medium tracking-wide text-indigo-600 uppercase dark:text-indigo-400">
          {deck.subject}
        </p>
        <h2 className="mt-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
          All {totalCount} Flashcards Reviewed!
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          You cleared the entire flashcard queue for {deck.title}.
        </p>

        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restart Flashcards</span>
          </button>
          <button
            type="button"
            onClick={onExit}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Back to Decks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
        <span>{queue.length} remaining</span>
        <span>
          {masteredCount} / {totalCount} mastered
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-200"
          style={{
            width: `${totalCount > 0 ? (masteredCount / totalCount) * 100 : 0}%`,
          }}
        />
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => setFlipped((f) => !f)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') setFlipped((f) => !f);
        }}
        className="flex min-h-60 cursor-pointer flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs sm:min-h-72 sm:p-6 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
              {flipped ? 'Answer' : 'Question'}
            </span>
            {currentCard.topic && (
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {currentCard.topic}
              </span>
            )}
          </div>

          <h2 className="mt-3 text-base leading-snug font-semibold text-zinc-900 sm:mt-4 sm:text-lg dark:text-zinc-100">
            {currentCard.question}
          </h2>

          {!flipped &&
            currentCard.type === 'multiple-choice' &&
            currentCard.options && (
              <ul className="mt-4 space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                {currentCard.options.map((opt, idx) => (
                  <li key={`${opt}-${idx}`}>
                    {idx + 1}. {opt}
                  </li>
                ))}
              </ul>
            )}
        </div>

        {flipped ? (
          <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <p className="text-base font-semibold text-emerald-700 dark:text-emerald-400">
              {currentCard.answer}
            </p>
            {currentCard.explanation && (
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                {currentCard.explanation}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
            <Eye className="h-3.5 w-3.5" />
            <span>Click card or press Space to flip</span>
          </div>
        )}
      </div>

      {flipped && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={markAgain}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Review Again (← / 1)</span>
          </button>

          <button
            type="button"
            onClick={markGotIt}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-semibold text-white transition hover:bg-emerald-500"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Got It (→ / 2)</span>
          </button>
        </div>
      )}
    </div>
  );
}
