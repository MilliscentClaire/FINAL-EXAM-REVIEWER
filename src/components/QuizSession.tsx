import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Flag,
  Flame,
  RotateCcw,
  Shuffle,
  XCircle,
  Zap,
} from 'lucide-react';
import type { QuizDeck, QuizQuestion, UserPreferences } from '../types/quiz';
import {
  checkIdentificationAnswer,
  formatDuration,
  shuffleArray,
} from '../utils/quizHelpers';

interface QuizSessionProps {
  deck: QuizDeck;
  questions: QuizQuestion[];
  prefs: UserPreferences;
  examMode?: boolean;
  onUpdatePrefs: (next: UserPreferences) => void;
  onComplete: (scorePercent: number, missedIds: string[]) => void;
  onExit: () => void;
}

interface AnswerRecord {
  question: QuizQuestion;
  userAnswer: string;
  isCorrect: boolean;
}

function prepareQuestions(
  rawQuestions: QuizQuestion[],
  shuffleQuestions: boolean,
  shuffleOptions: boolean,
): QuizQuestion[] {
  const ordered = shuffleQuestions ? shuffleArray(rawQuestions) : [...rawQuestions];
  return ordered.map((q) => {
    if (q.type === 'multiple-choice' && q.options && shuffleOptions) {
      return { ...q, options: shuffleArray(q.options) };
    }
    return q;
  });
}

