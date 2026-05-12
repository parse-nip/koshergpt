import type { Message } from '../types/chat';

import { extractAssistantDelta } from './extractOpenAIStreamDelta';

/** Override if your OpenRouter proxy is on another origin. Default `/api/chat` matches Cloudflare Pages Functions. */
const API_URL = import.meta.env.VITE_CHAT_API_URL?.trim() || '/api/chat';
const API_BEARER = import.meta.env.VITE_CHAT_API_KEY?.trim() ?? '';

export async function streamChat(
  messages: Message[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(API_BEARER ? { Authorization: `Bearer ${API_BEARER}` } : {}),
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const err = await response.text();
      onError(`API error: ${err}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError('No response stream available');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const rawLines = buffer.split('\n');
      buffer = rawLines.pop() || '';

      for (const raw of rawLines) {
        let line = raw.trimEnd();

        while (line.startsWith(':')) {
          const chop = line.indexOf('\n');
          if (chop === -1) {
            line = '';
            break;
          }
          line = line.slice(chop + 1).trimStart();
        }

        line = line.trimEnd();
        if (!line.startsWith('data:')) continue;

        const data = line.slice('data:'.length).trimStart();
        if (data === '') continue;

        if (data === '[DONE]') {
          onDone();
          return;
        }

        try {
          const parsed: unknown = JSON.parse(data);
          const chunk = extractAssistantDelta(parsed);
          if (chunk) onChunk(chunk);
        } catch {
          /* ignore partial json */
        }
      }
    }

    onDone();
  } catch (error) {
    onError(String(error));
  }
}
