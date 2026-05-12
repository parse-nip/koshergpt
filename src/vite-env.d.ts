/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * OpenRouter proxy URL (same OpenAI-compatible streaming API as before).
   * Leave unset to use same-origin `/api/chat` (recommended on Cloudflare Pages).
   */
  readonly VITE_CHAT_API_URL?: string;
  /** If Cloudflare worker env `CHAT_API_KEY` is set, paste the same value here. */
  readonly VITE_CHAT_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
