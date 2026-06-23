export type ChatErrorCode =
  | 'network'
  | 'offline'
  | 'unauthorized'
  | 'not_found'
  | 'rate_limit'
  | 'server'
  | 'stream'
  | 'empty_response'
  | 'unknown';

export interface ChatError {
  code: ChatErrorCode;
  title: string;
  message: string;
  retryable: boolean;
  hint?: string;
}

function isLikelyOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function tryParseJson(body: string): { error?: string; details?: string } | null {
  try {
    const parsed: unknown = JSON.parse(body);
    if (parsed && typeof parsed === 'object') {
      return parsed as { error?: string; details?: string };
    }
  } catch {
    /* not json */
  }
  return null;
}

export function chatErrorFromNetworkFailure(cause: unknown): ChatError {
  if (isLikelyOffline()) {
    return {
      code: 'offline',
      title: "You're offline",
      message: "We couldn't reach KosherGPT because your device appears to be offline.",
      hint: 'Check your connection and try again.',
      retryable: true,
    };
  }

  const raw = cause instanceof Error ? cause.message : String(cause);
  const isFetchFailure =
    cause instanceof TypeError ||
    /failed to fetch|networkerror|load failed/i.test(raw);

  if (isFetchFailure) {
    return {
      code: 'network',
      title: "Couldn't connect",
      message: import.meta.env.DEV
        ? "The chat API isn't reachable from the dev server. Try `npm run pages:dev` to run the API locally."
        : "We couldn't reach the answer service. This is usually temporary.",
      hint: import.meta.env.DEV
        ? 'Vite serves the frontend only — the `/api/chat` route needs Cloudflare Pages Functions.'
        : 'Check your connection, then tap Retry.',
      retryable: true,
    };
  }

  return {
    code: 'unknown',
    title: 'Something went wrong',
    message: 'An unexpected error occurred while contacting the answer service.',
    hint: import.meta.env.DEV ? raw : undefined,
    retryable: true,
  };
}

export function chatErrorFromHttpFailure(status: number, body: string): ChatError {
  const parsed = tryParseJson(body);
  const serverMessage = parsed?.error?.trim();

  if (status === 401) {
    return {
      code: 'unauthorized',
      title: 'Not authorized',
      message: 'This session is not authorized to use the answer service.',
      hint: import.meta.env.DEV
        ? 'If CHAT_API_KEY is set on the server, send a matching Bearer token from the client.'
        : 'Please refresh the page and try again.',
      retryable: false,
    };
  }

  if (status === 429) {
    return {
      code: 'rate_limit',
      title: 'Too many requests',
      message: 'The answer service is receiving a lot of traffic right now.',
      hint: 'Wait a moment, then try again.',
      retryable: true,
    };
  }

  if (status === 404) {
    return {
      code: 'not_found',
      title: "Answer service unavailable",
      message: import.meta.env.DEV
        ? "The `/api/chat` endpoint wasn't found on this dev server."
        : "We couldn't find the answer service.",
      hint: import.meta.env.DEV
        ? 'Run `npm run pages:dev` instead of `npm run dev` to include the API.'
        : 'Please try again in a moment.',
      retryable: true,
    };
  }

  if (status >= 500) {
    return {
      code: 'server',
      title: 'Service temporarily unavailable',
      message:
        serverMessage === 'Server misconfiguration'
          ? 'The answer service is not configured correctly on the server.'
          : 'The answer service hit a snag. Your question was not lost — you can retry.',
      hint: import.meta.env.DEV && parsed?.details ? parsed.details.slice(0, 240) : undefined,
      retryable: true,
    };
  }

  if (status >= 400) {
    return {
      code: 'unknown',
      title: "Couldn't process your question",
      message: serverMessage || 'The server rejected the request.',
      hint: import.meta.env.DEV && parsed?.details ? parsed.details.slice(0, 240) : undefined,
      retryable: status !== 400,
    };
  }

  return {
    code: 'unknown',
    title: 'Something went wrong',
    message: serverMessage || 'The answer service returned an unexpected response.',
    retryable: true,
  };
}

export function chatErrorNoStream(): ChatError {
  return {
    code: 'stream',
    title: 'No response received',
    message: "The answer service connected but didn't send a readable response.",
    hint: 'Try again — if this keeps happening, the service may be under maintenance.',
    retryable: true,
  };
}

export function chatErrorToCopyText(error: ChatError): string {
  const parts = [`[Error: ${error.title}]`, error.message];
  if (error.hint) parts.push(error.hint);
  return parts.join('\n\n');
}
