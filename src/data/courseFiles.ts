import type { CourseFile } from '../types/courseFile';

export const COURSE_FILES: CourseFile[] = [
  {
    id: 'arts-app-final-exam-pdf',
    course: 'Arts Appreciation',
    fileName: 'ART APPRECIATION REVIEWER - FINAL EXAMINATION.pdf',
    relativePath:
      'ARTS APP FILES/ART APPRECIATION REVIEWER - FINAL EXAMINATION.pdf',
    format: 'PDF',
    sizeLabel: '406 KB · 7 pages',
    summary:
      'Master final exam reviewer covering Nature/Assumptions/Functions of Art, Philosophers, Elements & Principles, GAMABA, Western & Asian Art, Indigenous Crafts, Soulmaking, Da Vincian Principles, Architecture, and Contemporary Philippine Art.',
    topics: [
      'Nature & Functions',
      'Philosophers',
      'Western & Asian Art',
      'Indigenous Crafts',
      'Soulmaking & Da Vincian',
      'Filipino Architecture',
      'Contemporary Art',
    ],
    linkedDeckIds: [
      'arts-app-s1-foundations',
      'arts-app-s2-elements-techniques',
      'arts-app-s4-western-asian-history',
      'arts-app-s5-indigenous-crafts',
      'arts-app-s6-soulmaking-architecture-contemporary',
    ],
  },
  {
    id: 'arts-app-midterm-docx',
    course: 'Arts Appreciation',
    fileName: 'midterm reviewer.docx',
    relativePath: 'ARTS APP FILES/midterm reviewer.docx',
    format: 'DOCX',
    sizeLabel: '19.5 MB',
    summary:
      'Comprehensive midterm study guide detailing Art Perspectives, Philippine & Bikolano Art Forms, Functions, Philosophies, Elements & Principles, Rule of Thirds, Artist vs. Artisan, GAMABA & National Artists, Production Process, Media & Techniques, and 14 Western Art Periods.',
    topics: [
      'Bikolano Arts',
      'Elements & Principles',
      'Rule of Thirds',
      'GAMABA & National Artists',
      'Production & Techniques',
      'Western Art History',
    ],
    linkedDeckIds: [
      'arts-app-s1-foundations',
      'arts-app-s2-elements-techniques',
      'arts-app-s3-ph-artists-gamaba',
      'arts-app-s4-western-asian-history',
    ],
  },
  {
    id: 'arts-app-asia-docx',
    course: 'Arts Appreciation',
    fileName: 'Art History of Asia Chinese, Japanese, and India\u2026.docx',
    relativePath:
      'ARTS APP FILES/Art History of Asia Chinese, Japanese, and India\u2026.docx',
    format: 'DOCX',
    sizeLabel: '1.9 MB',
    summary:
      'Survey of Chinese, Japanese, and Indian artistic traditions—philosophies (Confucianism, Daoism, Shinto, Zen, Hinduism, Buddhism, Islam), characteristics, key art forms, and iconic masterpieces.',
    topics: [
      'Chinese Art & Daoism',
      'Japanese Aesthetics & Ukiyo-e',
      'Indian Art & Architecture',
    ],
    linkedDeckIds: ['arts-app-s4-western-asian-history'],
  },
  {
    id: 'arts-app-indigenous-1-pdf',
    course: 'Arts Appreciation',
    fileName: 'Philippine Indigenous Arts and Traditional Crafts (1).pdf',
    relativePath:
      'ARTS APP FILES/Philippine Indigenous Arts and Traditional Crafts (1).pdf',
    format: 'PDF',
    sizeLabel: '54.7 MB · 55 slides',
    summary:
      'Visual slide deck covering Indigenous Motifs, step-by-step Warp Ikat process, T’nalak, Dagmay, Inaul, Pis Syabit, and traditional crafts (Basketry, Pottery, Woodcarving, Beadwork, Textile Weaving).',
    topics: [
      'Indigenous Motifs',
      'Warp Ikat Process',
      "T'nalak, Dagmay, Inaul, Pis Syabit",
      'Traditional Crafts',
    ],
    linkedDeckIds: ['arts-app-s5-indigenous-crafts'],
  },
  {
    id: 'arts-app-indigenous-2-pdf',
    course: 'Arts Appreciation',
    fileName: 'PHILIPPINE INDIGENOUS ARTS AND TRADITIONAL CRAFTS (2).pdf',
    relativePath:
      'ARTS APP FILES/PHILIPPINE INDIGENOUS ARTS AND TRADITIONAL CRAFTS (2).pdf',
    format: 'PDF',
    sizeLabel: '1.0 MB · 7 pages',
    summary:
      'Detailed reading material on characteristics of Philippine Indigenous Arts, visual features of motifs, textile comparison table, traditional crafts, and how elements & principles apply to crafts.',
    topics: [
      'Indigenous Characteristics',
      'Motif Symbolism',
      'Textile Comparison',
      'Craft Art Elements',
    ],
    linkedDeckIds: ['arts-app-s5-indigenous-crafts'],
  },
  {
    id: 'arts-app-contemporary-pdf',
    course: 'Arts Appreciation',
    fileName: 'CONTEMPORARY PHILIPPINE ARTS (1).pdf',
    relativePath: 'ARTS APP FILES/CONTEMPORARY PHILIPPINE ARTS (1).pdf',
    format: 'PDF',
    sizeLabel: '2.0 MB · 6 pages',
    summary:
      'Learning material examining Contemporary Philippine Art, Indigenous/Christian/Muslim art traditions, Maranao Okir/Ukkil motifs, Globalization & Technology, and the 4 steps of Art Criticism.',
    topics: [
      'Contemporary Art Forms',
      'Christian & Muslim Art',
      'Okir / Ukkil',
      'Globalization & Tech',
      '4-Step Art Criticism',
    ],
    linkedDeckIds: [
      'arts-app-s2-elements-techniques',
      'arts-app-s6-soulmaking-architecture-contemporary',
    ],
  },
];
