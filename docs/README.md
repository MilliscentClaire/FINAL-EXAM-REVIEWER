# Study Documents (`docs/`)

Drop your study materials here (PDF, DOCX, PPTX, TXT, MD, or notes), then ask the assistant to generate quiz reviewers from them.

## How reviewers are stored
Each generated reviewer is saved as a standalone JSON file in `src/data/decks/`:
- The app automatically discovers every `.json` file inside `src/data/decks/` — no manual imports or registry edits needed.
- Each deck supports `multiple-choice`, `true-false`, and `identification` questions with optional `explanation`, `topic`, and `acceptedAnswers` fields.
