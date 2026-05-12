import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { IconSend } from './icons';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
  replyPreview?: string | null;
  onClearReply?: () => void;
}

export function ChatInput({
  onSubmit,
  disabled,
  placeholder,
  replyPreview,
  onClearReply,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    /* Reset scrollHeight so clearing input always shrinks the box (fixes “grows each message”). */
    el.style.height = '0px';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  function submit() {
    if (input.trim() && !disabled) {
      onSubmit(input.trim());
      setInput('');
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submit();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative space-y-2">
      {replyPreview ? (
        <div className="mx-auto flex w-full max-w-chat items-start justify-between gap-2 rounded-lg border border-gold/30 bg-gold/5 px-3 py-2 font-body text-xs text-navy/80">
          <p className="min-w-0 flex-1 whitespace-pre-wrap break-words leading-snug">
            <span className="font-heading text-[0.65rem] font-bold uppercase tracking-wide text-navy/45">
              Reply to
            </span>
            <br />
            <span className="text-navy/70">{replyPreview}</span>
          </p>
          {onClearReply ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto shrink-0 px-2 py-1 text-xs shadow-none text-navy/50 hover:text-navy"
              onClick={onClearReply}
            >
              Dismiss
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-chat items-center gap-2 rounded-xl border border-parchment-dark bg-white px-3 py-2 shadow-sm transition-all duration-200 focus-within:border-gold/60 focus-within:shadow-md">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            placeholder || 'Ask a question about Torah, halacha, or Jewish texts...'
          }
          disabled={disabled}
          rows={1}
          className="min-h-11 flex-1 resize-none border-0 bg-transparent px-1 py-1.5 font-body text-base text-navy placeholder:text-navy/40 shadow-none focus-visible:border-0 focus-visible:ring-0 md:text-[15px] leading-relaxed rounded-md"
        />
        <Button
          type="submit"
          variant="default"
          size="icon-lg"
          disabled={disabled || !input.trim()}
          className="shrink-0 rounded-lg bg-gold text-white hover:bg-gold-light disabled:opacity-40"
          aria-label="Send message"
        >
          <IconSend className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
