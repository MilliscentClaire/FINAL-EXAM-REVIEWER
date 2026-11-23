import type { QuizQuestion } from '../types/quiz';

/** Returns a new shuffled copy of `items` using Fisher-Yates. */
export function shuffleArray<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizeAnswer(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:'"`]+$/g, '')
    .trim();
}

/** Checks a typed identification answer against `answer` and `acceptedAnswers`. */
export function checkIdentificationAnswer(
  input: string,
  question: QuizQuestion,
): boolean {
  const normalizedInput = normalizeAnswer(input);
  if (!normalizedInput) return false;

  const candidates = [question.answer, ...(question.acceptedAnswers ?? [])];
  return candidates.some((candidate) => normalizeAnswer(candidate) === normalizedInput);
}

/** Formats a millisecond duration into a compact human-readable string like `1m 24s` or `42s`. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}
