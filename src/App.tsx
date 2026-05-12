import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Logo } from './components/Logo';
import { ChatInput } from './components/ChatInput';
import { StarterQuestions } from './components/StarterQuestions';
import { TypingIndicator } from './components/TypingIndicator';
import { ResponseDisplay } from './components/ResponseDisplay';
import { Sidebar } from './components/Sidebar';
import { IconMenu, IconCopy } from './components/icons';
import { streamChat } from './lib/api';
import { loadChatState, saveChatState } from './lib/chatStorage';
import type { Message, Conversation } from './types/chat';

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
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => INITIAL_UI.conversations);
  const [activeConvId, setActiveConvId] = useState<string | null>(() => INITIAL_UI.activeConvId);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConvId) || null;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [streamingContent, activeConversation?.messages.length, scrollToBottom]);

  useEffect(() => {
    saveChatState({ conversations, activeConvId });
  }, [conversations, activeConvId]);

  function handleNewConversation() {
    setActiveConvId(null);
    setStreamingContent('');
    setSidebarOpen(false);
  }

  function handleSelectConversation(id: string) {
    setActiveConvId(id);
    setStreamingContent('');
    setSidebarOpen(false);
  }

  async function handleSendMessage(text: string) {
    let convId = activeConvId;
    let messages: Message[] = [];

    if (!convId) {
      convId = generateId();
      const newConv: Conversation = {
        id: convId,
        title: text.length > 60 ? text.slice(0, 60) + '...' : text,
        messages: [],
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(convId);
    } else {
      messages = activeConversation?.messages || [];
    }

    const userMessage: Message = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];

    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, messages: updatedMessages } : c)),
    );

    setIsStreaming(true);
    setStreamingContent('');

    let fullResponse = '';

    await streamChat(
      updatedMessages,
      (chunk) => {
        fullResponse += chunk;
        setStreamingContent(fullResponse);
      },
      () => {
        const assistantMessage: Message = { role: 'assistant', content: fullResponse };
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId ? { ...c, messages: [...updatedMessages, assistantMessage] } : c,
          ),
        );
        setIsStreaming(false);
        setStreamingContent('');
      },
      (error) => {
        const errorMessage: Message = {
          role: 'assistant',
          content: `I encountered an error while processing your question. Please try again.\n\nError: ${error}`,
        };
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId ? { ...c, messages: [...updatedMessages, errorMessage] } : c,
          ),
        );
        setIsStreaming(false);
        setStreamingContent('');
      },
    );
  }

  function handleCopyConversation() {
    if (!activeConversation) return;
    void navigator.clipboard.writeText(
      activeConversation.messages
        .map((m) => `${m.role === 'user' ? 'Question' : 'Answer'}: ${m.content}`)
        .join('\n\n---\n\n'),
    );
  }

  const showHero = activeConvId === null;

  return (
    <div className="h-screen flex overflow-hidden">
      <div className="hidden lg:block">
        <Sidebar
          conversations={conversations}
          activeId={activeConvId}
          onSelect={handleSelectConversation}
          onNew={handleNewConversation}
        />
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 gap-0 border-parchment-dark p-0 lg:hidden [&>button]:hidden">
          <Sidebar
            conversations={conversations}
            activeId={activeConvId}
            onSelect={handleSelectConversation}
            onNew={handleNewConversation}
          />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 h-full flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-parchment-dark bg-parchment/80 px-4 py-3 backdrop-blur-sm">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            className="rounded-lg lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <IconMenu className="h-5 w-5 text-navy/60" />
          </Button>
          <div className="hidden lg:block" />
          <Logo size="small" />
          {activeConversation ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-lg"
              title="Copy conversation"
              aria-label="Copy conversation"
              onClick={() => handleCopyConversation()}
            >
              <IconCopy className="h-4 w-4 text-navy/50" />
            </Button>
          ) : (
            <div className="w-9" />
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-chat mx-auto">
            {showHero ? (
              <div className="flex min-h-[60vh] flex-col items-center justify-center">
                <Logo size="large" />
                <StarterQuestions onSelect={handleSendMessage} />
              </div>
            ) : (
              <div className="space-y-6">
                {activeConversation?.messages.map((msg, i) => (
                  <div key={`${msg.role}-${i}`}>
                    {msg.role === 'user' ? (
                      <div className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-navy px-5 py-3 font-body text-white">
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-parchment-dark bg-white/60 p-5">
                        <ResponseDisplay
                          content={msg.content}
                          isStreaming={false}
                          onFollowUp={handleSendMessage}
                        />
                      </div>
                    )}
                  </div>
                ))}

                {isStreaming && streamingContent && (
                  <div className="rounded-xl border border-parchment-dark bg-white/60 p-5">
                    <ResponseDisplay content={streamingContent} isStreaming={true} />
                  </div>
                )}

                {isStreaming && !streamingContent && <TypingIndicator />}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-parchment-dark bg-parchment/80 px-4 py-4 backdrop-blur-sm">
          <div className="max-w-chat mx-auto">
            <ChatInput onSubmit={handleSendMessage} disabled={isStreaming} />
          </div>
        </div>

        <div className="shrink-0 border-t border-parchment-dark bg-parchment px-4 py-2">
          <p className="mx-auto max-w-chat text-center font-body text-xs text-navy/40">
            KosherGPT is an AI research tool for learning and exploration. It does not replace the psak
            (ruling) of a qualified rabbi. Always consult your Local Orthodox Rabbi (LOR) for practical
            halachic decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
