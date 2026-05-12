export interface Source {
  number: number;
  title: string;
  description: string;
  url: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
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
