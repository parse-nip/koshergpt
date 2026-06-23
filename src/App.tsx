import { useState, useRef, useEffect, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';

import { Logo } from './components/Logo';
import { ChatInput } from './components/ChatInput';
import { StarterQuestions } from './components/StarterQuestions';
import { TypingIndicator } from './components/TypingIndicator';
import { ResponseDisplay } from './components/ResponseDisplay';
import { ErrorDisplay } from './components/ErrorDisplay';
import { Sidebar } from './components/Sidebar';
import { ModeSelector } from './components/ModeSelector';
import { IconMenu, IconCopy } from './components/icons';

import { streamChat } from './lib/api';
import { chatErrorToCopyText } from './lib/chatErrors';
import { loadChatState, saveChatState } from './lib/chatStorage';
import { DEFAULT_STUDY_MODE, MODE_META } from './lib/modes';

import type { Message, Conversation, StudyMode } from './types/chat';

import {
  clampSidebarWidth,
  loadSidebarWidth,
  saveSidebarWidth,
  SIDEBAR_WIDTH_DEFAULT,
  SIDEBAR_WIDTH_MIN,
} from '@/lib/sidebarLayout';

import {
  sanitizeAssistantContent,
  trimMessagesForApi,
  composeUserMessage,
  type ReplyTarget,
} from '@/lib/messageUtils';

function readInitialUiState(): {
  conversations: Conversation[];
  activeConvId: string | null;
} {
  const data = loadChatState();
  const activeValid =
    data.activeConvId && data.conversations.some((c) => c.id === data.activeConvId)
      ? data.activeConvId
      : null;

  return { conversations: data.conversations, activeConvId: activeValid };
}

const INITIAL_UI = readInitialUiState();

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function bubbleTextForUserMessage(msg: Message): string {
  const viaPreview = typeof msg.preview === 'string' && msg.preview.trim().length > 0;
  return viaPreview ? String(msg.preview) : msg.content;
}

function formatReplyBanner(reply: ReplyTarget, thread: Message[]): string | null {
  const m = thread[reply.index];
  if (!m || m.role !== reply.kind) return null;

  const raw = bubbleTextForUserMessage(m).replace(/\s+/g, ' ').trim();
  if (!raw) return null;

  const label =
    reply.kind === 'user' ? 'Earlier question:' : 'Earlier answer:';

  const excerpt = raw.length > 160 ? `${raw.slice(0, 157).trim()}…` : raw;
  return `${label} ${excerpt}`;
}

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => INITIAL_UI.conversations);
  const [activeConvId, setActiveConvId] = useState<string | null>(() => INITIAL_UI.activeConvId);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [sidebarWidthPx, setSidebarWidthPx] = useState(() => loadSidebarWidth());
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [defaultMode, setDefaultMode] = useState<StudyMode>(DEFAULT_STUDY_MODE);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const resizeDragRef = useRef({
    startPointerX: 0,
    startWidth: SIDEBAR_WIDTH_DEFAULT,
  });

  const activeConversation = conversations.find((c) => c.id === activeConvId) || null;
  const activeMode: StudyMode = activeConversation?.mode ?? defaultMode;
  const modeMeta = MODE_META[activeMode];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [streamingContent, activeConversation?.messages.length, scrollToBottom]);

  useEffect(() => {
    saveChatState({ conversations, activeConvId });
  }, [conversations, activeConvId]);

  useEffect(() => {
    saveSidebarWidth(sidebarWidthPx);
  }, [sidebarWidthPx]);

  useEffect(() => {
    function onResize() {
      setSidebarWidthPx((w) => clampSidebarWidth(w, window.innerWidth));
    }

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!isResizingSidebar) return;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingSidebar]);

  const beginSidebarResize = useCallback((clientX: number) => {
    resizeDragRef.current = { startPointerX: clientX, startWidth: sidebarWidthPx };
    setIsResizingSidebar(true);
  }, [sidebarWidthPx]);

  useEffect(() => {
    if (!isResizingSidebar) return;

    function onMove(e: PointerEvent) {
      const delta = e.clientX - resizeDragRef.current.startPointerX;
      const next = clampSidebarWidth(resizeDragRef.current.startWidth + delta, window.innerWidth);
      setSidebarWidthPx(next);
    }

    function onUp() {
      setIsResizingSidebar(false);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isResizingSidebar]);

  async function executeAssistant(
    convId: string,
    apiMessages: Message[],
    persistMessages: Message[],
    mode: StudyMode,
  ) {
    let fullResponse = '';

    try {
      setIsStreaming(true);
      setStreamingContent('');

      await streamChat(
        apiMessages,
        mode,
        (chunk) => {
          fullResponse += chunk;
          setStreamingContent(fullResponse);
        },
        () => {
          const sanitized = sanitizeAssistantContent(fullResponse);
          const assistantMessage: Message = { role: 'assistant', content: sanitized };

          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId ? { ...c, messages: [...persistMessages, assistantMessage] } : c,
            ),
          );
        },
        (error) => {
          const errorMessage: Message = {
            role: 'assistant',
            content: '',
            error,
          };

          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId ? { ...c, messages: [...persistMessages, errorMessage] } : c,
            ),
          );
        },
      );
    } finally {
      setStreamingContent('');
      setIsStreaming(false);
    }
  }

  function handleModeChange(nextMode: StudyMode) {
    if (isStreaming) return;

    if (activeConvId) {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? { ...c, mode: nextMode } : c)),
      );
      return;
    }

    setDefaultMode(nextMode);
  }

  function handleNewConversation() {
    setReplyTarget(null);
    setActiveConvId(null);
    setStreamingContent('');
    setSidebarOpen(false);
  }

  function handleSelectConversation(id: string) {
    setReplyTarget(null);
    setActiveConvId(id);
    setStreamingContent('');
    setSidebarOpen(false);
  }

  async function handleSendMessage(rawText: string) {
    const text = rawText.trim();
    if (!text || isStreaming) return;

    let convId = activeConvId;
    let msgs: Message[] = [];

    if (!convId) {
      convId = generateId();
      const title = text.length > 60 ? `${text.slice(0, 60)}…` : text;

      const newConv: Conversation = {
        id: convId,
        title,
        messages: [],
        mode: defaultMode,
      };

      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(convId);
    } else {
      msgs = activeConversation?.messages ? [...activeConversation.messages] : [];
    }

    const safeReply =
      replyTarget &&
      replyTarget.index >= 0 &&
      replyTarget.index < msgs.length &&
      msgs[replyTarget.index]?.role === replyTarget.kind
        ? replyTarget
        : null;

    const composedBody = composeUserMessage(safeReply, text, msgs);
    const userMessage: Message = {
      role: 'user',
      content: composedBody,
      preview: text,
    };

    const updatedMessages = [...msgs, userMessage];

    const nextTitles =
      msgs.length === 0
        ? text.length > 60
          ? `${text.slice(0, 60)}…`
          : text
        : undefined;

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;

        const nextConv: Conversation = { ...c, messages: updatedMessages };
        return nextTitles ? { ...nextConv, title: nextTitles } : nextConv;
      }),
    );

    setReplyTarget(null);

    await executeAssistant(convId, trimMessagesForApi(updatedMessages), updatedMessages, activeMode);
  }

  async function retryAssistantAnswer(assistantIndex: number) {
    const convId = activeConvId;
    if (!convId || isStreaming) return;

    const conv = conversations.find((c) => c.id === convId);
    if (!conv?.messages?.length) return;

    const trimmed = [...conv.messages];
    if (assistantIndex < 0 || assistantIndex >= trimmed.length) return;

    const target = trimmed[assistantIndex];
    if (target?.role !== 'assistant') return;

    const clipped = trimmed.slice(0, assistantIndex);
    const apiMessages = trimMessagesForApi(clipped);

    setReplyTarget(null);

    await executeAssistant(convId, apiMessages, clipped, conv.mode ?? DEFAULT_STUDY_MODE);
  }

  function handleCopyConversation() {
    if (!activeConversation) return;
    void navigator.clipboard.writeText(
      activeConversation.messages
        .map((m) => {
          if (m.error) {
            return `Error: ${chatErrorToCopyText(m.error)}`;
          }
          return `${m.role === 'user' ? 'Question' : 'Answer'}: ${m.content}`;
        })
        .join('\n\n---\n\n'),
    );
  }

  const showHero = activeConvId === null;

  const replyPreview =
    !showHero && replyTarget && activeConversation
      ? formatReplyBanner(replyTarget, activeConversation.messages)
      : null;

  const threadMessages = activeConversation?.messages ?? [];

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden min-h-0 shrink-0 overflow-hidden lg:flex" style={{ width: sidebarWidthPx }}>
        <Sidebar
          conversations={conversations}
          activeId={activeConvId}
          mode={activeMode}
          onSelect={handleSelectConversation}
          onNew={handleNewConversation}
        />
      </div>

      {/* Draggable splitter (desktop) */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar width"
        aria-valuemin={SIDEBAR_WIDTH_MIN}
        aria-valuemax={560}
        aria-valuenow={sidebarWidthPx}
        className={`relative hidden h-full w-2 shrink-0 select-none touch-none lg:flex lg:cursor-col-resize lg:flex-col lg:items-center lg:justify-center lg:bg-transparent ${
          isResizingSidebar ? 'lg:bg-gold-muted/60' : 'lg:hover:bg-gold-muted/40'
        }`}
        onPointerDown={(e) => {
          if (e.button !== 0 && e.button !== undefined) return;
          e.preventDefault();
          beginSidebarResize(e.clientX);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onDoubleClick={() => setSidebarWidthPx(clampSidebarWidth(SIDEBAR_WIDTH_DEFAULT, window.innerWidth))}
      >
        <span className="pointer-events-none h-[calc(100%-3rem)] w-px max-w-[1px] rounded-full bg-parchment-dark/70" aria-hidden />
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="w-[min(18rem,100vw)] max-w-[18rem] gap-0 border-parchment-dark p-0 lg:hidden [&>button]:hidden"
        >
          <Sidebar
            conversations={conversations}
            activeId={activeConvId}
            mode={activeMode}
            onSelect={handleSelectConversation}
            onNew={handleNewConversation}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="paper-surface flex shrink-0 items-center justify-between border-b border-parchment-dark px-4 py-2.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            className="rounded-md lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <IconMenu className="h-5 w-5 text-ink/50" />
          </Button>

          <div className="hidden items-center gap-3 lg:flex">
            <ModeSelector mode={activeMode} onChange={handleModeChange} disabled={isStreaming} />
          </div>
          <Logo size="small" />

          <div className="flex items-center gap-1">
            <div className="lg:hidden">
              <ModeSelector
                mode={activeMode}
                onChange={handleModeChange}
                disabled={isStreaming}
                compact
              />
            </div>
            {activeConversation ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-md"
              title="Copy conversation"
              aria-label="Copy conversation"
              onClick={() => handleCopyConversation()}
            >
              <IconCopy className="h-4 w-4 text-ink/40" />
            </Button>
            ) : (
              <div className="w-9" />
            )}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto max-w-chat">
            {showHero ? (
              <div className="flex min-h-[55vh] flex-col items-center justify-center">
                <Logo size="large" mode={activeMode} />
                <div className="mt-6">
                  <ModeSelector mode={activeMode} onChange={handleModeChange} disabled={isStreaming} />
                </div>
                <p className="mt-3 max-w-md text-center font-body text-xs leading-relaxed text-ink/40">
                  {modeMeta.description}
                </p>
                <StarterQuestions mode={activeMode} onSelect={(q) => void handleSendMessage(q)} />
              </div>
            ) : (
              <div className="space-y-8">
                {threadMessages.map((msg, i) => {
                  const bubbleKey =
                    `${activeConvId ?? 'anon'}-${i}-${msg.role}-${msg.preview ?? msg.content.slice(0, 16)}`;

                  if (msg.role === 'user') {
                    const shown = bubbleTextForUserMessage(msg);
                    return (
                      <div key={bubbleKey} className="space-y-1.5">
                        <div className="flex justify-end">
                          <div className="user-bubble">
                            <div className="whitespace-pre-wrap">{shown}</div>
                          </div>
                        </div>

                        {!isStreaming ? (
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-auto px-2 py-0.5 font-body text-xs text-ink/35 shadow-none hover:bg-accent/70 hover:text-ink/70"
                              onClick={() => setReplyTarget({ kind: 'user', index: i })}
                            >
                              Reply to this
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    );
                  }

                  return (
                    <div key={bubbleKey}>
                      <div className={msg.error ? 'answer-block border-warning-text/15 bg-warning-bg/20' : 'answer-block'}>
                        {msg.error ? (
                          <ErrorDisplay
                            error={msg.error}
                            onRetry={() => void retryAssistantAnswer(i)}
                            onReply={() => setReplyTarget({ kind: 'assistant', index: i })}
                          />
                        ) : (
                          <ResponseDisplay
                            content={msg.content}
                            isStreaming={false}
                            mode={activeMode}
                            onFollowUp={(question) => void handleSendMessage(question)}
                            onReply={() => setReplyTarget({ kind: 'assistant', index: i })}
                            onRetry={() => void retryAssistantAnswer(i)}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

                {isStreaming && streamingContent ? (
                  <div className="answer-block">
                    <ResponseDisplay
                      content={streamingContent}
                      isStreaming={true}
                      mode={activeMode}
                    />
                  </div>
                ) : null}

                {isStreaming && !streamingContent ? <TypingIndicator mode={activeMode} /> : null}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <div className="paper-surface shrink-0 border-t border-parchment-dark px-4 py-3 sm:px-6 sm:py-4">
          <div className="mx-auto max-w-chat">
            <ChatInput
              onSubmit={(draft) => void handleSendMessage(draft)}
              disabled={isStreaming}
              placeholder={modeMeta.inputPlaceholder}
              replyPreview={replyPreview}
              onClearReply={() => setReplyTarget(null)}
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-parchment-dark bg-parchment px-4 py-2.5 sm:px-6">
          <p className="mx-auto max-w-chat text-center font-body text-[11px] leading-relaxed text-ink/35">
            KosherGPT is an AI research tool for learning and exploration. It does not replace the psak (ruling) of a
            qualified rabbi. Always consult your Local Orthodox Rabbi (LOR) for practical halachic decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
