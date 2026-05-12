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
}

export interface ParsedResponse {
  summary: string;
  inDepth: string;
  sources: Source[];
  followUps: string[];
  disclaimer: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}
