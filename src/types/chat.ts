import type { ChatError } from '@/lib/chatErrors';

export type StudyMode = 'research' | 'chavrusa';

export interface Source {
  number: number;
  title: string;
  description: string;
  url: string;
}

export interface Message {
  role: 'user' | 'assistant';
  /** Full text stored for copying + model context */
  content: string;
  /** Optional short bubble text (reply threads store full quoting in content) */
  preview?: string;
  /** Present when the assistant turn failed — do not send to the model */
  error?: ChatError;
}

export interface ParsedResponse {
  summary: string;
  keyPoints: string[];
  inDepth: string;
  sources: Source[];
  followUps: string[];
  thinkAbout: string[];
  yourTurn: string;
  disclaimer: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  mode: StudyMode;
}
