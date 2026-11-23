export type QuestionType = 'multiple-choice' | 'true-false' | 'identification';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  answer: string;
  acceptedAnswers?: string[];
  explanation?: string;
  topic?: string;
}

export interface QuizDeck {
  id: string;
  course?: string;
  sectionOrder?: number;
  sectionLabel?: string;
  isComprehensive?: boolean;
  title: string;
  subject: string;
  description?: string;
  sourceFile?: string;
  createdAt?: string;
  questions: QuizQuestion[];
}

export interface DeckProgress {
  deckId: string;
  bestScore: number;
  lastScore: number;
  attempts: number;
  missedQuestionIds: string[];
  lastStudiedAt: string;
}

export interface UserPreferences {
  darkMode: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  instantFeedback: boolean;
}
