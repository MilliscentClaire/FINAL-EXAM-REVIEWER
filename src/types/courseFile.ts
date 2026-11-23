export interface CourseFile {
  id: string;
  course: string;
  fileName: string;
  relativePath: string;
  format: 'PDF' | 'DOCX';
  sizeLabel: string;
  summary: string;
  topics: string[];
  linkedDeckIds: string[];
}
