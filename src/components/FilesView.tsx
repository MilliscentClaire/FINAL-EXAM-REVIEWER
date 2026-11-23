import { useMemo, useState } from 'react';
import { ExternalLink, FileText, Play, Search } from 'lucide-react';
import type { CourseFile } from '../types/courseFile';
import type { QuizDeck } from '../types/quiz';

interface FilesViewProps {
  files: CourseFile[];
  decks: QuizDeck[];
  onStartQuiz: (deck: QuizDeck) => void;
}

const GITHUB_REPO_BASE =
  'https://github.com/MilliscentClaire/FINAL-EXAM-REVIEWER';

function buildFileUrl(relativePath: string, format: 'PDF' | 'DOCX'): string {
  const encodedSegments = relativePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  if (import.meta.env.DEV) {
    return `/course-files/${encodedSegments}`;
  }

  const mode = format === 'PDF' ? 'blob' : 'raw';
  return `${GITHUB_REPO_BASE}/${mode}/main/docs/reviewer%20files/${encodedSegments}`;
}

export function FilesView({ files, decks, onStartQuiz }: FilesViewProps) {
  const [query, setQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('All');

  const courses = useMemo(() => {
    const unique = new Set<string>();
    for (const f of files) unique.add(f.course);
    return ['All', ...Array.from(unique)];
  }, [files]);

  const deckMap = useMemo(() => {
    const map = new Map<string, QuizDeck>();
    for (const d of decks) map.set(d.id, d);
    return map;
  }, [decks]);

  const filteredFiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return files.filter((f) => {
      if (selectedCourse !== 'All' && f.course !== selectedCourse) return false;
      if (!q) return true;
      return (
        f.fileName.toLowerCase().includes(q) ||
        f.summary.toLowerCase().includes(q) ||
        f.topics.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [files, query, selectedCourse]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-100">
            Course Source Files
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500 sm:mt-1 sm:text-sm dark:text-zinc-400">
            Original documents from <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">docs/reviewer files/</code> linked to their categorized quiz sections.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files or topics..."
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

      <div className="grid gap-4">
        {filteredFiles.map((file) => {
          const linkedDecks = file.linkedDeckIds
            .map((id) => deckMap.get(id))
            .filter((d): d is QuizDeck => Boolean(d));

          return (
            <div
              key={file.id}
              className="min-w-0 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs transition hover:border-zinc-300 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        file.format === 'PDF'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                      }`}
                    >
                      {file.format}
                    </span>
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                      {file.course}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {file.sizeLabel}
                    </span>
                  </div>

                  <h2 className="mt-2 flex items-center gap-2 text-sm font-semibold break-all text-zinc-900 sm:text-base sm:break-words dark:text-zinc-100">
                    <FileText className="h-4 w-4 shrink-0 text-zinc-400" />
                    <span>{file.fileName}</span>
                  </h2>

                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {file.summary}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {file.topics.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <a
                  href={buildFileUrl(file.relativePath, file.format)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>{file.format === 'PDF' ? 'Open PDF' : 'Download DOCX'}</span>
                </a>
              </div>

              {linkedDecks.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                    Covered in:
                  </span>
                  {linkedDecks.map((deck) => (
                    <button
                      key={deck.id}
                      type="button"
                      onClick={() => onStartQuiz(deck)}
                      className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50/70 px-2.5 py-1 text-[11px] font-medium text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900/70 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-950"
                    >
                      <Play className="h-3 w-3" />
                      <span>
                        {deck.sectionLabel ? `${deck.sectionLabel}: ` : ''}
                        {deck.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filteredFiles.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
            No matching source files found.
          </div>
        )}
      </div>
    </div>
  );
}
