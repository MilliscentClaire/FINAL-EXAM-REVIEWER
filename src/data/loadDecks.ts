import type { QuizDeck, QuizQuestion } from '../types/quiz';

const deckModules = import.meta.glob<{ default: QuizDeck }>('./decks/**/*.json', {
  eager: true,
});

function isValidDeck(value: unknown): value is QuizDeck {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<QuizDeck>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.subject === 'string' &&
    Array.isArray(candidate.questions)
  );
}

function slugifyCourse(course: string): string {
  return course
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Auto-discovers all built-in JSON decks under `src/data/decks/` and synthesizes a Comprehensive Exam deck per course. */
export function getBuiltInDecks(): QuizDeck[] {
  const rawDecks: QuizDeck[] = [];

  for (const mod of Object.values(deckModules)) {
    if (mod?.default && isValidDeck(mod.default)) {
      rawDecks.push(mod.default);
    }
  }

  const byCourse = new Map<string, QuizDeck[]>();
  for (const deck of rawDecks) {
    const courseName = deck.course?.trim() || deck.subject.trim();
    const list = byCourse.get(courseName) ?? [];
    list.push(deck);
    byCourse.set(courseName, list);
  }

  const comprehensiveDecks: QuizDeck[] = [];
  for (const [courseName, courseDecks] of byCourse.entries()) {
    const sectionDecks = courseDecks
      .filter((d) => !d.isComprehensive)
      .sort((a, b) => (a.sectionOrder ?? 999) - (b.sectionOrder ?? 999));

    if (sectionDecks.length >= 2) {
      const combinedQuestions: QuizQuestion[] = sectionDecks.flatMap((d) =>
        d.questions.map((q) => ({
          ...q,
          topic: q.topic ?? d.sectionLabel ?? d.title,
        })),
      );

      comprehensiveDecks.push({
        id: `${slugifyCourse(courseName)}-comprehensive`,
        course: courseName,
        sectionOrder: 0,
        sectionLabel: 'Comprehensive Exam',
        isComprehensive: true,
        title: `${courseName} — Comprehensive Final Exam`,
        subject: courseName,
        description: `Full exam simulation combining all ${sectionDecks.length} main topic sections (${combinedQuestions.length} multiple-choice questions) across every source document.`,
        sourceFile: `All ${sectionDecks.length} sections`,
        createdAt: '2026-11-23',
        questions: combinedQuestions,
      });
    }
  }

  return [...comprehensiveDecks, ...rawDecks].sort((a, b) => {
    const courseA = a.course ?? a.subject;
    const courseB = b.course ?? b.subject;
    const courseCmp = courseA.localeCompare(courseB, undefined, {
      sensitivity: 'base',
    });
    if (courseCmp !== 0) return courseCmp;

    const compDiff = Number(Boolean(b.isComprehensive)) - Number(Boolean(a.isComprehensive));
    if (compDiff !== 0) return compDiff;

    const orderDiff = (a.sectionOrder ?? 999) - (b.sectionOrder ?? 999);
    if (orderDiff !== 0) return orderDiff;

    return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  });
}
