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
        <div className="mx-auto flex w-full max-w-chat items-start justify-between gap-2 rounded-md border border-gold/25 bg-gold-muted/40 px-3 py-2 font-body text-xs text-ink/80">
          <p className="min-w-0 flex-1 whitespace-pre-wrap break-words leading-snug">
            <span className="font-sketch text-base text-gold">replying to</span>
            <br />
            <span className="text-ink/65">{replyPreview}</span>
          </p>
          {onClearReply ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto shrink-0 px-2 py-1 text-xs text-ink/45 shadow-none hover:text-ink"
              onClick={onClearReply}
            >
              Dismiss
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-chat items-end gap-2 rounded-md border border-parchment-dark bg-white px-3 py-2 shadow-soft transition-all duration-200 focus-within:border-gold/40 focus-within:shadow-sketch">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            placeholder || 'Ask about Torah, halacha, or Jewish texts…'
          }
          disabled={disabled}
          rows={1}
          className="min-h-10 flex-1 resize-none rounded-sm border-0 bg-transparent px-1 py-1.5 font-body text-[15px] leading-relaxed text-ink placeholder:text-ink/35 shadow-none focus-visible:border-0 focus-visible:ring-0"
        />
        <Button
          type="submit"
          variant="default"
          size="icon-lg"
          disabled={disabled || !input.trim()}
          className="mb-0.5 shrink-0 rounded-md bg-gold text-white shadow-sketch hover:bg-gold-light disabled:opacity-35"
          aria-label="Send message"
        >
          <IconSend className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
