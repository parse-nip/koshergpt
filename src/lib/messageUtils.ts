import type { Message } from '@/types/chat';
import type { ChatError } from '@/lib/chatErrors';

export const DEFAULT_EMPTY_ASSISTANT_REPLY =
  "I wasn't able to produce a usable answer right now — tap Retry below or send the question again with a bit more detail.";

const LEGACY_ERROR_PREFIX = 'Something went wrong while contacting the answer service.';

export function isErrorMessage(message: Message): boolean {
  return Boolean(message.error);
}

/** Upgrade persisted assistant blobs from before structured error handling. */
export function migrateLegacyErrorMessage(message: Message): Message {
  if (message.error || message.role !== 'assistant') return message;

  const text = message.content.trim();
  if (!text.startsWith(LEGACY_ERROR_PREFIX)) return message;

  const legacyError: ChatError = {
    code: 'unknown',
    title: 'Something went wrong',
    message: "We couldn't get an answer from the service.",
    hint: import.meta.env.DEV
      ? text.replace(LEGACY_ERROR_PREFIX, '').replace(/^\s*Details:\s*/i, '').trim() || undefined
      : 'Tap Try again to resend your question.',
    retryable: true,
  };

  return { ...message, content: '', error: legacyError };
}

export function sanitizeAssistantContent(raw: string): string {
  const t = raw.replace(/\u00a0/g, ' ').trim();
  if (t.length > 0) return raw;
  return DEFAULT_EMPTY_ASSISTANT_REPLY;
}

const HISTORY_CHAR_BUDGET = 42000;

export function trimMessagesForApi(messages: Message[]): Message[] {
  const eligible = messages.filter((m) => !m.error);
  if (eligible.length === 0) return eligible;

  let size = 0;
  const out: Message[] = [];

  for (let i = eligible.length - 1; i >= 0; i--) {
    const m = eligible[i];
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
