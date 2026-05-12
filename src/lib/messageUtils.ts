import type { Message } from '@/types/chat';

export const DEFAULT_EMPTY_ASSISTANT_REPLY =
  "I wasn't able to produce a usable answer right now — tap Retry below or send the question again with a bit more detail.";

export function sanitizeAssistantContent(raw: string): string {
  const t = raw.replace(/\u00a0/g, ' ').trim();
  if (t.length > 0) return raw;
  return DEFAULT_EMPTY_ASSISTANT_REPLY;
}

const HISTORY_CHAR_BUDGET = 42000;

export function trimMessagesForApi(messages: Message[]): Message[] {
  if (messages.length === 0) return messages;

  let size = 0;
  const out: Message[] = [];

  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    const slice = `${m.role}:${m.content}`;
    const add = slice.length + 8;
    if (size + add > HISTORY_CHAR_BUDGET && out.length > 0) break;
    out.push(m);
    size += add;
  }

  return out.reverse();
}

export type ReplyTarget = { kind: 'user' | 'assistant'; index: number };

export function composeUserMessage(reply: ReplyTarget | null, draft: string, thread: Message[]): string {
  const trimmed = draft.trim();
  if (!reply) return trimmed;

  const cited = thread[reply.index];
  const body = cited?.content ?? '';
  const excerpt =
    body.length > 900
      ? `${body.slice(0, 897).trimEnd()}…`
      : body;

  const roleLabel =
    reply.kind === 'user'
      ? 'my earlier question in this thread'
      : 'your earlier assistant reply in this thread';

  return `[Thread reply — quoting ${roleLabel}]\n<<<\n${excerpt}\n>>>\n\nFollow-up:\n${trimmed}`;
}
