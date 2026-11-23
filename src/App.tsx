import { useCallback, useEffect, useMemo, useState } from 'react';
import { CramSheet } from './components/CramSheet';
import { DeckList, type DeckEntry } from './components/DeckList';
import { FilesView } from './components/FilesView';
import { FlashcardSession } from './components/FlashcardSession';
import { Navbar, type AppTab } from './components/Navbar';
import { QuizSession } from './components/QuizSession';
import { COURSE_FILES } from './data/courseFiles';
import { getBuiltInDecks } from './data/loadDecks';
import type { DeckProgress, QuizDeck, UserPreferences } from './types/quiz';
import {
  clearQuizSession,
  deleteCustomDeck,
  importProgressBackup,
  loadCustomDecks,
  loadPreferences,
  loadProgress,
  loadSavedSessions,
  saveCustomDeck,
  saveDeckResult,
  savePreferences,
  type SavedQuizSession,
} from './utils/storage';

type ActiveView = 'dashboard' | 'quiz' | 'flashcards' | 'cram';

export function App() {
  const [builtInDecks] = useState<QuizDeck[]>(() => getBuiltInDecks());
  const [customDecks, setCustomDecks] = useState<QuizDeck[]>(() => loadCustomDecks());
  const [progress, setProgress] = useState<Record<string, DeckProgress>>(() =>
    loadProgress(),
  );
  const [savedSessions, setSavedSessions] = useState<
    Record<string, SavedQuizSession>
  >(() => loadSavedSessions());
  const [prefs, setPrefs] = useState<UserPreferences>(() => loadPreferences());

  const [activeTab, setActiveTab] = useState<AppTab>('reviewers');
  const [view, setView] = useState<ActiveView>('dashboard');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [missedOnlyMode, setMissedOnlyMode] = useState(false);
  const [examMode, setExamMode] = useState(false);
  const [activeSavedSession, setActiveSavedSession] =
    useState<SavedQuizSession | null>(null);
  const [sessionNonce, setSessionNonce] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', prefs.darkMode);
  }, [prefs.darkMode]);

  const refreshSavedSessions = useCallback(() => {
    setSavedSessions(loadSavedSessions());
  }, []);

  const deckEntries = useMemo<DeckEntry[]>(() => {
    const builtInIds = new Set(builtInDecks.map((d) => d.id));
    const customEntries: DeckEntry[] = customDecks
      .filter((d) => !builtInIds.has(d.id))
      .map((deck) => ({ deck, isCustom: true }));
    const builtInEntries: DeckEntry[] = builtInDecks.map((deck) => ({
      deck,
      isCustom: false,
    }));
    return [...customEntries, ...builtInEntries];
  }, [builtInDecks, customDecks]);

  const activeDeck = useMemo(
    () => deckEntries.find((e) => e.deck.id === selectedDeckId)?.deck ?? null,
    [deckEntries, selectedDeckId],
  );

  const handleUpdatePrefs = useCallback((next: UserPreferences) => {
    setPrefs(next);
    savePreferences(next);
  }, []);

  const handleGoHome = useCallback(() => {
    setView('dashboard');
    setMissedOnlyMode(false);
    setExamMode(false);
    setActiveSavedSession(null);
    refreshSavedSessions();
  }, [refreshSavedSessions]);

  const handleStartQuiz = useCallback(
    (deck: QuizDeck, missedOnly = false, isExamMode = false) => {
      clearQuizSession(deck.id);
      refreshSavedSessions();
      setSelectedDeckId(deck.id);
      setMissedOnlyMode(missedOnly);
      setExamMode(isExamMode);
      setActiveSavedSession(null);
      setSessionNonce((n) => n + 1);
      setView('quiz');
    },
    [refreshSavedSessions],
  );

  const handleResumeQuiz = useCallback(
    (deck: QuizDeck, saved: SavedQuizSession) => {
      setSelectedDeckId(deck.id);
      setMissedOnlyMode(saved.missedOnly);
      setExamMode(saved.examMode);
      setActiveSavedSession(saved);
      setSessionNonce((n) => n + 1);
      setView('quiz');
    },
    [],
  );

  const handleStartFlashcards = useCallback((deck: QuizDeck) => {
    setSelectedDeckId(deck.id);
    setMissedOnlyMode(false);
    setExamMode(false);
    setActiveSavedSession(null);
    setView('flashcards');
  }, []);

  const handleOpenCram = useCallback((deck: QuizDeck) => {
    setSelectedDeckId(deck.id);
    setMissedOnlyMode(false);
    setExamMode(false);
    setActiveSavedSession(null);
    setView('cram');
  }, []);

  const handleCompleteQuiz = useCallback(
    (scorePercent: number, missedIds: string[]) => {
      if (!selectedDeckId) return;
      const nextProgress = saveDeckResult(selectedDeckId, scorePercent, missedIds);
      setProgress(nextProgress);
    },
    [selectedDeckId],
  );

  const handleImportDeck = useCallback((deck: QuizDeck) => {
    setCustomDecks(saveCustomDeck(deck));
  }, []);

  const handleDeleteCustomDeck = useCallback((deckId: string) => {
    setCustomDecks(deleteCustomDeck(deckId));
  }, []);

  const handleRestoreBackup = useCallback((raw: string) => {
    try {
      const restored = importProgressBackup(raw);
      setProgress(restored.progress);
      setSavedSessions(restored.savedSessions);
      setPrefs(restored.prefs);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error ? err.message : 'Invalid QuickReview backup file.',
      };
    }
  }, []);

  const activeMissedIds = activeDeck
    ? progress[activeDeck.id]?.missedQuestionIds ?? []
    : [];

  const quizQuestions = useMemo(() => {
    if (!activeDeck) return [];
    if (!missedOnlyMode) return activeDeck.questions;
    const missedSet = new Set(activeMissedIds);
    const filtered = activeDeck.questions.filter((q) => missedSet.has(q.id));
    return filtered.length > 0 ? filtered : activeDeck.questions;
  }, [activeDeck, activeMissedIds, missedOnlyMode]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar
        darkMode={prefs.darkMode}
        inSession={view !== 'dashboard'}
        sessionTitle={activeDeck?.title}
        activeTab={activeTab}
        reviewerCount={deckEntries.length}
        fileCount={COURSE_FILES.length}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          handleGoHome();
        }}
        onToggleDark={() =>
          handleUpdatePrefs({ ...prefs, darkMode: !prefs.darkMode })
        }
        onGoHome={handleGoHome}
      />

      <main className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-8">
        {view === 'dashboard' || !activeDeck ? (
          activeTab === 'files' ? (
            <FilesView
              files={COURSE_FILES}
              decks={deckEntries.map((e) => e.deck)}
              onStartQuiz={(deck) => handleStartQuiz(deck, false, false)}
            />
          ) : (
            <DeckList
              entries={deckEntries}
              progress={progress}
              savedSessions={savedSessions}
              onStartQuiz={handleStartQuiz}
              onResumeQuiz={handleResumeQuiz}
              onStartFlashcards={handleStartFlashcards}
              onOpenCram={handleOpenCram}
              onImportDeck={handleImportDeck}
              onDeleteCustomDeck={handleDeleteCustomDeck}
              onRestoreBackup={handleRestoreBackup}
            />
          )
        ) : view === 'quiz' ? (
          <QuizSession
            key={`${activeDeck.id}-${sessionNonce}`}
            deck={activeDeck}
            questions={quizQuestions}
            prefs={prefs}
            examMode={examMode}
            missedOnly={missedOnlyMode}
            savedSession={activeSavedSession}
            onUpdatePrefs={handleUpdatePrefs}
            onComplete={handleCompleteQuiz}
            onSavedSessionsChange={refreshSavedSessions}
            onExit={handleGoHome}
          />
        ) : view === 'flashcards' ? (
          <FlashcardSession
            key={activeDeck.id}
            deck={activeDeck}
            onExit={handleGoHome}
          />
        ) : (
          <CramSheet
            key={activeDeck.id}
            deck={activeDeck}
            missedIds={activeMissedIds}
            onStartQuiz={(missedOnly) =>
              handleStartQuiz(activeDeck, missedOnly, false)
            }
            onExit={handleGoHome}
          />
        )}
      </main>
    </div>
  );
}

export default App;
