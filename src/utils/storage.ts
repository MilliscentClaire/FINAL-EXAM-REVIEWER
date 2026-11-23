import type { DeckProgress, QuizDeck, UserPreferences } from '../types/quiz';

const PROGRESS_KEY = 'quickreview:progress:v1';
const PREFS_KEY = 'quickreview:prefs:v1';
const CUSTOM_DECKS_KEY = 'quickreview:custom-decks:v1';

const DEFAULT_PREFS: UserPreferences = {
  darkMode: false,
  shuffleQuestions: true,
  shuffleOptions: true,
  instantFeedback: true,
};

function safeReadJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWriteJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota / privacy mode errors.
  }
}

export function loadProgress(): Record<string, DeckProgress> {
  return safeReadJson<Record<string, DeckProgress>>(PROGRESS_KEY, {});
}

export function saveDeckResult(
  deckId: string,
  scorePercent: number,
  missedIds: string[],
): Record<string, DeckProgress> {
  const all = loadProgress();
  const prev = all[deckId];
  const updated: DeckProgress = {
    deckId,
    bestScore: prev ? Math.max(prev.bestScore, scorePercent) : scorePercent,
    lastScore: scorePercent,
    attempts: prev ? prev.attempts + 1 : 1,
    missedQuestionIds: missedIds,
    lastStudiedAt: new Date().toISOString(),
  };
  const next = { ...all, [deckId]: updated };
  safeWriteJson(PROGRESS_KEY, next);
  return next;
}

export function loadPreferences(): UserPreferences {
  const stored = safeReadJson<Partial<UserPreferences>>(PREFS_KEY, {});
  return { ...DEFAULT_PREFS, ...stored };
}

export function savePreferences(prefs: UserPreferences): void {
  safeWriteJson(PREFS_KEY, prefs);
}

export function loadCustomDecks(): QuizDeck[] {
  const decks = safeReadJson<unknown>(CUSTOM_DECKS_KEY, []);
  return Array.isArray(decks) ? (decks as QuizDeck[]) : [];
}

export function saveCustomDeck(deck: QuizDeck): QuizDeck[] {
  const existing = loadCustomDecks().filter((item) => item.id !== deck.id);
  const next = [deck, ...existing];
  safeWriteJson(CUSTOM_DECKS_KEY, next);
  return next;
}

export function deleteCustomDeck(deckId: string): QuizDeck[] {
  const next = loadCustomDecks().filter((item) => item.id !== deckId);
  safeWriteJson(CUSTOM_DECKS_KEY, next);
  return next;
}
