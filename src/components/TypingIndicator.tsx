import { MODE_META } from '@/lib/modes';
import type { StudyMode } from '@/types/chat';

interface TypingIndicatorProps {
  mode?: StudyMode;
}

export function TypingIndicator({ mode = 'research' }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-3 px-2 py-3">
      <div className="flex gap-1">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
      <span className="font-sketch text-lg text-ink/45">{MODE_META[mode].typingMessage}</span>
    </div>
  );
}
