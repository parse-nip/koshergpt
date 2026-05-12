/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Full HTTPS URL of your chat proxy (e.g. Cloudflare Worker). */
  readonly VITE_CHAT_API_URL?: string;
  /** Bearer token sent with `Authorization` to `VITE_CHAT_API_URL`. */
  readonly VITE_CHAT_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
