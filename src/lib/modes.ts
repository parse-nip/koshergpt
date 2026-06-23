import type { StudyMode } from '@/types/chat';

export const DEFAULT_STUDY_MODE: StudyMode = 'research';

export const STUDY_MODES: StudyMode[] = ['research', 'chavrusa'];

export const MODE_META: Record<
  StudyMode,
  {
    label: string;
    shortLabel: string;
    description: string;
    heroTagline: string;
    heroSubtitle: string;
    inputPlaceholder: string;
    typingMessage: string;
    sidebarTagline: string;
    newSessionLabel: string;
  }
> = {
  research: {
    label: 'Research',
    shortLabel: 'Research',
    description: 'Structured answers with summary, key points, and sourced citations.',
    heroTagline: 'Torah knowledge, sourced & verified',
    heroSubtitle: 'Ask about halacha, texts, and tradition — with citations you can follow.',
    inputPlaceholder: 'Ask about Torah, halacha, or Jewish texts…',
    typingMessage: 'Searching the sources…',
    sidebarTagline: 'scholarly research tool',
    newSessionLabel: 'New question',
  },
  chavrusa: {
    label: 'Chavrusa',
    shortLabel: 'Chavrusa',
    description: 'Learn together through dialogue, questions, and guided discovery.',
    heroTagline: 'Learn together, one sugya at a time',
    heroSubtitle: 'Bring a text, a question, or a hunch — your chavrusa will push you to think.',
    inputPlaceholder: 'Share your thought, answer, or question…',
    typingMessage: 'Thinking with you…',
    sidebarTagline: 'paired Torah learning',
    newSessionLabel: 'New chavrusa',
  },
};

export function normalizeStudyMode(value: unknown): StudyMode {
  return value === 'chavrusa' ? 'chavrusa' : 'research';
}
