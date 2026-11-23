import type { DeckProgress, QuizDeck, UserPreferences } from '../types/quiz';

const PROGRESS_KEY = 'quickreview:progress:v1';
const PREFS_KEY = 'quickreview:prefs:v1';
const CUSTOM_DECKS_KEY = 'quickreview:custom-decks:v1';
const ACTIVE_SESSIONS_KEY = 'quickreview:active-sessions:v1';

const DEFAULT_PREFS: UserPreferences = {
  darkMode: false,
  shuffleQuestions: true,
  shuffleOptions: true,
  instantFeedback: true,
};

export interface SavedQuizAnswer {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
}

export interface SavedQuizSession {
  deckId: string;
  examMode: boolean;
  missedOnly: boolean;
  shuffleQuestions: boolean;
  instantFeedback: boolean;
  questionIds: string[];
  currentIndex: number;
  answers: SavedQuizAnswer[];
  streak: number;
  elapsedMsSoFar: number;
  updatedAt: string;
}

export interface ProgressBackupPayload {
  version: 1;
  exportedAt: string;
  progress: Record<string, DeckProgress>;
  savedSessions: Record<string, SavedQuizSession>;
  prefs: UserPreferences;
}

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

export function loadSavedSessions(): Record<string, SavedQuizSession> {
  const sessions = safeReadJson<unknown>(ACTIVE_SESSIONS_KEY, {});
  if (!sessions || typeof sessions !== 'object' || Array.isArray(sessions)) {
    return {};
  }
  return sessions as Record<string, SavedQuizSession>;
}

export function saveQuizSession(session: SavedQuizSession): void {
  const all = loadSavedSessions();
  safeWriteJson(ACTIVE_SESSIONS_KEY, {
    ...all,
    [session.deckId]: session,
  });
}

export function clearQuizSession(deckId: string): void {
  const all = loadSavedSessions();
  if (!(deckId in all)) return;
  const next = { ...all };
  delete next[deckId];
  safeWriteJson(ACTIVE_SESSIONS_KEY, next);
}

export function exportProgressBackup(): string {
  const payload: ProgressBackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: loadProgress(),
    savedSessions: loadSavedSessions(),
    prefs: loadPreferences(),
  };
  return JSON.stringify(payload, null, 2);
}

export function importProgressBackup(raw: string): {
  progress: Record<string, DeckProgress>;
  savedSessions: Record<string, SavedQuizSession>;
  prefs: UserPreferences;
} {
  const parsed = JSON.parse(raw) as Partial<ProgressBackupPayload>;
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    parsed.version !== 1 ||
    !parsed.progress ||
    typeof parsed.progress !== 'object' ||
    Array.isArray(parsed.progress)
  ) {
    throw new Error('Invalid QuickReview backup file.');
  }

  const nextProgress = parsed.progress as Record<string, DeckProgress>;
  const nextSessions =
    parsed.savedSessions &&
    typeof parsed.savedSessions === 'object' &&
    !Array.isArray(parsed.savedSessions)
      ? (parsed.savedSessions as Record<string, SavedQuizSession>)
      : {};
  const nextPrefs: UserPreferences = {
    ...DEFAULT_PREFS,
    ...(parsed.prefs && typeof parsed.prefs === 'object' ? parsed.prefs : {}),
  };

  safeWriteJson(PROGRESS_KEY, nextProgress);
  safeWriteJson(ACTIVE_SESSIONS_KEY, nextSessions);
  safeWriteJson(PREFS_KEY, nextPrefs);

  return {
    progress: nextProgress,
    savedSessions: nextSessions,
    prefs: nextPrefs,
  };
}
