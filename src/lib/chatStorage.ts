import type { Conversation } from '@/types/chat';
import { migrateLegacyErrorMessage } from '@/lib/messageUtils';

const STORAGE_KEY = 'koshergpt-chats-v1';

export interface ChatPersistState {
  conversations: Conversation[];
  activeConvId: string | null;
}

function parseState(raw: unknown): ChatPersistState | null {
  if (!raw || typeof raw !== 'object') return null;
  const conversations = (raw as { conversations?: unknown }).conversations;
  const activeConvId = (raw as { activeConvId?: unknown }).activeConvId;
  if (!Array.isArray(conversations)) return null;
  if (typeof activeConvId !== 'string' && activeConvId != null) return null;
  return {
    conversations: (conversations as Conversation[]).map((conv) => ({
      ...conv,
      messages: conv.messages.map((m) => migrateLegacyErrorMessage(m)),
    })),
    activeConvId: typeof activeConvId === 'string' ? activeConvId : null,
  };
}

export function loadChatState(): ChatPersistState {
  if (typeof window === 'undefined') {
    return { conversations: [], activeConvId: null };
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return { conversations: [], activeConvId: null };
    const parsed = JSON.parse(stored) as unknown;
    return parseState(parsed) ?? { conversations: [], activeConvId: null };
  } catch {
    return { conversations: [], activeConvId: null };
  }
}

export function saveChatState(state: ChatPersistState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota or private browsing */
  }
}
