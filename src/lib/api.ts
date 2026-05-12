import type { Message } from '../types/chat';

const API_URL = import.meta.env.VITE_CHAT_API_URL ?? '';
const API_BEARER = import.meta.env.VITE_CHAT_API_KEY ?? '';

export async function streamChat(
  messages: Message[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void
) {
  try {
    if (!API_URL) {
      onError('Missing VITE_CHAT_API_URL (HTTPS URL of your chat proxy)');
      return;
    }
    if (!API_BEARER) {
      onError('Missing VITE_CHAT_API_KEY');
      return;
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_BEARER}`,
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
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch {
            // skip malformed JSON lines
          }
        }
      }
    }

    onDone();
  } catch (error) {
    onError(String(error));
  }
}