export function QuizSession({
  deck,
  questions,
  prefs,
  examMode = false,
  onUpdatePrefs,
  onComplete,
  onExit,
}: QuizSessionProps) {
  const [shuffleQuestions, setShuffleQuestions] = useState(
    () => (examMode ? true : prefs.shuffleQuestions),
  );
  const [instantFeedback, setInstantFeedback] = useState(
    () => (examMode ? false : prefs.instantFeedback),
  );
  const [sessionQuestions, setSessionQuestions] = useState<QuizQuestion[]>(() =>
    prepareQuestions(
      questions,
      examMode ? true : prefs.shuffleQuestions,
      prefs.shuffleOptions,
    ),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [streak, setStreak] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);
  const [finished, setFinished] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const currentQuestion = sessionQuestions[currentIndex];
  const currentRecord = records[currentIndex];

  const resetRound = useCallback(
    (sourceQuestions: QuizQuestion[], shuffleQ = shuffleQuestions) => {
      setSessionQuestions(
        prepareQuestions(sourceQuestions, shuffleQ, prefs.shuffleOptions),
      );
      setCurrentIndex(0);
      setRecords([]);
      setStreak(0);
      setSelectedOption(null);
      setTypedAnswer('');
      setRevealed(false);
      setStartedAt(Date.now());
      setElapsedMs(0);
      setFinished(false);
    },
    [prefs.shuffleOptions, shuffleQuestions],
  );

  const finishRound = useCallback(
    (finalRecords: AnswerRecord[]) => {
      const answered = finalRecords.filter((r): r is AnswerRecord => Boolean(r));
      const duration = Date.now() - startedAt;
      const correctCount = answered.filter((r) => r.isCorrect).length;
      const total = answered.length;
      const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
      const missedIds = answered
        .filter((r) => !r.isCorrect)
        .map((r) => r.question.id);

      setRecords(answered);
      setElapsedMs(duration);
      setFinished(true);
      onComplete(scorePercent, missedIds);
    },
    [onComplete, startedAt],
  );

  const advance = useCallback(
    (recordsSnapshot?: AnswerRecord[]) => {
      const latestRecords = recordsSnapshot ?? records;
      if (currentIndex + 1 >= sessionQuestions.length) {
        finishRound(latestRecords);
        return;
      }
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setTypedAnswer('');
      setRevealed(false);
    },
    [currentIndex, finishRound, records, sessionQuestions.length],
  );

  const submitChoice = useCallback(
    (option: string) => {
      if (!currentQuestion || revealed) return;
      const isCorrect = option === currentQuestion.answer;
      const nextRecord: AnswerRecord = {
        question: currentQuestion,
        userAnswer: option,
        isCorrect,
      };
      const nextRecords = [...records];
      nextRecords[currentIndex] = nextRecord;

      setSelectedOption(option);
      setRecords(nextRecords);
      setStreak((s) => (isCorrect ? s + 1 : 0));

      if (instantFeedback) {
        setRevealed(true);
      } else {
        advance(nextRecords);
      }
    },
    [
      advance,
      currentIndex,
      currentQuestion,
      instantFeedback,
      records,
      revealed,
    ],
  );

  const submitIdentification = useCallback(
    (revealOnly = false) => {
      if (!currentQuestion || revealed) return;
      const trimmed = typedAnswer.trim();
      const isCorrect = revealOnly
        ? false
        : checkIdentificationAnswer(trimmed, currentQuestion);
      const nextRecord: AnswerRecord = {
        question: currentQuestion,
        userAnswer: revealOnly ? '(Revealed)' : trimmed || '(Blank)',
        isCorrect,
      };
      const nextRecords = [...records];
      nextRecords[currentIndex] = nextRecord;

      setRecords(nextRecords);
      setStreak((s) => (isCorrect ? s + 1 : 0));

      if (instantFeedback || revealOnly) {
        setRevealed(true);
      } else {
        advance(nextRecords);
      }
    },
    [
      advance,
      currentIndex,
      currentQuestion,
      instantFeedback,
      records,
      revealed,
      typedAnswer,
    ],
  );

  function handleOverrideCorrect() {
    if (!currentRecord || currentRecord.isCorrect) return;
    const nextRecords = [...records];
    nextRecords[currentIndex] = { ...currentRecord, isCorrect: true };
    setRecords(nextRecords);
    setStreak((s) => s + 1);
  }

  useEffect(() => {
    if (!finished && currentQuestion?.type === 'identification' && !revealed) {
      inputRef.current?.focus();
    }
  }, [currentIndex, currentQuestion, finished, revealed]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onExit();
        return;
      }

      if (finished || !currentQuestion) return;

      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if (isTyping) {
        if (event.key === 'Enter' && revealed) {
          event.preventDefault();
          advance();
        }
        return;
      }

      if (
        (currentQuestion.type === 'multiple-choice' ||
          currentQuestion.type === 'true-false') &&
        !revealed
      ) {
        const options =
          currentQuestion.options ??
          (currentQuestion.type === 'true-false' ? ['True', 'False'] : []);
        const idx = Number(event.key) - 1;
        if (idx >= 0 && idx < options.length) {
          event.preventDefault();
          submitChoice(options[idx]);
          return;
        }
      }

      if (
        revealed &&
        (event.key === 'Enter' ||
          event.key === ' ' ||
          event.key === 'ArrowRight')
      ) {
        event.preventDefault();
        advance();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [advance, currentQuestion, finished, onExit, revealed, submitChoice]);

  const topicBreakdown = useMemo(() => {
    if (!finished) return [];
    const groups = new Map<string, { correct: number; total: number }>();
    for (const r of records) {
      const key = r.question.topic?.trim() || 'General';
      const entry = groups.get(key) ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (r.isCorrect) entry.correct += 1;
      groups.set(key, entry);
    }
    return Array.from(groups.entries()).map(([topic, stats]) => ({
      topic,
      ...stats,
      percent: Math.round((stats.correct / stats.total) * 100),
    }));
  }, [finished, records]);

  if (sessionQuestions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          No questions available in this selection.
        </p>
        <button
          type="button"
          onClick={onExit}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
        >
          Back to Decks
        </button>
      </div>
    );
  }

  if (finished) {
    const correctCount = records.filter((r) => r.isCorrect).length;
    const total = records.length;
    const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const missedRecords = records.filter((r) => !r.isCorrect);

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-wide text-indigo-600 uppercase dark:text-indigo-400">
                {deck.subject} {examMode ? '· Exam Mode' : ''}
              </p>
              <h2 className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Round Complete
              </h2>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                {correctCount} of {total} correct · {formatDuration(elapsedMs)}
                {total < sessionQuestions.length &&
                  ` (${total} of ${sessionQuestions.length} answered)`}
              </p>
            </div>

            <div className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
              <span className="text-2xl font-bold">{scorePercent}%</span>
              <span className="text-[11px] font-medium">Score</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {missedRecords.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  resetRound(missedRecords.map((r) => r.question))
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-500"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Retry Missed Only ({missedRecords.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => resetRound(questions)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restart</span>
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

        {topicBreakdown.length >= 2 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Performance by Topic
            </h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {topicBreakdown.map((item) => (
                <div
                  key={item.topic}
                  className="flex items-center justify-between gap-2 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/60"
                >
                  <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">
                    {item.topic}
                  </span>
                  <span
                    className={`shrink-0 font-semibold ${
                      item.percent >= 80
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : item.percent >= 50
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {item.correct}/{item.total} ({item.percent}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {missedRecords.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Review Missed Questions ({missedRecords.length})
            </h3>
            {missedRecords.map((item) => (
              <div
                key={item.question.id}
                className="rounded-xl border border-rose-200/80 bg-white p-4 dark:border-rose-900/50 dark:bg-zinc-900"
              >
                {item.question.topic && (
                  <p className="mb-1 text-[11px] font-medium text-zinc-400">
                    {item.question.topic}
                  </p>
                )}
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {item.question.question}
                </p>
                <div className="mt-2.5 space-y-1 text-xs">
                  <p className="text-rose-600 dark:text-rose-400">
                    Your answer: <span className="font-medium">{item.userAnswer}</span>
                  </p>
                  <p className="text-emerald-700 dark:text-emerald-400">
                    Correct answer: <span className="font-semibold">{item.question.answer}</span>
                  </p>
                </div>
                {item.question.explanation && (
                  <p className="mt-2 border-t border-zinc-100 pt-2 text-xs leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    {item.question.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-center text-sm font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            Perfect round — zero missed questions!
          </div>
        )}
      </div>
    );
  }

  const options =
    currentQuestion.options ??
    (currentQuestion.type === 'true-false' ? ['True', 'False'] : []);
  const progressPercent = ((currentIndex + (revealed ? 1 : 0)) / sessionQuestions.length) * 100;
  const answeredCount = records.filter(Boolean).length;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {currentIndex + 1} / {sessionQuestions.length}
          </span>
          {!examMode && streak > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              <Flame className="h-3.5 w-3.5" />
              <span>{streak} streak</span>
            </span>
          )}
          {examMode && (
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              Exam Mode
            </span>
          )}
          {currentQuestion.topic && (
            <span className="hidden rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 sm:inline dark:bg-zinc-800 dark:text-zinc-400">
              {currentQuestion.topic}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const nextVal = !shuffleQuestions;
              setShuffleQuestions(nextVal);
              if (!examMode) {
                onUpdatePrefs({ ...prefs, shuffleQuestions: nextVal });
              }
              resetRound(questions, nextVal);
            }}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              shuffleQuestions
                ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
            }`}
          >
            <Shuffle className="h-3 w-3" />
            <span>Shuffle</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const nextVal = !instantFeedback;
              setInstantFeedback(nextVal);
              if (!examMode) {
                onUpdatePrefs({ ...prefs, instantFeedback: nextVal });
              }
            }}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              instantFeedback
                ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
            }`}
          >
            <Zap className="h-3 w-3" />
            <span>Instant</span>
          </button>

          {answeredCount > 0 && sessionQuestions.length > 10 && (
            <button
              type="button"
              onClick={() => finishRound(records)}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Flag className="h-3 w-3" />
              <span>End &amp; Grade</span>
            </button>
          )}
        </div>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
          {currentQuestion.type.replace('-', ' ')}
        </p>
        <h2 className="mt-2 text-lg leading-snug font-semibold text-zinc-900 dark:text-zinc-100">
          {currentQuestion.question}
        </h2>

        {currentQuestion.type === 'identification' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (revealed) {
                advance();
              } else {
                submitIdentification(false);
              }
            }}
            className="mt-5 space-y-3"
          >
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                disabled={revealed}
                placeholder="Type your answer and press Enter..."
                className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-none disabled:opacity-75 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
              {!revealed && (
                <>
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-500"
                  >
                    Check
                  </button>
                  <button
                    type="button"
                    onClick={() => submitIdentification(true)}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Reveal
                  </button>
                </>
              )}
            </div>
          </form>
        ) : (
          <div className="mt-5 space-y-2.5">
            {options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isCorrectOption = option === currentQuestion.answer;

              let styleClass =
                'border-zinc-200 bg-white text-zinc-800 hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/30';

              if (revealed) {
                if (isCorrectOption) {
                  styleClass =
                    'border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-200';
                } else if (isSelected) {
                  styleClass =
                    'border-rose-500 bg-rose-50 text-rose-900 dark:border-rose-600 dark:bg-rose-950/50 dark:text-rose-200';
                } else {
                  styleClass =
                    'border-zinc-200 bg-zinc-50/60 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-500';
                }
              }

              return (
                <button
                  key={`${option}-${idx}`}
                  type="button"
                  disabled={revealed}
                  onClick={() => submitChoice(option)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${styleClass}`}
                >
                  <kbd className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-current/20 bg-black/5 text-xs font-semibold dark:bg-white/5">
                    {idx + 1}
                  </kbd>
                  <span className="flex-1 leading-snug">{option}</span>
                  {revealed && isCorrectOption && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  )}
                  {revealed && isSelected && !isCorrectOption && (
                    <XCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {revealed && currentRecord && (
          <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {currentRecord.isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                )}
                <span
                  className={`text-sm font-semibold ${
                    currentRecord.isCorrect
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {currentRecord.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>

              {currentQuestion.type === 'identification' &&
                !currentRecord.isCorrect && (
                  <button
                    type="button"
                    onClick={handleOverrideCorrect}
                    className="text-xs font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    I got it right
                  </button>
                )}
            </div>

            {!currentRecord.isCorrect && (
              <p className="mt-2 text-xs text-zinc-700 dark:text-zinc-300">
                Answer:{' '}
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {currentQuestion.answer}
                </span>
              </p>
            )}

            {currentQuestion.explanation && (
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                {currentQuestion.explanation}
              </p>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => advance()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
              >
                <span>
                  {currentIndex + 1 >= sessionQuestions.length
                    ? 'Finish Round'
                    : 'Next Question'}
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
        Shortcuts: <kbd className="font-mono">1-4</kbd> pick answer ·{' '}
        <kbd className="font-mono">Enter</kbd> / <kbd className="font-mono">Space</kbd> /{' '}
        <kbd className="font-mono">→</kbd> next · <kbd className="font-mono">Esc</kbd> exit
      </p>
    </div>
  );
}
