type Json = Record<string, unknown>;

function concatContentParts(parts: unknown): string {
  if (!Array.isArray(parts)) return '';
  let out = '';
  for (const part of parts) {
    if (!part || typeof part !== 'object') continue;
    const p = part as Json;
    const text = typeof p.text === 'string' ? p.text : undefined;
    const content =
      typeof p.content === 'string'
        ? p.content
        : p.content &&
            typeof p.content === 'object' &&
            typeof (p.content as Json).text === 'string'
          ? String((p.content as Json).text)
          : undefined;
    if (text) out += text;
    else if (content) out += content;
  }
  return out;
}

/**
 * Normalize OpenRouter / OpenAI chat completion stream chunks coming over SSE JSON lines.
 */
export function extractAssistantDelta(parsed: unknown): string {
  if (!parsed || typeof parsed !== 'object') return '';

  const root = parsed as Json;
  const choices = root.choices;
  if (!Array.isArray(choices) || choices.length === 0) return '';

  const first = choices[0];
  if (!first || typeof first !== 'object') return '';

  const choice = first as Json;
  const delta = choice.delta;

  if (delta && typeof delta === 'object') {
    const d = delta as Json;

    const c = d.content;
    if (typeof c === 'string') return c;
    if (Array.isArray(c)) return concatContentParts(c);

    if (typeof d.text === 'string') return d.text;
  }

  const message = choice.message;
  if (message && typeof message === 'object') {
    const msg = message as Json;
    if (typeof msg.content === 'string') return msg.content;
    if (Array.isArray(msg.content)) return concatContentParts(msg.content);
  }

  return '';
}
